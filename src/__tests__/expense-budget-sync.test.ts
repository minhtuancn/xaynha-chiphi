import { describe, expect, test, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: "user-1" }),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/actions/notifications", () => ({ notifyAdmins: vi.fn() }));
vi.mock("@/actions/project-scope", () => ({
  getProjectScope: vi.fn().mockResolvedValue("proj-1"),
}));

const mockTx = {
  expense: { create: vi.fn() },
  budget: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    expenseCategory: {
      findUnique: vi.fn().mockResolvedValue({ id: "cat-1", name: "Vật liệu" }),
    },
    $transaction: (...args: unknown[]) => {
      if (typeof args[0] === "function") return args[0](mockTx);
      return args[0];
    },
  },
}));

let createExpense: (data: any) => Promise<any>;
beforeAll(async () => {
  const mod = await import("@/actions/financial");
  createExpense = mod.createExpense;
});

describe("createExpense budget sync (M2/H3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.budget.findUnique.mockReset();
    mockTx.budget.update.mockReset();
  });

  test("creates expense with createdBy and updates budget spent/remaining", async () => {
    mockTx.expense.create.mockResolvedValue({ id: "exp-1" });
    mockTx.budget.findUnique.mockResolvedValue({
      projectId: "proj-1",
      totalBudget: new Decimal(100000000),
      spent: new Decimal(30000000),
    });

    await createExpense({
      categoryId: "cat-1",
      amount: 5000000,
      date: new Date("2026-06-10"),
      status: "PENDING",
      description: "Mua sắt",
    });

    expect(mockTx.expense.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdBy: "user-1",
          amount: new Decimal(5000000),
        }),
      })
    );
    expect(mockTx.budget.update).toHaveBeenCalledWith({
      where: { projectId: "proj-1" },
      data: {
        spent: new Decimal(35000000),
        remaining: new Decimal(65000000),
      },
    });
  });
});