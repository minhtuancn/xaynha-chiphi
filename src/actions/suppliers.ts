"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { supplierSchema, type SupplierFormData } from "@/schemas/supplier";
import { createNotificationForCurrentUser } from "./notifications";
import { logAudit } from "@/lib/audit";
import { serialize } from "@/lib/serialize";

async function notifyCurrentUser(type: string, message: string) {
  try {
    await createNotificationForCurrentUser({ type, message });
  } catch {
    // Notifications should not block supplier mutations.
  }
}

export async function getSuppliers() {
  await requirePermission("suppliers", "view");

  const result = await prisma.supplier.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { purchaseOrders: { where: { deletedAt: null } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(result);
}

export async function getSupplier(id: string) {
  await requirePermission("suppliers", "view");

  const result = await prisma.supplier.findUnique({
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
      _count: {
        select: { purchaseOrders: { where: { deletedAt: null } } },
      },
    },
  });
  return serialize(result);
}

export async function createSupplier(data: SupplierFormData) {
  const user = await requirePermission("suppliers", "create");

  const validated = supplierSchema.parse(data);

  const supplier = await prisma.supplier.create({
    data: {
      name: validated.name,
      contact: validated.contact || null,
      phone: validated.phone || null,
      email: validated.email || null,
      address: validated.address || null,
      taxCode: validated.taxCode || null,
      bankName: validated.bankName || null,
      bankAccountNumber: validated.bankAccountNumber || null,
      bankAccountHolder: validated.bankAccountHolder || null,
      bankBranch: validated.bankBranch || null,
      notes: validated.notes || null,
    },
  });

  await logAudit(user.id, "CREATE", "Supplier", supplier.id, {
    newValues: {
      name: validated.name,
      contact: validated.contact || null,
      phone: validated.phone || null,
    },
  });
  await notifyCurrentUser("SUCCESS", "Da tao nha cung cap moi");
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(id: string, data: SupplierFormData) {
  const user = await requirePermission("suppliers", "edit");

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
      bankName: validated.bankName || null,
      bankAccountNumber: validated.bankAccountNumber || null,
      bankAccountHolder: validated.bankAccountHolder || null,
      bankBranch: validated.bankBranch || null,
      notes: validated.notes || null,
    },
  });

  await logAudit(user.id, "UPDATE", "Supplier", id, {
    newValues: {
      name: validated.name,
      contact: validated.contact || null,
      phone: validated.phone || null,
    },
  });
  await notifyCurrentUser("INFO", "Da cap nhat thong tin nha cung cap");
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: string) {
  const user = await requirePermission("suppliers", "delete");

  await prisma.supplier.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit(user.id, "DELETE", "Supplier", id, {});
  await notifyCurrentUser("WARNING", "Da xoa nha cung cap");
  revalidatePath("/suppliers");
}
