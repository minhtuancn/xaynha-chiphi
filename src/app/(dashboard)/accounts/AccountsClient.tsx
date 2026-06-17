"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/forms/transaction-form";
import { DataTable } from "@/components/ui/data-table";
import { createTransaction, createAccount } from "@/actions/financial";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK: "Ngân hàng",
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: "Thu nhập",
  EXPENSE: "Chi phí",
};

const TRANSACTION_TYPE_VARIANTS: Record<string, "default" | "destructive"> = {
  INCOME: "default",
  EXPENSE: "destructive",
};

export type TransactionRow = {
  id: string;
  date: Date;
  account: { name: string };
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string | null;
  reference: string | null;
  description: string | null;
};

export const transactionColumns: ColumnDef<TransactionRow>[] = [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "account.name",
    header: "Tài khoản",
    cell: ({ row }) => row.original.account?.name ?? "-",
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => (
      <Badge variant={TRANSACTION_TYPE_VARIANTS[row.original.type]}>
        {TRANSACTION_TYPE_LABELS[row.original.type]}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <span className="text-right">Số tiền</span>,
    cell: ({ row }) => (
      <span className={cn(
        "text-right font-mono block",
        row.original.type === "INCOME" ? "text-accent" : "text-destructive"
      )}>
        {row.original.type === "INCOME" ? "+" : "-"}{formatCurrency(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Danh mục",
    cell: ({ row }) => row.original.category || "-",
  },
  {
    accessorKey: "reference",
    header: "Tham chiếu",
    cell: ({ row }) => row.original.reference || "-",
  },
  {
    accessorKey: "description",
    header: "Mô tả",
    cell: ({ row }) => (
      <span className="max-w-xs truncate block">
        {row.original.description || "-"}
      </span>
    ),
  },
];

type AccountSummary = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export default function AccountsClient() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { getAccounts, getTransactions } = await import("@/actions/financial");
      const [accs, rawTxs] = await Promise.all([getAccounts(), getTransactions()]);
      const { serialize } = await import("@/lib/serialize");
      setAccounts(serialize(accs));
      const txs = (rawTxs as { data: unknown[] }).data ?? [];
      setTransactions((txs as any[]).map((t: any) => ({
        ...t,
        date: new Date(t.date),
        account: t.account ?? { name: "-" },
      })));
      setLoading(false);
    }
    load();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số dư
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
          </CardContent>
        </Card>
        {accounts.map((acc) => (
          <Card key={acc.id} className="shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {acc.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                acc.balance < 0 && "text-destructive"
              )}>
                {formatCurrency(acc.balance)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <Badge variant="outline">
                  {ACCOUNT_TYPE_LABELS[acc.type]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <TransactionForm
            accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type as "CASH" | "BANK" }))}
            onSubmit={createTransaction}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
          ) : (
            <DataTable
              columns={transactionColumns}
              data={transactions}
              searchColumn="account.name"
              searchPlaceholder="Tìm kiếm giao dịch..."
              exportFilename="giao-dich.csv"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}