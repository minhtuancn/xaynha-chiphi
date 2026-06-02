"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { materialSchema, type MaterialFormData } from "@/schemas/material";
import { Decimal } from "@prisma/client/runtime/library";

export async function getMaterials() {
  await requirePermission("materials", "view");

  return prisma.material.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      supplier: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMaterial(id: string) {
  await requirePermission("materials", "view");

  return prisma.material.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      supplier: true,
    },
  });
}

export async function createMaterial(data: MaterialFormData) {
  await requirePermission("materials", "create");

  const validated = materialSchema.parse(data);

  await prisma.material.create({
    data: {
      name: validated.name,
      categoryId: validated.categoryId,
      unit: validated.unit,
      currentStock: new Decimal(validated.currentStock),
      minStock: new Decimal(validated.minStock),
      unitCost: new Decimal(validated.unitCost),
      supplierId: validated.supplierId || null,
    },
  });

  revalidatePath("/materials");
  redirect("/materials");
}

export async function updateMaterial(id: string, data: MaterialFormData) {
  await requirePermission("materials", "edit");

  const validated = materialSchema.parse(data);

  await prisma.material.update({
    where: { id },
    data: {
      name: validated.name,
      categoryId: validated.categoryId,
      unit: validated.unit,
      currentStock: new Decimal(validated.currentStock),
      minStock: new Decimal(validated.minStock),
      unitCost: new Decimal(validated.unitCost),
      supplierId: validated.supplierId || null,
    },
  });

  revalidatePath("/materials");
  redirect("/materials");
}

export async function deleteMaterial(id: string) {
  await requirePermission("materials", "delete");

  await prisma.material.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/materials");
}

export async function getMaterialCategories() {
  await requirePermission("materials", "view");

  return prisma.materialCategory.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
}
