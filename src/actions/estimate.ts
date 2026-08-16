'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import {
  createEstimateSchema,
  updateEstimateSchema,
  estimateItemSchema,
  bulkUpsertEstimateItemsSchema,
  compareEstimatesSchema,
  importEstimateSchema,
  syncProgressResultSchema,
  CreateEstimateInput,
  UpdateEstimateInput,
  EstimateItemInput,
  BulkUpsertEstimateItemsInput,
  CompareEstimatesInput,
  ImportEstimateInput,
} from '@/schemas/estimate';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { serialize } from '@/lib/serialize';
import { escapeCSV } from '@/lib/csv';

async function getCurrentUser(action: 'view' | 'create' | 'edit' | 'delete' = 'view') {
  return requirePermission('estimates', action);
}

async function requireEstimatePermission(action: 'view' | 'create' | 'edit' | 'delete') {
  return requirePermission('estimates', action);
}

// ============================================
// ESTIMATE CRUD
// ============================================

export async function createEstimate(input: CreateEstimateInput) {
  const user = await getCurrentUser("create");
  const data = createEstimateSchema.parse(input);

  // Version computation and item copy run in one transaction; a unique-
  // constraint race (concurrent creates) is retried with the fresh version.
  let estimate: Awaited<ReturnType<typeof prisma.estimate.create>> | null = null;

  for (let attempt = 0; attempt < 3 && !estimate; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const latestEstimate = await tx.estimate.findFirst({
          where: { projectId: data.projectId },
          orderBy: { version: 'desc' },
        });

        const newVersion = (latestEstimate?.version ?? 0) + 1;

        // Create new estimate as DRAFT
        const created = await tx.estimate.create({
          data: {
            projectId: data.projectId,
            version: newVersion,
            name: data.name,
            status: 'DRAFT',
            createdBy: user.id,
            totalAmount: 0,
          },
        });

        // If there's an active estimate, copy its items to the new one
        const activeEstimate = await tx.estimate.findFirst({
          where: { projectId: data.projectId, status: 'ACTIVE' },
          include: { items: true },
        });

        if (activeEstimate) {
          await tx.estimateItem.createMany({
            data: activeEstimate.items.map((item) => ({
              estimateId: created.id,
              stageId: item.stageId,
              code: item.code,
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
              costType: item.costType,
              contractor: item.contractor,
              progressPct: item.progressPct,
              actualQuantity: item.actualQuantity,
              notes: item.notes,
              sortOrder: item.sortOrder,
            })),
          });
        }

        return created;
      });
      estimate = result;
    } catch (err) {
      // P2002: unique constraint on (projectId, version) — concurrent create.
      if ((err as { code?: string })?.code === "P2002") continue;
      throw err;
    }
  }

  if (!estimate) {
    throw new Error("Không thể tạo phiên bản dự toán, vui lòng thử lại");
  }

  // Recalculate total from the copied items
  await recalcEstimateTotals(estimate.id);

  revalidatePath(`/projects/${data.projectId}/estimate`);
  return serialize(estimate);
}

export async function getEstimatesByProject(projectId: string) {
  const user = await getCurrentUser("view");

  return serialize(
    await prisma.estimate.findMany({
      where: { projectId },
      orderBy: { version: 'desc' },
      include: {
        _count: { select: { items: true } },
      },
    })
  );
}

export async function getEstimateWithItems(estimateId: string) {
  const user = await getCurrentUser("view");

  return serialize(
    await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        items: {
          include: {
            stage: { select: { id: true, name: true, order: true } },
          },
          orderBy: [{ stage: { order: 'asc' } }, { sortOrder: 'asc' }],
        },
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    })
  );
}

export async function updateEstimate(input: UpdateEstimateInput) {
  const user = await getCurrentUser("edit");
  const data = updateEstimateSchema.parse(input);

  const estimate = await prisma.estimate.update({
    where: { id: data.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  revalidatePath(`/projects/${estimate.projectId}/estimate`);
  return serialize(estimate);
}

export async function activateEstimate(estimateId: string) {
  const user = await getCurrentUser("edit");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: { project: true },
  });

  if (!estimate) throw new Error('Estimate not found');

  // Archive current active + activate this one atomically, so a failure
  // between the two steps can never leave the project without an ACTIVE.
  const activated = await prisma.$transaction(async (tx) => {
    await tx.estimate.updateMany({
      where: { projectId: estimate.projectId, status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    });

    return tx.estimate.update({
      where: { id: estimateId },
      data: { status: 'ACTIVE' },
    });
  });

  revalidatePath(`/projects/${estimate.projectId}/estimate`);
  return serialize(activated);
}

export async function archiveEstimate(estimateId: string) {
  const user = await getCurrentUser("edit");

  const estimate = await prisma.estimate.update({
    where: { id: estimateId },
    data: { status: 'ARCHIVED' },
  });

  revalidatePath(`/projects/${estimate.projectId}/estimate`);
  return serialize(estimate);
}

export async function deleteEstimate(estimateId: string) {
  const user = await getCurrentUser("delete");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
  });

  if (!estimate) throw new Error('Estimate not found');
  if (estimate.status !== 'DRAFT') {
    throw new Error('Chỉ có thể xóa bản DRAFT');
  }

  await prisma.estimate.delete({ where: { id: estimateId } });

  revalidatePath(`/projects/${estimate.projectId}/estimate`);
  return { success: true };
}

// ============================================
// ESTIMATE ITEM CRUD
// ============================================

/** Throws unless the estimate exists and is still DRAFT (items are locked once ACTIVE/ARCHIVED). */
async function assertEstimateDraft(estimateId: string) {
  const estimate = await prisma.estimate.findUnique({ where: { id: estimateId } });
  if (!estimate) throw new Error("Không tìm thấy bản dự toán");
  if (estimate.status !== "DRAFT") {
    throw new Error("Chỉ có thể chỉnh sửa bản dự toán ở trạng thái Nháp");
  }
  return estimate;
}

export async function createEstimateItem(input: EstimateItemInput) {
  const user = await getCurrentUser("edit");
  const data = estimateItemSchema.parse(input);

  await assertEstimateDraft(data.estimateId);

  const amount = data.quantity * data.unitPrice;

  const item = await prisma.estimateItem.create({
    data: {
      estimateId: data.estimateId,
      stageId: data.stageId,
      code: data.code,
      name: data.name,
      unit: data.unit,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      amount,
      costType: data.costType,
      contractor: data.contractor,
      progressPct: data.progressPct,
      actualQuantity: data.actualQuantity,
      notes: data.notes,
      sortOrder: data.sortOrder,
    },
  });

  await recalcEstimateTotals(data.estimateId);
  revalidatePath(`/projects/*/estimate`);
  return serialize(item);
}

export async function updateEstimateItem(itemId: string, input: Partial<EstimateItemInput>) {
  const user = await getCurrentUser("edit");
  const data = estimateItemSchema.partial().parse(input);

  const item = await prisma.estimateItem.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new Error('Item not found');

  await assertEstimateDraft(item.estimateId);

  const updateData: Prisma.EstimateItemUpdateInput = { ...data };
  if (data.quantity !== undefined || data.unitPrice !== undefined) {
    const quantity = Number(data.quantity ?? item.quantity);
    const unitPrice = Number(data.unitPrice ?? item.unitPrice);
    updateData.amount = quantity * unitPrice;
  }

  const updated = await prisma.estimateItem.update({
    where: { id: itemId },
    data: updateData,
  });

  await recalcEstimateTotals(item.estimateId);
  revalidatePath(`/projects/*/estimate`);
  return serialize(updated);
}

export async function deleteEstimateItem(itemId: string) {
  const user = await getCurrentUser("delete");

  const item = await prisma.estimateItem.findUnique({
    where: { id: itemId },
  });

  if (!item) throw new Error('Item not found');

  await assertEstimateDraft(item.estimateId);

  await prisma.estimateItem.delete({ where: { id: itemId } });

  await recalcEstimateTotals(item.estimateId);
  revalidatePath(`/projects/*/estimate`);
  return { success: true };
}

export async function bulkUpsertEstimateItems(input: BulkUpsertEstimateItemsInput) {
  const user = await getCurrentUser("edit");
  const data = bulkUpsertEstimateItemsSchema.parse(input);

  await assertEstimateDraft(data.estimateId);

  const results = await prisma.$transaction(async (tx) => {
    const created: typeof data.items = [];
    const updated: typeof data.items = [];

    for (const item of data.items) {
      const amount = item.quantity * item.unitPrice;

      if (item.id) {
        // Update existing
        const existing = await tx.estimateItem.findUnique({ where: { id: item.id } });
        if (existing && existing.estimateId === data.estimateId) {
          await tx.estimateItem.update({
            where: { id: item.id },
            data: {
              stageId: item.stageId,
              code: item.code,
              name: item.name,
              unit: item.unit,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount,
              costType: item.costType,
              contractor: item.contractor,
              progressPct: item.progressPct,
              actualQuantity: item.actualQuantity,
              notes: item.notes,
              sortOrder: item.sortOrder,
            },
          });
          updated.push(item);
        }
      } else {
        // Create new
        const createdItem = await tx.estimateItem.create({
          data: {
            estimateId: data.estimateId,
            stageId: item.stageId,
            code: item.code,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount,
            costType: item.costType,
            contractor: item.contractor,
            progressPct: item.progressPct,
            actualQuantity: item.actualQuantity,
            notes: item.notes,
            sortOrder: item.sortOrder,
          },
        });
        created.push({ ...item, id: createdItem.id });
      }
    }

    return { created, updated };
  });

  await recalcEstimateTotals(data.estimateId);
  revalidatePath(`/projects/*/estimate`);
  return serialize(results);
}

export async function recalcEstimateTotals(estimateId: string) {
  const user = await getCurrentUser("edit");

  const items = await prisma.estimateItem.findMany({
    where: { estimateId },
    select: { amount: true },
  });

  // Decimal accumulation avoids float drift across many items.
  const totalAmount = items.reduce(
    (sum, item) => sum.plus(new Decimal(item.amount.toString())),
    new Decimal(0)
  );

  await prisma.estimate.update({
    where: { id: estimateId },
    data: { totalAmount },
  });

  return totalAmount;
}

// ============================================
// PROGRESS SYNC FROM DAILY LOGS
// ============================================

export async function syncProgressFromLogs(estimateId: string) {
  const user = await getCurrentUser("edit");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      items: {
        include: { stage: true },
      },
    },
  });

  if (!estimate) throw new Error('Estimate not found');

  const errors: string[] = [];
  let updated = 0;

  for (const item of estimate.items) {
    if (!item.stageId) continue;

    try {
      // Get material usages for this stage via task linkage
      const usages = await prisma.materialUsage.findMany({
        where: {
          projectId: estimate.projectId,
          task: { stageId: item.stageId },
        },
      });

      const totalActualQty = usages.reduce((sum, u) => sum + Number(u.quantity), 0);
      const progressPct = Number(item.quantity) > 0
        ? Math.min(100, Math.round((totalActualQty / Number(item.quantity)) * 100))
        : 0;

      await prisma.estimateItem.update({
        where: { id: item.id },
        data: {
          actualQuantity: totalActualQty,
          progressPct,
        },
      });
      updated++;
    } catch (e) {
      errors.push(`Item ${item.code}: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  }

  await recalcEstimateTotals(estimateId);
  revalidatePath(`/projects/*/estimate`);

  return syncProgressResultSchema.parse({ updated, errors });
}

// ============================================
// COMPARE ESTIMATES
// ============================================

export async function compareEstimates(input: CompareEstimatesInput) {
  const user = await getCurrentUser("view");
  const data = compareEstimatesSchema.parse(input);

  const [est1, est2] = await Promise.all([
    prisma.estimate.findUnique({
      where: { id: data.estimateId1 },
      include: { items: true },
    }),
    prisma.estimate.findUnique({
      where: { id: data.estimateId2 },
      include: { items: true },
    }),
  ]);

  if (!est1 || !est2) throw new Error('One or both estimates not found');

  const items1 = new Map(est1.items.map((i) => [i.code, i]));
  const items2 = new Map(est2.items.map((i) => [i.code, i]));
  const allCodes = new Set([...items1.keys(), ...items2.keys()]);

  const diffs = [];
  let totalAdded = 0, totalRemoved = 0, totalChanged = 0;

  for (const code of allCodes) {
    const i1 = items1.get(code);
    const i2 = items2.get(code);

    if (i1 && !i2) {
      diffs.push({
        code: i1.code,
        name: i1.name,
        unit: i1.unit,
        quantity1: Number(i1.quantity),
        quantity2: null,
        unitPrice1: Number(i1.unitPrice),
        unitPrice2: null,
        amount1: Number(i1.amount),
        amount2: null,
        costType1: i1.costType,
        costType2: null,
        contractor1: i1.contractor,
        contractor2: null,
        stageId1: i1.stageId,
        stageId2: null,
        progressPct1: i1.progressPct,
        progressPct2: null,
        actualQuantity1: Number(i1.actualQuantity),
        actualQuantity2: null,
        diffType: 'REMOVED' as const,
      });
      totalRemoved++;
    } else if (!i1 && i2) {
      diffs.push({
        code: i2.code,
        name: i2.name,
        unit: i2.unit,
        quantity1: null,
        quantity2: Number(i2.quantity),
        unitPrice1: null,
        unitPrice2: Number(i2.unitPrice),
        amount1: null,
        amount2: Number(i2.amount),
        costType1: null,
        costType2: i2.costType,
        contractor1: null,
        contractor2: i2.contractor,
        stageId1: null,
        stageId2: i2.stageId,
        progressPct1: null,
        progressPct2: i2.progressPct,
        actualQuantity1: null,
        actualQuantity2: Number(i2.actualQuantity),
        diffType: 'ADDED' as const,
      });
      totalAdded++;
    } else if (i1 && i2) {
      const changed =
        Number(i1.quantity) !== Number(i2.quantity) ||
        Number(i1.unitPrice) !== Number(i2.unitPrice) ||
        i1.costType !== i2.costType ||
        i1.contractor !== i2.contractor ||
        i1.stageId !== i2.stageId;

      if (changed) {
        diffs.push({
          code: i1.code,
          name: i1.name,
          unit: i1.unit,
          quantity1: Number(i1.quantity),
          quantity2: Number(i2.quantity),
          unitPrice1: Number(i1.unitPrice),
          unitPrice2: Number(i2.unitPrice),
          amount1: Number(i1.amount),
          amount2: Number(i2.amount),
          costType1: i1.costType,
          costType2: i2.costType,
          contractor1: i1.contractor,
          contractor2: i2.contractor,
          stageId1: i1.stageId,
          stageId2: i2.stageId,
          progressPct1: i1.progressPct,
          progressPct2: i2.progressPct,
          actualQuantity1: Number(i1.actualQuantity),
          actualQuantity2: Number(i2.actualQuantity),
          diffType: 'CHANGED' as const,
        });
        totalChanged++;
      } else {
        diffs.push({
          code: i1.code,
          name: i1.name,
          unit: i1.unit,
          quantity1: Number(i1.quantity),
          quantity2: Number(i2.quantity),
          unitPrice1: Number(i1.unitPrice),
          unitPrice2: Number(i2.unitPrice),
          amount1: Number(i1.amount),
          amount2: Number(i2.amount),
          costType1: i1.costType,
          costType2: i2.costType,
          contractor1: i1.contractor,
          contractor2: i2.contractor,
          stageId1: i1.stageId,
          stageId2: i2.stageId,
          progressPct1: i1.progressPct,
          progressPct2: i2.progressPct,
          actualQuantity1: Number(i1.actualQuantity),
          actualQuantity2: Number(i2.actualQuantity),
          diffType: 'SAME' as const,
        });
      }
    }
  }

  const amountDiff = Number(est2.totalAmount) - Number(est1.totalAmount);

  return {
    estimate1: {
      id: est1.id,
      version: est1.version,
      name: est1.name,
      totalAmount: Number(est1.totalAmount),
    },
    estimate2: {
      id: est2.id,
      version: est2.version,
      name: est2.name,
      totalAmount: Number(est2.totalAmount),
    },
    diffs,
    summary: {
      totalAdded,
      totalRemoved,
      totalChanged,
      amountDiff,
    },
  };
}

// ============================================
// IMPORT / EXPORT
// ============================================

export async function importEstimateFromCSV(input: ImportEstimateInput) {
  const user = await getCurrentUser("edit");
  const data = importEstimateSchema.parse(input);

  // Convert to EstimateItemInput format
  const items = data.rows.map((row) => ({
    estimateId: data.estimateId,
    stageId: row.stageId,
    code: row.code,
    name: row.name,
    unit: row.unit,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    costType: row.costType,
    contractor: row.contractor,
    progressPct: row.progressPct,
    actualQuantity: row.actualQuantity,
    notes: row.notes,
    sortOrder: row.sortOrder,
  }));

  return bulkUpsertEstimateItems({ estimateId: data.estimateId, items });
}

export async function exportEstimateToCSV(estimateId: string) {
  const user = await getCurrentUser("view");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      items: {
        include: { stage: { select: { name: true } } },
        orderBy: [{ stage: { order: 'asc' } }, { sortOrder: 'asc' }],
      },
    },
  });

  if (!estimate) throw new Error('Estimate not found');

  const headers = [
    'Mã CP', 'Hạng mục', 'ĐVT', 'SL dự toán', 'Đơn giá', 'Thành tiền',
    'Loại CP', 'Giai đoạn', 'Nhà thầu', '% HT', 'SL thực tế', 'Chênh lệch', 'Ghi chú'
  ];

  // Neutralize spreadsheet formula injection: any cell starting with = + - @
  // gets a leading apostrophe so it renders as text in Excel/Sheets.
  const safeCell = (val: unknown): string => {
    const s = String(val ?? '');
    return /^[=+\-@]/.test(s) ? `'${s}` : s;
  };

  const rows = estimate.items.map((item) => [
    item.code,
    item.name,
    item.unit,
    item.quantity.toString(),
    item.unitPrice.toString(),
    item.amount.toString(),
    item.costType,
    item.stage?.name || '',
    item.contractor || '',
    item.progressPct.toString(),
    item.actualQuantity.toString(),
    (Number(item.actualQuantity) - Number(item.quantity)).toString(),
    item.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => escapeCSV(safeCell(c))).join(',')),
  ].join('\n');

  return csvContent;
}

export async function downloadEstimateCSV(estimateId: string) {
  return exportEstimateToCSV(estimateId);
}

export async function exportEstimateToPDF(estimateId: string) {
  const user = await getCurrentUser("view");

  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      items: {
        include: { stage: { select: { name: true } } },
        orderBy: [{ stage: { order: 'asc' } }, { sortOrder: 'asc' }],
      },
      project: { select: { name: true } },
    },
  });

  if (!estimate) throw new Error('Estimate not found');

  const fmt = (n: any) =>
    new Intl.NumberFormat('vi-VN').format(Number(n));
  const cur = (n: any) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(Number(n));

  const { jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const pdf = new jsPDF('l', 'mm', 'a4');

  pdf.setFontSize(16);
  pdf.text(`BẢNG DỰ TOÁN - ${estimate.project?.name || ''}`, 14, 20);
  pdf.setFontSize(12);
  pdf.text(`${estimate.name} (v${estimate.version})`, 14, 28);
  pdf.setFontSize(9);
  pdf.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 14, 34);
  pdf.text(`Trạng thái: ${estimate.status === 'ACTIVE' ? 'Đang áp dụng' : estimate.status === 'DRAFT' ? 'Nháp' : 'Lưu trữ'}`, 140, 34);

  const headers = [['Mã CP', 'Hạng mục', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền', 'Loại CP', 'Giai đoạn', '% HT', 'Ghi chú']];
  const rows = estimate.items.map((item) => [
    item.code,
    item.name,
    item.unit,
    fmt(item.quantity),
    cur(item.unitPrice),
    cur(item.amount),
    item.costType,
    item.stage?.name || '',
    `${item.progressPct}%`,
    item.notes || '',
  ]);

  (pdf as any).autoTable({
    head: headers,
    body: rows,
    startY: 40,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 50 },
      5: { halign: 'right' },
    },
    didDrawPage: (data: any) => {
      pdf.setFontSize(7);
      pdf.text(`Trang ${data.pageNumber}`, 275, 10, { align: 'right' });
    },
  });

  const totalAmount = Number(estimate.totalAmount);
  const finalY = ((pdf as any).lastAutoTable?.finalY || 40) + 8;
  pdf.setFontSize(11);
  pdf.text(`Tổng cộng: ${cur(totalAmount)}`, 14, finalY);

  const pdfOutput = pdf.output('arraybuffer');
  const base64 = Buffer.from(pdfOutput).toString('base64');
  return base64;
}
