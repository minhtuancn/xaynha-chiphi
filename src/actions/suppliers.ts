"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { supplierSchema, type SupplierFormData } from "@/schemas/supplier";

export async function getSuppliers() {
  await requirePermission("suppliers", "view");

  return prisma.supplier.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { purchaseOrders: { where: { deletedAt: null } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupplier(id: string) {
  await requirePermission("suppliers", "view");

  return prisma.supplier.findUnique({
    where: { id, deletedAt: null },
    include: {
      purchaseOrders: {
        where: { deletedAt: null },
        orderBy: { orderDate: "desc" },
      },
      debts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createSupplier(data: SupplierFormData) {
  await requirePermission("suppliers", "create");

  const validated = supplierSchema.parse(data);

  await prisma.supplier.create({
    data: {
      name: validated.name,
      contact: validated.contact || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      taxCode: validated.taxCode || null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(id: string, data: SupplierFormData) {
  await requirePermission("suppliers", "edit");

  const validated = supplierSchema.parse(data);

  await prisma.supplier.update({
    where: { id },
    data: {
      name: validated.name,
      contact: validated.contact || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      taxCode: validated.taxCode || null,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  await requirePermission("suppliers", "delete");

  await prisma.supplier.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/suppliers");
}
