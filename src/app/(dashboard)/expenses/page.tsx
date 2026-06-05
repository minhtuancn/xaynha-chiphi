"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/forms/expense-form";
import { createExpense } from "@/actions/financial";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { ApproveExpenseButton, RejectExpenseButton, DeleteExpenseButton } from "@/components/forms/expense-actions";
import { useExpenses } from "@/hooks/use-expenses";
import { useQuery } from "@tanstack/react-query";
import { getExpenseCategories } from "@/actions/financial";
import { serialize } from "@/lib/serialize";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

const STATUS_SEMANTIC: Record<string, { label: string; dot: string }> = {
  PENDING: { label: "Chờ duyệt", dot: "bg-orange-400" },
  APPROVED: { label: "Đã duyệt", dot: "bg-green-500" },
  REJECTED: { label: "Từ chối", dot: "bg-red-500" },
};

export default function ExpensesPage() {
  const { data: sExpenses, isLoading: expensesLoading } = useExpenses();
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => serialize(await getExpenseCategories()),
  });

  if (expensesLoading || catLoading) {
    return <PageSkeleton />;
  }

  const totalPending = (sExpenses ?? [])
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalApproved = (sExpenses ?? [])
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = (sExpenses ?? []).reduce((sum, e) => sum + e.amount, 0);

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
              {formatCurrency(totalExpenses)}
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
              {(sExpenses ?? []).filter((e) => e.status === "PENDING").length} khoản
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
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(totalApproved)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
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

      <Card className="shadow-sm">
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
                  <th className="px-4 py-3 text-right text-sm font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {(sExpenses ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-muted p-3">
                          <PlusIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium">Chưa có chi phí nào</p>
                        <p className="text-sm">Thêm chi phí đầu tiên bằng biểu mẫu phía trên</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (sExpenses ?? []).map((expense) => {
                    const status = STATUS_SEMANTIC[expense.status];
                    return (
                      <tr
                        key={expense.id}
                        className="border-b last:border-0 hover:bg-muted/40 transition-colors group"
                      >
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
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                            <span className="text-sm">{status.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {expense.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {expense.creator?.name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {expense.status === "PENDING" && (
                              <>
                                <ApproveExpenseButton id={expense.id} />
                                <RejectExpenseButton id={expense.id} />
                              </>
                            )}
                            <DeleteExpenseButton id={expense.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}