"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { purchaseOrderSchema, type PurchaseOrderFormData } from "@/schemas/purchase-order";
import { createNotificationForCurrentUser } from "./notifications";
import { logAudit } from "@/lib/audit";
import { serialize } from "@/lib/serialize";

async function notifyCurrentUser(type: string, message: string) {
  try {
    await createNotificationForCurrentUser({ type, message });
  } catch {
    // Notifications should not block purchase order mutations.
  }
}

async function getDefaultPurchaseOrderExpenseCategory() {
  const preferredCategory = await prisma.expenseCategory.findFirst({
    where: { name: "Vật liệu xây dựng", deletedAt: null },
  });

  if (preferredCategory) return preferredCategory;

  const fallbackCategory = await prisma.expenseCategory.findFirst({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  if (!fallbackCategory) {
    throw new Error("Không có danh mục chi phí phù hợp để tạo chi phí tự động");
  }

  return fallbackCategory;
}

export async function getPurchaseOrders() {
  await requirePermission("purchaseOrders", "view");

  const result = await prisma.purchaseOrder.findMany({
    where: { deletedAt: null },
    include: {
      supplier: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, unit: true } },
        },
      },
    },
    orderBy: { orderDate: "desc" },
  });
  return serialize(result);
}

export async function getPurchaseOrder(id: string) {
  await requirePermission("purchaseOrders", "view");

  const result = await prisma.purchaseOrder.findUnique({
    where: { id, deletedAt: null },
    include: {
      supplier: true,
      project: { select: { id: true, name: true } },
      items: {
        include: {
          material: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createPurchaseOrder(data: PurchaseOrderFormData) {
  const user = await requirePermission("purchaseOrders", "create");

  const validated = purchaseOrderSchema.parse(data);

  const totalAmount = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const order = await prisma.purchaseOrder.create({
    data: {
      supplierId: validated.supplierId,
      projectId: validated.projectId,
      orderDate: validated.orderDate,
      deliveryDate: validated.deliveryDate || null,
      notes: validated.notes || null,
      totalAmount,
      items: {
        create: validated.items.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
    },
  });

  await logAudit(user.id, "CREATE", "PurchaseOrder", order.id, {
    newValues: {
      supplierId: validated.supplierId,
      projectId: validated.projectId,
      status: "DRAFT",
      totalAmount,
    },
  });
  await notifyCurrentUser("SUCCESS", "Da tao don hang moi");
  revalidatePath("/purchase-orders");
  redirect("/purchase-orders");
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED"
) {
  const user = await requirePermission("purchaseOrders", "edit");

  const currentOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    select: { status: true, deletedAt: true },
  });

  if (status === "RECEIVED" && currentOrder?.status !== "RECEIVED") {
    const orderWithItems = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
        expense: true,
        supplier: { select: { name: true } },
      },
    });

    if (orderWithItems && !orderWithItems.deletedAt && !orderWithItems.expense) {
      const category = await getDefaultPurchaseOrderExpenseCategory();

      await prisma.expense.create({
        data: {
          projectId: orderWithItems.projectId,
          categoryId: category.id,
          amount: orderWithItems.totalAmount,
          date: orderWithItems.orderDate,
          description: `Chi phí tự động từ đơn hàng ${id}`,
          status: "APPROVED",
          origin: "PURCHASE_ORDER",
          purchaseOrderId: id,
          supplierId: orderWithItems.supplierId,
          payeeName: orderWithItems.supplier?.name ?? null,
        },
      });

      await prisma.materialPrice.createMany({
        data: orderWithItems.items.map((item) => ({
          materialId: item.materialId,
          price: item.unitPrice,
          source: "PO" as const,
          purchaseOrderId: id,
        })),
      });
    }
  }

  await prisma.purchaseOrder.update({
    where: { id },
    data: { status },
  });

  await logAudit(user.id, "UPDATE", "PurchaseOrder", id, {
    oldValues: { status: currentOrder?.status ?? null },
    newValues: { status },
  });
  await notifyCurrentUser("INFO", `Da cap nhat trang thai don hang sang ${status}`);
  revalidatePath("/purchase-orders");
  revalidatePath("/expenses");
  revalidatePath(`/purchase-orders/${id}`);
}

export async function updatePurchaseOrder(
  id: string,
  data: PurchaseOrderFormData
) {
  const user = await requirePermission("purchaseOrders", "edit");

  const validated = purchaseOrderSchema.parse(data);

  const totalAmount = validated.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.deleteMany({ where: { orderId: id } });

    await tx.purchaseOrder.update({
      where: { id },
      data: {
        supplierId: validated.supplierId,
        projectId: validated.projectId,
        orderDate: validated.orderDate,
        deliveryDate: validated.deliveryDate || null,
        notes: validated.notes || null,
        totalAmount,
        items: {
          create: validated.items.map((item) => ({
            materialId: item.materialId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
    });
  });

  await logAudit(user.id, "UPDATE", "PurchaseOrder", id, {
    newValues: {
      supplierId: validated.supplierId,
      projectId: validated.projectId,
      totalAmount,
    },
  });
  await notifyCurrentUser("INFO", "Da cap nhat don hang");
  revalidatePath("/purchase-orders");
  redirect("/purchase-orders");
}

export async function deletePurchaseOrder(id: string) {
  const user = await requirePermission("purchaseOrders", "delete");

  const currentOrder = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { expense: true },
  });

  await prisma.purchaseOrder.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  if (currentOrder?.expense) {
    await prisma.expense.update({
      where: { id: currentOrder.expense.id },
      data: { deletedAt: new Date() },
    });
  }

  await logAudit(user.id, "DELETE", "PurchaseOrder", id, {
    oldValues: {
      deletedAt: currentOrder?.deletedAt ?? null,
      expenseId: currentOrder?.expense?.id ?? null,
    },
  });
  await notifyCurrentUser("WARNING", "Da xoa don hang");
  revalidatePath("/purchase-orders");
  revalidatePath("/expenses");
}
