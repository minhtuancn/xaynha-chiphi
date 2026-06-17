"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { inventorySchema, type InventoryFormData } from "@/schemas/inventory";
import { serialize } from "@/lib/serialize";
import { Decimal } from "@prisma/client/runtime/library";

export async function getInventoryTransactions(options?: { page?: number; limit?: number }) {
  await requirePermission("inventory", "view");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;

  const [data, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      include: {
        material: {
          select: { id: true, name: true, unit: true },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.inventoryTransaction.count(),
  ]);
  return serialize({ data, total });
}

export async function getInventoryByMaterial() {
  await requirePermission("inventory", "view");

  const result = await prisma.material.findMany({
    where: { deletedAt: null },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return serialize(result);
}

export async function createTransaction(data: InventoryFormData) {
  await requirePermission("inventory", "create");

  const validated = inventorySchema.parse(data);

  const quantityNum = Number(validated.quantity);
  let stockAdjustment: number;

  switch (validated.type) {
    case "IN":
    case "RETURN":
      stockAdjustment = quantityNum;
      break;
    case "OUT":
    case "USAGE":
      stockAdjustment = -quantityNum;
      break;
    case "ADJUSTMENT":
      stockAdjustment = 0; // set absolute value
      break;
  }

  if (validated.type === "OUT" || validated.type === "USAGE") {
    const material = await prisma.material.findUnique({
      where: { id: validated.materialId, deletedAt: null },
      select: { currentStock: true },
    });
    if (!material) throw new Error("Vật liệu không tồn tại");
    if (Number(material.currentStock) < quantityNum) {
      throw new Error("Số lượng xuất vượt quá tồn kho hiện tại");
    }
  }

  const txData = {
    materialId: validated.materialId,
    type: validated.type,
    quantity: new Decimal(validated.quantity),
    date: validated.date,
    reference: validated.reference || null,
    notes: validated.notes || null,
    ...(validated.projectId ? { projectId: validated.projectId } : {}),
    ...(validated.purchaseOrderId ? { purchaseOrderId: validated.purchaseOrderId } : {}),
  };

  await prisma.$transaction(async (tx) => {
    await tx.inventoryTransaction.create({ data: txData });

    if (validated.type === "ADJUSTMENT") {
      await tx.material.update({
        where: { id: validated.materialId },
        data: { currentStock: new Decimal(quantityNum) },
      });
    } else {
      await tx.material.update({
        where: { id: validated.materialId },
        data: { currentStock: { increment: stockAdjustment } },
      });
    }

    // For USAGE, also create a MaterialUsage record inside the same transaction
    if (validated.type === "USAGE" && validated.projectId) {
      const dailyLog = await tx.dailyLog.findFirst({
        where: { projectId: validated.projectId, deletedAt: null },
        orderBy: { date: "desc" },
      });

      await tx.materialUsage.create({
        data: {
          materialId: validated.materialId,
          projectId: validated.projectId,
          quantity: new Decimal(quantityNum),
          date: validated.date,
          ...(dailyLog ? { dailyLogId: dailyLog.id } : {}),
          notes: validated.notes || null,
        },
      });
    }
  });

  revalidatePath("/inventory");
}
