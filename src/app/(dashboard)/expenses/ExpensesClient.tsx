"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/forms/expense-form";
import { createExpense } from "@/actions/financial";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { ApproveExpenseButton, RejectExpenseButton, DeleteExpenseButton } from "@/components/forms/expense-actions";
import { useExpenses } from "@/hooks/use-expenses";
import { useQuery } from "@tanstack/react-query";
import { getExpenseCategories } from "@/actions/financial";
import { serialize } from "@/lib/serialize";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { DataTable } from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

const STATUS_SEMANTIC: Record<string, { label: string; dot: string }> = {
  PENDING: { label: "Chờ duyệt", dot: "bg-orange-400" },
  APPROVED: { label: "Đã duyệt", dot: "bg-green-500" },
  REJECTED: { label: "Từ chối", dot: "bg-red-500" },
};

export type ExpenseRow = {
  id: string;
  date: Date;
  category: { name: string };
  amount: number;
  status: string;
  description: string | null;
  creator: { name: string } | null;
};

const ActionCell = ({ row }: { row: { original: ExpenseRow } }) => {
  const expense = row.original;
  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {expense.status === "PENDING" && (
        <>
          <ApproveExpenseButton id={expense.id} />
          <RejectExpenseButton id={expense.id} />
        </>
      )}
      <DeleteExpenseButton id={expense.id} />
    </div>
  );
};

export const expenseColumns: ColumnDef<ExpenseRow>[] = [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => <span className="font-medium">{row.original.category?.name ?? "-"}</span>,
  },
  {
    accessorKey: "amount",
    header: () => <span className="text-right block">Số tiền</span>,
    cell: ({ row }) => (
      <span className="text-right font-mono block">
        {formatCurrency(Number(row.original.amount))}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = STATUS_SEMANTIC[row.original.status];
      return (
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", status.dot)} />
          <span className="text-sm">{status.label}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => (
      <span className="max-w-xs truncate block text-muted-foreground">
        {row.original.description || "-"}
      </span>
    ),
  },
  {
    accessorKey: "creator.name",
    header: "Người tạo",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.creator?.name || "-"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="text-right block">Hành động</span>,
    cell: ActionCell,
  },
];

export default function ExpensesClient() {
  const { data: sExpenses, isLoading: expensesLoading } = useExpenses();
  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => serialize(await getExpenseCategories()),
  });

  if (expensesLoading || catLoading) {
    return <PageSkeleton />;
  }

  const rows: ExpenseRow[] = (sExpenses ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    category: e.category,
    amount: Number(e.amount),
    status: e.status,
    description: e.description ?? null,
    creator: e.creator ?? null,
  }));

  const totalPending = rows
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalApproved = rows
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = rows.reduce((sum, e) => sum + e.amount, 0);

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
              {rows.filter((e) => e.status === "PENDING").length} khoản
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
            categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
            onSubmit={createExpense}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách chi phí</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={expenseColumns}
            data={rows}
            searchColumn="description"
            searchPlaceholder="Tìm kiếm chi phí..."
            exportFilename="chi-phi.csv"
          />
        </CardContent>
      </Card>
    </div>
  );
}