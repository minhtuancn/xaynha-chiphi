"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { inventorySchema, type InventoryFormData } from "@/schemas/inventory";
import { Decimal } from "@prisma/client/runtime/library";

export async function getInventoryTransactions() {
  await requirePermission("inventory", "view");

  return prisma.inventoryTransaction.findMany({
    include: {
      material: {
        select: { id: true, name: true, unit: true },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getInventoryByMaterial() {
  await requirePermission("inventory", "view");

  return prisma.material.findMany({
    where: { deletedAt: null },
    include: {
      category: {
        select: { id: true, name: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function createTransaction(data: InventoryFormData) {
  await requirePermission("inventory", "create");

  const validated = inventorySchema.parse(data);

  const material = await prisma.material.findUnique({
    where: { id: validated.materialId, deletedAt: null },
  });

  if (!material) throw new Error("Vật liệu không tồn tại");

  const quantity = new Decimal(validated.quantity);
  let newStock: Decimal;

  switch (validated.type) {
    case "IN":
      newStock = material.currentStock.add(quantity);
      break;
    case "OUT":
      newStock = material.currentStock.sub(quantity);
      if (newStock.lessThan(0)) {
        throw new Error("Số lượng xuất vượt quá tồn kho hiện tại");
      }
      break;
    case "ADJUSTMENT":
      newStock = quantity;
      break;
  }

  await prisma.$transaction([
    prisma.inventoryTransaction.create({
      data: {
        materialId: validated.materialId,
        type: validated.type,
        quantity,
        date: validated.date,
        reference: validated.reference || null,
        notes: validated.notes || null,
      },
    }),
    prisma.material.update({
      where: { id: validated.materialId },
      data: { currentStock: newStock },
    }),
  ]);

  revalidatePath("/inventory");
}
