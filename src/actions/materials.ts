"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { materialSchema, type MaterialFormData } from "@/schemas/material";
import { serialize } from "@/lib/serialize";
import { Decimal } from "@prisma/client/runtime/library";

export async function getMaterials(options?: { page?: number; limit?: number }) {
  await requirePermission("materials", "view");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 100;

  const [data, total] = await Promise.all([
    prisma.material.findMany({
      where: { deletedAt: null },
      include: { category: true, supplier: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.material.count({ where: { deletedAt: null } }),
  ]);
  return { data: serialize(data), total };
}

export async function getMaterial(id: string) {
  await requirePermission("materials", "view");

  const result = await prisma.material.findUnique({
    where: { id, deletedAt: null },
    include: {
      category: true,
      supplier: true,
      prices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return serialize(result);
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

export async function createMaterialCategory(data: { name: string; description?: string }) {
  await requirePermission("materials", "edit");

  return prisma.materialCategory.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

export async function updateMaterialCategory(id: string, data: { name: string; description?: string }) {
  await requirePermission("materials", "edit");

  return prisma.materialCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
    },
  });
}

export async function deleteMaterialCategory(id: string) {
  await requirePermission("materials", "edit");

  // Check if any materials use this category
  const materialCount = await prisma.material.count({
    where: { categoryId: id, deletedAt: null },
  });

  if (materialCount > 0) {
    throw new Error(`Danh mục đang được sử dụng bởi ${materialCount} vật liệu. Không thể xóa.`);
  }

  await prisma.materialCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/materials");
}

export async function addManualPrice(
  materialId: string,
  data: { price: number; notes?: string }
) {
  await requirePermission("materials", "edit");

  await prisma.materialPrice.create({
    data: {
      materialId,
      price: new Decimal(data.price),
      source: "MANUAL",
      notes: data.notes || null,
    },
  });

  revalidatePath("/materials");
}
