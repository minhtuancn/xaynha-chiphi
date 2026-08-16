import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));

// Minimal prisma mock covering every client used by the tested actions
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn: any) => (typeof fn === "function" ? fn(prisma) : Promise.all(fn))),
    account: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      count: vi.fn(),
    },
    debt: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: {
      count: vi.fn(),
    },
    supplier: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    worker: {
      findUnique: vi.fn(),
    },
  },
}));

import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import {
  createTransaction,
  createDebt,
  deleteDebt,
  deleteAccount,
} from "@/actions/financial";

const m = vi.mocked(prisma);

const tx = () => m; // mock passes the same prisma object as tx

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTransaction guards (M4)", () => {
  test("throws overdraft when EXPENSE exceeds account balance", async () => {
    m.account.findUnique.mockResolvedValue({ id: "acc-1", deletedAt: null, balance: new Decimal(100) } as never);

    await expect(
      createTransaction({
        accountId: "acc-1",
        type: "EXPENSE",
        amount: 200,
        date: new Date(),
        category: "Mua vật liệu",
        description: "",
      })
    ).rejects.toThrow("Số dư tài khoản không đủ");
    expect(m.transaction.create).not.toHaveBeenCalled();
  });

  test("attributes the transaction to the current user", async () => {
    m.account.findUnique.mockResolvedValue({ id: "acc-1", deletedAt: null, balance: new Decimal(1000) } as never);
    m.transaction.create.mockResolvedValue({ id: "tx-1" } as never);

    await createTransaction({
      accountId: "acc-1",
      type: "EXPENSE",
      amount: 50,
      date: new Date(),
      category: "Mua vật liệu",
      description: "",
    });

    expect(m.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });
});

describe("createDebt guards (M7/M8)", () => {
  test("rejects when both supplier and worker are provided", async () => {
    await expect(
      createDebt({
        supplierId: "sup-1",
        workerId: "wk-1",
        type: "PAYABLE",
        amount: 1000000,
        notes: "",
      })
    ).rejects.toThrow("Chỉ chọn một trong hai");
  });

  test("increments supplier.debtBalance inside the same transaction", async () => {
    m.supplier.findUnique.mockResolvedValue({ id: "sup-1", deletedAt: null } as never);
    m.debt.create.mockResolvedValue({ id: "debt-1" } as never);

    await createDebt({
      supplierId: "sup-1",
      type: "PAYABLE",
      amount: 500000,
      notes: "",
    });

    expect(m.supplier.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { debtBalance: { increment: expect.any(Decimal) } },
      })
    );
  });
});

describe("deleteDebt guard (M5)", () => {
  test("blocks deletion when payments exist", async () => {
    m.debt.findUnique.mockResolvedValue({ id: "debt-1", deletedAt: null, supplierId: null, amount: new Decimal(1000) } as never);
    m.payment.count.mockResolvedValue(2);

    await expect(deleteDebt("debt-1")).rejects.toThrow("Không thể xóa công nợ đã có khoản thanh toán");
    expect(m.debt.update).not.toHaveBeenCalled();
  });
});

describe("deleteAccount guard (M6)", () => {
  test("blocks deletion of an account with nonzero balance", async () => {
    m.account.findFirst.mockResolvedValue({ id: "acc-1", balance: new Decimal(500) } as never);

    await expect(deleteAccount("acc-1")).rejects.toThrow("còn số dư khác 0");
  });

  test("blocks deletion when transactions reference the account", async () => {
    m.account.findFirst.mockResolvedValue({ id: "acc-1", balance: new Decimal(0) } as never);
    m.transaction.count.mockResolvedValue(3);

    await expect(deleteAccount("acc-1")).rejects.toThrow("đã có giao dịch");
  });
});