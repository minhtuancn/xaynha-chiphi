import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "@/components/forms/expense-form";
import {
  getExpenses,
  getExpenseCategories,
  createExpense,
  updateExpenseStatus,
  deleteExpense,
} from "@/actions/financial";
import { formatCurrency, formatDate, EXPENSE_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { serialize } from "@/lib/serialize";
import { CheckIcon, XIcon, PencilIcon, TrashIcon } from "lucide-react";
import { ApproveExpenseButton, RejectExpenseButton } from "@/components/forms/expense-actions";

const STATUS_SEMANTIC: Record<string, { label: string; dot: string }> = {
  PENDING: { label: "Chờ duyệt", dot: "bg-orange-400" },
  APPROVED: { label: "Đã duyệt", dot: "bg-green-500" },
  REJECTED: { label: "Từ chối", dot: "bg-red-500" },
};

export default async function ExpensesPage() {
  const [expenses, categories] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
  ]);

  const sExpenses = serialize(expenses);

  const totalPending = sExpenses
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalApproved = sExpenses
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý chi phí</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng chi phí
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(sExpenses.reduce((sum, e) => sum + e.amount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sExpenses.filter((e) => e.status === "PENDING").length} khoản
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đã duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalApproved)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm chi phí</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            onSubmit={createExpense}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách chi phí</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Số tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Mô tả</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Người tạo</th>
                </tr>
              </thead>
              <tbody>
                {sExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có chi phí nào
                    </td>
                  </tr>
                ) : (
                  sExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {expense.category.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={EXPENSE_STATUS_VARIANTS[expense.status]}>
                          {EXPENSE_STATUS_LABELS[expense.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {expense.description || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {expense.creator?.name || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
