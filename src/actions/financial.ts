"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { notifyAdmins } from "./notifications";
import {
  expenseSchema,
  transactionSchema,
  debtSchema,
  paymentSchema,
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

  const expense = await prisma.expense.create({
    data: {
      projectId: projectScope,
      categoryId: validated.categoryId,
      amount: new Decimal(validated.amount),
      date: validated.date,
      description: validated.description || null,
      status: validated.status,
    },
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
  const user = await requirePermission("expenses", "edit");

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

  return prisma.account.create({
    data: {
      name: data.name,
      type: data.type,
      balance: new Decimal(data.balance ?? 0),
    },
  });
}

export async function updateAccount(id: string, data: { name?: string; balance?: number }) {
  await requirePermission("accounts", "edit");

  const account = await prisma.account.findUnique({ where: { id } });
  if (!account) throw new Error("Tài khoản không tồn tại");

  return prisma.account.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.balance !== undefined && { balance: new Decimal(data.balance) }),
    },
  });
}

export async function deleteAccount(id: string) {
  await requirePermission("accounts", "delete");

  await prisma.account.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/accounts");
}

// ============================================
// TRANSACTIONS
// ============================================

export async function getTransactions() {
  await requirePermission("accounts", "view");

  const result = await prisma.transaction.findMany({
    include: {
      account: { select: { id: true, name: true, type: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });
  return serialize(result);
}

export async function createTransaction(data: TransactionFormData) {
  const user = await requirePermission("accounts", "create");

  const validated = transactionSchema.parse(data);

  const account = await prisma.account.findUnique({
    where: { id: validated.accountId, deletedAt: null },
  });

  if (!account) throw new Error("Tài khoản không tồn tại");

  const amount = new Decimal(validated.amount);
  let newBalance: Decimal;

  if (validated.type === "INCOME") {
    newBalance = account.balance.add(amount);
  } else {
    newBalance = account.balance.sub(amount);
  }

  const transaction = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        accountId: validated.accountId,
        type: validated.type,
        amount,
        date: validated.date,
        category: validated.category || null,
        description: validated.description || null,
      },
    }),
    prisma.account.update({
      where: { id: validated.accountId },
      data: { balance: newBalance },
    }),
  ]) as [Awaited<ReturnType<typeof prisma.transaction.create>>, ...unknown[]];

  await logAudit(user.id, "CREATE", "Transaction", transaction[0].id, {
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

  if (validated.supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: validated.supplierId, deletedAt: null },
    });
    if (!supplier) throw new Error("Nhà cung cấp không tồn tại");
  }

  if (validated.workerId) {
    const worker = await prisma.worker.findUnique({
      where: { id: validated.workerId, deletedAt: null },
    });
    if (!worker) throw new Error("Công nhân không tồn tại");
  }

  const amount = new Decimal(validated.amount);

  const debt = await prisma.debt.create({
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

  await prisma.debt.update({
    where: { id },
    data: { deletedAt: new Date() },
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

  const debt = await prisma.debt.findUnique({
    where: { id: validated.debtId, deletedAt: null },
  });

  if (!debt) throw new Error("Khoản nợ không tồn tại");

  const account = await prisma.account.findUnique({
    where: { id: validated.accountId, deletedAt: null },
  });

  if (!account) throw new Error("Tài khoản không tồn tại");

  const amount = new Decimal(validated.amount);
  const newPaidAmount = debt.paidAmount.add(amount);
  const newBalance = account.balance.sub(amount);

  let newStatus: "UNPAID" | "PARTIAL" | "PAID";
  if (newPaidAmount.gte(debt.amount)) {
    newStatus = "PAID";
  } else if (newPaidAmount.gt(0)) {
    newStatus = "PARTIAL";
  } else {
    newStatus = "UNPAID";
  }

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        debtId: validated.debtId,
        accountId: validated.accountId,
        amount,
        date: validated.date,
        method: validated.method,
        notes: validated.notes || null,
      },
    }),
    prisma.debt.update({
      where: { id: validated.debtId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    }),
    prisma.account.update({
      where: { id: validated.accountId },
      data: { balance: newBalance },
    }),
  ]);

  await logAudit(user.id, "CREATE", "Payment", payment.id, {
    newValues: {
      debtId: validated.debtId,
      accountId: validated.accountId,
      amount: validated.amount,
    },
  });

  revalidatePath("/debts");
}
