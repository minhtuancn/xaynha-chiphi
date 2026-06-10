import { beforeEach, describe, expect, test, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    debt: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { addPayment } from "@/actions/financial";

const mockedPrisma = vi.mocked(prisma);

describe("payment account linkage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("deducts the selected account balance when a payment is created", async () => {
    mockedPrisma.debt.findUnique.mockResolvedValue({
      id: "debt-1",
      amount: new Decimal(500000),
      paidAmount: new Decimal(100000),
    } as never);
    mockedPrisma.account.findUnique.mockResolvedValue({
      id: "account-1",
      balance: new Decimal(2000000),
    } as never);
    mockedPrisma.payment.create.mockResolvedValue({ id: "payment-1" } as never);
    mockedPrisma.account.update.mockResolvedValue({ id: "account-1" } as never);
    mockedPrisma.debt.update.mockResolvedValue({ id: "debt-1" } as never);
    mockedPrisma.$transaction.mockResolvedValue(undefined as never);

    await addPayment({
      debtId: "debt-1",
      accountId: "account-1",
      amount: 150000,
      date: new Date("2026-06-10T00:00:00.000Z"),
      method: "TRANSFER",
      notes: "Thanh toán đợt 1",
    });

    expect(mockedPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          debtId: "debt-1",
          accountId: "account-1",
          amount: expect.anything(),
        }),
      })
    );
    expect(mockedPrisma.account.update).toHaveBeenCalledWith({
      where: { id: "account-1" },
      data: { balance: new Decimal(1850000) },
    });
    expect(mockedPrisma.debt.update).toHaveBeenCalledWith({
      where: { id: "debt-1" },
      data: {
        paidAmount: new Decimal(250000),
        status: "PARTIAL",
      },
    });
  });
});
