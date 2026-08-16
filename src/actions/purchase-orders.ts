"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { purchaseOrderSchema, type PurchaseOrderFormData } from "@/schemas/purchase-order";
import { createNotificationForCurrentUser } from "./notifications";
import { logAudit } from "@/lib/audit";
import { serialize } from "@/lib/serialize";
import { Decimal } from "@prisma/client/runtime/library";

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

export async function getPurchaseOrders(options?: { page?: number; limit?: number }) {
  await requirePermission("purchaseOrders", "view");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));

  const [data, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
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
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.purchaseOrder.count({ where: { deletedAt: null } }),
  ]);
  return serialize({ data, total });
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
  return serialize(result);
}

export async function createPurchaseOrder(data: PurchaseOrderFormData) {
  const user = await requirePermission("purchaseOrders", "create");

  const validated = purchaseOrderSchema.parse(data);

  const totalAmount = validated.items.reduce(
    (sum, item) => sum.plus(new Decimal(item.quantity).times(item.unitPrice)),
    new Decimal(0)
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

  if (!currentOrder || currentOrder.deletedAt) throw new Error("Đơn hàng không tồn tại");

  // A cancelled order is terminal: no further transitions are allowed.
  if (currentOrder.status === "CANCELLED" && status !== "CANCELLED") {
    throw new Error("Không thể thay đổi trạng thái đơn hàng đã hủy");
  }

  // A received order already touched the ledger (expense, stock, prices);
  // it must be reverted explicitly, never silently cancelled.
  if (status === "CANCELLED" && currentOrder.status === "RECEIVED") {
    throw new Error("Không thể hủy đơn hàng đã nhận kho");
  }

  // Reverting a received order must undo every receiving side effect.
  if (currentOrder.status === "RECEIVED" && status !== "RECEIVED") {
    await prisma.$transaction(async (tx) => {
      const received = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true, expense: true },
      });
      if (!received) return;
      if (received.expense && !received.expense.deletedAt) {
        await tx.expense.update({
          where: { id: received.expense.id },
          data: { deletedAt: new Date() },
        });
      }
      for (const item of received.items) {
        await tx.material.update({
          where: { id: item.materialId },
          data: { currentStock: { decrement: Number(item.quantity) } },
        });
      }
      await tx.inventoryTransaction.deleteMany({ where: { purchaseOrderId: id } });
      await tx.materialPrice.deleteMany({ where: { purchaseOrderId: id } });
    });
  }

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

      // Atomically: record expense, material prices, stock IN and inventory
      // transactions so receiving goods is fully reflected in the ledger.
      await prisma.$transaction(async (tx) => {
        await tx.expense.create({
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

        await tx.materialPrice.createMany({
          data: orderWithItems.items.map((item) => ({
            materialId: item.materialId,
            price: item.unitPrice,
            source: "PO" as const,
            purchaseOrderId: id,
          })),
        });

        for (const item of orderWithItems.items) {
          const qty = Number(item.quantity);
          await tx.material.update({
            where: { id: item.materialId },
            data: { currentStock: { increment: qty } },
          });
          await tx.inventoryTransaction.create({
            data: {
              materialId: item.materialId,
              type: "IN",
              quantity: qty,
              date: new Date(),
              reference: `PO-${id}`,
              notes: "Nhập kho từ đơn hàng",
              purchaseOrderId: id,
              projectId: orderWithItems.projectId,
            },
          });
        }
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
    (sum, item) => sum.plus(new Decimal(item.quantity).times(item.unitPrice)),
    new Decimal(0)
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
            total: new Decimal(item.quantity).times(item.unitPrice),
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
    include: { expense: true, items: true },
  });

  if (!currentOrder) throw new Error("Đơn hàng không tồn tại");

  await prisma.$transaction(async (tx) => {
    // Deleting a received order must reverse the stock it brought in,
    // remove its inventory transactions and recorded prices, then
    // soft-delete the order and its auto-generated expense.
    if (currentOrder.status === "RECEIVED") {
      for (const item of currentOrder.items) {
        await tx.material.update({
          where: { id: item.materialId },
          data: { currentStock: { decrement: Number(item.quantity) } },
        });
      }
      await tx.inventoryTransaction.deleteMany({ where: { purchaseOrderId: id } });
      await tx.materialPrice.deleteMany({ where: { purchaseOrderId: id } });
    }

    await tx.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (currentOrder.expense && !currentOrder.expense.deletedAt) {
      await tx.expense.update({
        where: { id: currentOrder.expense.id },
        data: { deletedAt: new Date() },
      });
    }
  });

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
