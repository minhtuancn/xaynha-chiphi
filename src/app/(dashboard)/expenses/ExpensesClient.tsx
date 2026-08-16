"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/forms/expense-form";
import { createExpense } from "@/actions/financial";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PlusIcon } from "lucide-react";
import { ApproveExpenseButton, RejectExpenseButton, DeleteExpenseButton } from "@/components/forms/expense-actions";
import { useExpenses } from "@/hooks/use-expenses";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
    <div className="flex items-center justify-end gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
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
  const queryClient = useQueryClient();
  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileVisible, setMobileVisible] = useState(10);
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

  const q = mobileQuery.trim().toLowerCase();
  const mobileRows = q
    ? rows.filter(
        (e) =>
          (e.description ?? "").toLowerCase().includes(q) ||
          (e.category?.name ?? "").toLowerCase().includes(q)
      )
    : rows;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Quản lý chi phí</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng chi phí
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">
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
            <div className="text-2xl font-semibold tracking-tight text-orange-600">
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
            <div className="text-2xl font-semibold tracking-tight text-emerald-600">
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
            onSubmit={async (data) => {
              await createExpense(data);
              await queryClient.invalidateQueries({ queryKey: ["expenses"] });
            }}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Danh sách chi phí</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile: search + card list (thay bảng 7 cột cho trải nghiệm mobile) */}
          <div className="md:hidden p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm chi phí..."
                value={mobileQuery}
                onChange={(e) => { setMobileQuery(e.target.value); setMobileVisible(10); }}
                className="pl-9 h-10"
              />
            </div>
            {mobileRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Chưa có chi phí nào.</p>
            ) : (
              <div className="space-y-2">
                {mobileRows.slice(0, mobileVisible).map((e) => {
                  const st = STATUS_SEMANTIC[e.status];
                  return (
                    <div key={e.id} className="rounded-lg border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium truncate">{e.category?.name ?? "-"}</span>
                        <span className="font-mono font-semibold text-rose-600 whitespace-nowrap">
                          {formatCurrency(e.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDate(e.date)}</span>
                        <span className="flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", st.dot)} />
                          {st.label}
                        </span>
                      </div>
                      {e.description && (
                        <p className="text-sm text-muted-foreground truncate">{e.description}</p>
                      )}
                      <div className="flex items-center justify-end gap-1 pt-1.5 border-t">
                        {e.status === "PENDING" && (
                          <>
                            <ApproveExpenseButton id={e.id} />
                            <RejectExpenseButton id={e.id} />
                          </>
                        )}
                        <DeleteExpenseButton id={e.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {mobileRows.length > mobileVisible && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10"
                onClick={() => setMobileVisible((v) => v + 10)}
              >
                Xem thêm ({mobileRows.length - mobileVisible})
              </Button>
            )}
          </div>
          {/* Desktop: bảng đầy đủ */}
          <div className="hidden md:block">
            <DataTable
              columns={expenseColumns}
              data={rows}
              searchColumn="description"
              searchPlaceholder="Tìm kiếm chi phí..."
              exportFilename="chi-phi.csv"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}