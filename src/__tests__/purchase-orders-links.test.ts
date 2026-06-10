import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseOrder: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    purchaseOrderItem: {
      deleteMany: vi.fn(),
    },
    expenseCategory: {
      findFirst: vi.fn(),
    },
    expense: {
      create: vi.fn(),
      update: vi.fn(),
    },
    materialPrice: {
      createMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
} from "@/actions/purchase-orders";

const mockedPrisma = vi.mocked(prisma);

describe("purchase order to expense linkage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates exactly one expense when a purchase order is received", async () => {
    mockedPrisma.purchaseOrder.findUnique
      .mockResolvedValueOnce({
        id: "po-1",
        status: "SENT",
      } as never)
      .mockResolvedValueOnce({
        id: "po-1",
        status: "SENT",
        projectId: "project-1",
        orderDate: new Date("2026-06-10T00:00:00.000Z"),
        totalAmount: "12500000",
        deletedAt: null,
        expense: null,
        items: [{ materialId: "mat-1", unitPrice: "125000", quantity: "100" }],
      } as never);

    mockedPrisma.expenseCategory.findFirst.mockResolvedValue({
      id: "cat-1",
      name: "Vật liệu xây dựng",
    } as never);

    mockedPrisma.materialPrice.createMany.mockResolvedValue({ count: 1 } as never);
    mockedPrisma.expense.create.mockResolvedValue({ id: "expense-1" } as never);
    mockedPrisma.purchaseOrder.update.mockResolvedValue({ id: "po-1" } as never);

    await updatePurchaseOrderStatus("po-1", "RECEIVED");

    expect(mockedPrisma.expense.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purchaseOrderId: "po-1",
          projectId: "project-1",
          categoryId: "cat-1",
          amount: expect.anything(),
        }),
      })
    );
    expect(mockedPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: "po-1" },
      data: { status: "RECEIVED" },
    });
  });

  test("soft-deletes the linked expense when the purchase order is deleted", async () => {
    mockedPrisma.purchaseOrder.findUnique.mockResolvedValue({
      id: "po-1",
      deletedAt: null,
      expense: { id: "expense-1", deletedAt: null },
    } as never);

    mockedPrisma.purchaseOrder.update.mockResolvedValue({ id: "po-1" } as never);
    mockedPrisma.expense.update.mockResolvedValue({ id: "expense-1" } as never);

    await deletePurchaseOrder("po-1");

    expect(mockedPrisma.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: "po-1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mockedPrisma.expense.update).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.expense.update).toHaveBeenCalledWith({
      where: { id: "expense-1" },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
