"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { materialUsageSchema } from "@/schemas/material-usage";
import { saveUploadedPhoto } from "@/lib/upload";
import { getProjectScope } from "./project-scope";
import { serialize } from "@/lib/serialize";
import { Decimal } from "@prisma/client/runtime/library";

export async function getMaterialUsages() {
  await requirePermission("materialUsage", "view");

  const projectScope = await getProjectScope();

  const result = await prisma.materialUsage.findMany({
    where: { ...(projectScope ? { projectId: projectScope } : {}) },
    include: {
      material: { select: { id: true, name: true, unit: true } },
      dailyLog: { select: { id: true, date: true } },
      task: { select: { id: true, name: true } },
      photos: { select: { id: true, url: true, caption: true } },
    },
    orderBy: { date: "desc" },
  });
  return serialize(result);
}

export async function createMaterialUsage(
  data: {
    materialId: string;
    dailyLogId?: string;
    taskId?: string;
    projectId: string;
    quantity: number;
    date: Date;
    notes?: string;
  },
  photos?: File[]
) {
  await requirePermission("materialUsage", "create");

  const validated = materialUsageSchema.parse(data);

  const quantity = new Decimal(validated.quantity);

  const usage = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findUnique({
      where: { id: validated.materialId, deletedAt: null },
      select: { currentStock: true },
    });
    if (!material) throw new Error("Vật liệu không tồn tại");
    if (Number(material.currentStock) < Number(validated.quantity)) {
      throw new Error("Số lượng sử dụng vượt quá tồn kho hiện tại");
    }

    const created = await tx.materialUsage.create({
      data: {
        materialId: validated.materialId,
        dailyLogId: validated.dailyLogId || null,
        taskId: validated.taskId || null,
        projectId: validated.projectId,
        quantity,
        date: validated.date,
        notes: validated.notes || null,
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        materialId: validated.materialId,
        type: "USAGE",
        quantity,
        date: validated.date,
        reference: `USAGE-${created.id}`,
        notes: validated.notes || null,
        projectId: validated.projectId,
      },
    });

    await tx.material.update({
      where: { id: validated.materialId },
      data: { currentStock: { decrement: quantity } },
    });

    return created;
  });

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        const url = await saveUploadedPhoto(photo, "material-usage");
        await prisma.materialUsagePhoto.create({
          data: {
            materialUsageId: usage.id,
            url,
          },
        });
      } catch (err: unknown) {
        console.error("Failed to save photo:", err);
      }
    }
  }

  revalidatePath("/material-usage");
  revalidatePath("/inventory");
}

export async function deleteMaterialUsage(id: string) {
  await requirePermission("materialUsage", "delete");

  await prisma.$transaction(async (tx) => {
    const usage = await tx.materialUsage.findUnique({ where: { id } });
    if (!usage) throw new Error("Bản ghi không tồn tại");

    // Restore stock when deleting a usage record.
    await tx.material.update({
      where: { id: usage.materialId },
      data: { currentStock: { increment: usage.quantity } },
    });

    // Remove the linked inventory transaction (USAGE) so the ledger stays consistent.
    await tx.inventoryTransaction.deleteMany({
      where: { reference: "USAGE-" + id },
    });

    await tx.materialUsagePhoto.deleteMany({ where: { materialUsageId: id } });
    await tx.materialUsage.delete({ where: { id } });
  });

  revalidatePath("/material-usage");
  revalidatePath("/inventory");
}
