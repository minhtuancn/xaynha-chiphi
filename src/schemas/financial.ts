import { z } from "zod";

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Chọn danh mục"),
  amount: z.coerce.number().min(0.01, "Số tiền phải lớn hơn 0"),
  date: z.coerce.date(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export const transactionSchema = z.object({
  accountId: z.string().min(1, "Chọn tài khoản"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().min(0.01, "Số tiền phải lớn hơn 0"),
  date: z.coerce.date(),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const debtSchema = z.object({
  supplierId: z.string().optional(),
  workerId: z.string().optional(),
  type: z.enum(["PAYABLE", "RECEIVABLE"]),
  amount: z.coerce.number().min(0.01, "Số tiền phải lớn hơn 0"),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  debtId: z.string().min(1, "Chọn khoản nợ"),
  accountId: z.string().min(1, "Chọn tài khoản"),
  amount: z.coerce.number().min(0.01, "Số tiền phải lớn hơn 0"),
  date: z.coerce.date(),
  method: z.enum(["CASH", "BANK", "TRANSFER"]),
  notes: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type DebtFormData = z.infer<typeof debtSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
