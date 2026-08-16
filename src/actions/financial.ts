"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notifyAdmins } from "./notifications";
import {
  expenseSchema,
  transactionSchema,
  debtSchema,
  paymentSchema,
  accountSchema,
  accountUpdateSchema,
  type ExpenseFormData,
  type TransactionFormData,
  type DebtFormData,
  type PaymentFormData,
} from "@/schemas/financial";
import { Decimal } from "@prisma/client/runtime/library";
import { serialize } from "@/lib/serialize";
import { getProjectScope } from "./project-scope";

// ============================================
// EXPENSES
// ============================================

export async function getExpenses() {
  await requirePermission("expenses", "view");

  const projectScope = await getProjectScope();

  const result = await prisma.expense.findMany({
    where: { ...(projectScope ? { projectId: projectScope } : {}), deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return serialize(result);
}

export async function getExpenseCategories() {
  await requirePermission("expenses", "view");

  return serialize(
    await prisma.expenseCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    })
  );
}

export async function createExpense(data: ExpenseFormData) {
  const user = await requirePermission("expenses", "create");

  const validated = expenseSchema.parse(data);

  const projectScope = await getProjectScope();
  if (!projectScope) throw new Error("Không có dự án đang hoạt động");

  const category = await prisma.expenseCategory.findUnique({
    where: { id: validated.categoryId, deletedAt: null },
  });

  if (!category) throw new Error("Danh mục chi phí không tồn tại");

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        projectId: projectScope,
        categoryId: validated.categoryId,
        amount: new Decimal(validated.amount),
        date: validated.date,
        description: validated.description || null,
        status: validated.status,
        createdBy: user.id,
      },
    });

    // Keep the budget ledger in sync when an expense is recorded.
    const budget = await tx.budget.findUnique({ where: { projectId: projectScope } });
    if (budget) {
      const newSpent = budget.spent.add(validated.amount);
      await tx.budget.update({
        where: { projectId: projectScope },
        data: {
          spent: newSpent,
          remaining: budget.totalBudget.sub(newSpent),
        },
      });
    }

    return created;
  });

  await logAudit(user.id, "CREATE", "Expense", expense.id, {
    newValues: {
      categoryId: validated.categoryId,
      amount: validated.amount,
      date: validated.date,
    },
  });

  const amountStr = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(validated.amount);
  void notifyAdmins("CHI_PHI", `Chi phí "${validated.description || category.name}" (${amountStr}) đã được ghi nhận`);

  revalidatePath("/expenses");
}

export async function updateExpenseStatus(id: string, status: "APPROVED" | "REJECTED") {
  // Approving/rejecting is an approval decision; restrict to admins (or users
  // granted expenses edit, but never self-approve). Admins always allowed.
  const user = await requireAdmin();

  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new Error("Chi phí không tồn tại");

  await prisma.expense.update({
    where: { id },
    data: { status },
  });

  await logAudit(user.id, "UPDATE", "Expense", id, {
    newValues: { status },
  });

  revalidatePath("/expenses");
}

export async function deleteExpense(id: string) {
  const user = await requirePermission("expenses", "delete");

  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit(user.id, "DELETE", "Expense", id, {});

  revalidatePath("/expenses");
}

// ============================================
// ACCOUNTS
// ============================================

export async function getAccountDetail(id: string) {
  await requirePermission("accounts", "view");
  const result = await prisma.account.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
  return serialize(result);
}

export async function getAccounts() {
  await requirePermission("accounts", "view");

  const result = await prisma.account.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  return serialize(result);
}

export async function createAccount(data: { name: string; type: "CASH" | "BANK"; balance?: number }) {
  await requirePermission("accounts", "create");

  const validated = accountSchema.parse(data);

  const account = await prisma.account.create({
    data: {
      name: validated.name,
      type: validated.type,
      balance: new Decimal(validated.balance),
    },
  });

  revalidatePath("/accounts");
  return serialize(account);
}

export async function updateAccount(id: string, data: { name?: string; balance?: number }) {
  await requirePermission("accounts", "edit");

  const validated = accountUpdateSchema.parse(data);

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) throw new Error("Tài khoản không tồn tại");

  const updated = await prisma.account.update({
    where: { id },
    data: {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.balance !== undefined && { balance: new Decimal(validated.balance) }),
    },
  });

  revalidatePath("/accounts");
  return serialize(updated);
}

export async function deleteAccount(id: string) {
  const user = await requirePermission("accounts", "delete");

  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, balance: true },
    });
    if (!account) throw new Error("Tài khoản không tồn tại");

    if (!account.balance.isZero()) {
      throw new Error("Không thể xóa tài khoản còn số dư khác 0");
    }

    const txCount = await tx.transaction.count({ where: { accountId: id } });
    if (txCount > 0) {
      throw new Error("Không thể xóa tài khoản đã có giao dịch");
    }

    await tx.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });

  await logAudit(user.id, "DELETE", "Account", id, {
    oldValues: { id },
    newValues: { deletedAt: new Date().toISOString() },
  });
  revalidatePath("/accounts");
}

// ============================================
// TRANSACTIONS
// ============================================

export async function getTransactions(options?: { page?: number; limit?: number }) {
  await requirePermission("accounts", "view");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        account: { select: { id: true, name: true, type: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.transaction.count(),
  ]);
  return serialize({ data, total });
}

export async function createTransaction(data: TransactionFormData) {
  const user = await requirePermission("accounts", "create");

  const validated = transactionSchema.parse(data);

  const transaction = await prisma.$transaction(async (tx) => {
    const account = await tx.account.findUnique({
      where: { id: validated.accountId, deletedAt: null },
      select: { id: true, deletedAt: true, balance: true },
    });

    if (!account || account.deletedAt) throw new Error("Tài khoản không tồn tại");

    const amount = new Decimal(validated.amount);

    if (validated.type !== "INCOME" && account.balance.lt(amount)) {
      throw new Error("Số dư tài khoản không đủ");
    }

    const created = await tx.transaction.create({
      data: {
        accountId: validated.accountId,
        type: validated.type,
        amount,
        date: validated.date,
        category: validated.category || null,
        description: validated.description || null,
        userId: user.id,
      },
    });

    if (validated.type === "INCOME") {
      await tx.account.update({
        where: { id: validated.accountId },
        data: { balance: { increment: amount } },
      });
    } else {
      await tx.account.update({
        where: { id: validated.accountId },
        data: { balance: { decrement: amount } },
      });
    }

    return created;
  });

  await logAudit(user.id, "CREATE", "Transaction", transaction.id, {
    newValues: {
      accountId: validated.accountId,
      type: validated.type,
      amount: validated.amount,
    },
  });

  revalidatePath("/accounts");
}

// ============================================
// DEBTS
// ============================================

export async function getDebts() {
  await requirePermission("debts", "view");

  const result = await prisma.debt.findMany({
    where: { deletedAt: null },
    include: {
      supplier: { select: { id: true, name: true } },
      worker: { select: { id: true, name: true } },
      payments: { orderBy: { date: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(result);
}

export async function createDebt(data: DebtFormData) {
  const user = await requirePermission("debts", "create");

  const validated = debtSchema.parse(data);

  if (!validated.supplierId && !validated.workerId) {
    throw new Error("Phải chọn nhà cung cấp hoặc công nhân");
  }

  if (validated.supplierId && validated.workerId) {
    throw new Error("Chỉ chọn một trong hai: nhà cung cấp hoặc công nhân");
  }

  const amount = new Decimal(validated.amount);

  const debt = await prisma.$transaction(async (tx) => {
    if (validated.supplierId) {
      const supplier = await tx.supplier.findUnique({
        where: { id: validated.supplierId, deletedAt: null },
      });
      if (!supplier) throw new Error("Nhà cung cấp không tồn tại");
    }

    if (validated.workerId) {
      const worker = await tx.worker.findUnique({
        where: { id: validated.workerId, deletedAt: null },
      });
      if (!worker) throw new Error("Công nhân không tồn tại");
    }

    const created = await tx.debt.create({
      data: {
        supplierId: validated.supplierId || null,
        workerId: validated.workerId || null,
        type: validated.type,
        amount,
        paidAmount: new Decimal(0),
        dueDate: validated.dueDate || null,
        status: "UNPAID",
        notes: validated.notes || null,
      },
    });

    // Keep the denormalized supplier balance in sync
    if (validated.supplierId) {
      await tx.supplier.update({
        where: { id: validated.supplierId },
        data: { debtBalance: { increment: amount } },
      });
    }

    return created;
  });

  await logAudit(user.id, "CREATE", "Debt", debt.id, {
    newValues: {
      amount: validated.amount,
      type: validated.type,
    },
  });

  revalidatePath("/debts");
}

export async function deleteDebt(id: string) {
  const user = await requirePermission("debts", "delete");

  await prisma.$transaction(async (tx) => {
    const debt = await tx.debt.findUnique({ where: { id } });
    if (!debt || debt.deletedAt) throw new Error("Công nợ không tồn tại");

    const paymentCount = await tx.payment.count({ where: { debtId: id } });
    if (paymentCount > 0) {
      throw new Error("Không thể xóa công nợ đã có khoản thanh toán");
    }

    // Reverse the denormalized supplier balance before soft-delete
    if (debt.supplierId) {
      await tx.supplier.update({
        where: { id: debt.supplierId },
        data: { debtBalance: { decrement: debt.amount } },
      });
    }

    await tx.debt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  });

  await logAudit(user.id, "DELETE", "Debt", id, {});

  revalidatePath("/debts");
}

// ============================================
// PAYMENTS
// ============================================

export async function getPayments() {
  await requirePermission("debts", "view");

  const result = await prisma.payment.findMany({
    include: {
      debt: {
        select: {
          id: true,
          type: true,
          amount: true,
          supplier: { select: { id: true, name: true } },
          worker: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });
  return serialize(result);
}

export async function addPayment(data: PaymentFormData) {
  const user = await requirePermission("debts", "create");

  const validated = paymentSchema.parse(data);

  const payment = await prisma.$transaction(async (tx) => {
    const debt = await tx.debt.findUnique({
      where: { id: validated.debtId, deletedAt: null },
    });

    if (!debt) throw new Error("Khoản nợ không tồn tại");

    const account = await tx.account.findUnique({
      where: { id: validated.accountId, deletedAt: null },
    });

    if (!account) throw new Error("Tài khoản không tồn tại");

    const amount = new Decimal(validated.amount);
    const newPaidAmount = debt.paidAmount.add(amount);

    // Guards: no overpayment and no overdraft.
    if (newPaidAmount.gt(debt.amount)) {
      throw new Error("Số tiền thanh toán vượt quá khoản nợ còn lại");
    }
    if (account.balance.lt(amount)) {
      throw new Error("Số dư tài khoản không đủ");
    }

    let newStatus: "UNPAID" | "PARTIAL" | "PAID";
    if (newPaidAmount.gte(debt.amount)) {
      newStatus = "PAID";
    } else if (newPaidAmount.gt(0)) {
      newStatus = "PARTIAL";
    } else {
      newStatus = "UNPAID";
    }

    const created = await tx.payment.create({
      data: {
        debtId: validated.debtId,
        accountId: validated.accountId,
        amount,
        date: validated.date,
        method: validated.method,
        notes: validated.notes || null,
      },
    });

    // Record the balance movement in the account ledger so it can be
    // reconciled via getTransactions.
    await tx.transaction.create({
      data: {
        accountId: validated.accountId,
        userId: user.id,
        type: "EXPENSE",
        amount,
        date: validated.date,
        category: debt.supplierId ? "Trả nợ nhà cung cấp" : "Trả nợ công nhân",
        description: `Thanh toán công nợ ${debt.supplierId ? debt.supplierId : debt.workerId}`,
        reference: `PAYMENT-${created.id}`,
      },
    });

    await tx.debt.update({
      where: { id: validated.debtId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // Keep the denormalized supplier balance in sync.
    if (debt.supplierId) {
      await tx.supplier.update({
        where: { id: debt.supplierId },
        data: { debtBalance: { decrement: amount } },
      });
    }

    await tx.account.update({
      where: { id: validated.accountId },
      data: { balance: { decrement: amount } },
    });

    return created;
  });

  await logAudit(user.id, "CREATE", "Payment", payment.id, {
    newValues: {
      debtId: validated.debtId,
      accountId: validated.accountId,
      amount: validated.amount,
    },
  });

  revalidatePath("/debts");
}
