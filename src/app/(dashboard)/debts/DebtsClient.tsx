"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/forms/payment-form";
import { DataTable } from "@/components/ui/data-table";
import { addPayment } from "@/actions/financial";
import { formatCurrency, formatDate, DEBT_STATUS_LABELS, cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useState, useEffect } from "react";

const DEBT_TYPE_LABELS: Record<string, string> = {
  PAYABLE: "Phải trả",
  RECEIVABLE: "Phải thu",
};
const DEBT_TYPE_VARIANTS: Record<string, "default" | "destructive"> = {
  PAYABLE: "destructive",
  RECEIVABLE: "default",
};
const DEBT_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  UNPAID: "destructive",
  PARTIAL: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
};
const methodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK: "Ngân hàng",
  TRANSFER: "Chuyển khoản",
};

// ── Debt table ──────────────────────────────────────────────────────────────
export type DebtRow = {
  id: string;
  amount: number;
  paidAmount: number;
  type: string;
  status: string;
  dueDate: Date | null;
  notes: string | null;
  supplier: { name: string } | null;
  worker: { name: string } | null;
};

export const debtColumns: ColumnDef<DebtRow>[] = [
  {
    id: "name",
    header: "Đối tượng",
    cell: ({ row }) => row.original.supplier?.name || row.original.worker?.name || "Không xác định",
  },
  {
    accessorKey: "type",
    header: "Loại",
    meta: { hideOnMobile: true } as never,
    cell: ({ row }) => (
      <Badge variant={DEBT_TYPE_VARIANTS[row.original.type]}>
        {DEBT_TYPE_LABELS[row.original.type]}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <span className="text-right">Tổng nợ</span>,
    cell: ({ row }) => (
      <span className="text-right font-mono block">{formatCurrency(row.original.amount)}</span>
    ),
  },
  {
    id: "paidAmount",
    accessorKey: "paidAmount",
    header: () => <span className="text-right">Đã trả</span>,
    meta: { hideOnMobile: true } as never,
    cell: ({ row }) => (
      <span className="text-right font-mono block text-foreground">{formatCurrency(row.original.paidAmount)}</span>
    ),
  },
  {
    id: "remaining",
    header: () => <span className="text-right">Còn lại</span>,
    cell: ({ row }) => {
      const remaining = row.original.amount - row.original.paidAmount;
      return (
        <span className={cn("text-right font-mono block", remaining > 0 ? "text-destructive" : "text-muted-foreground")}>
          {formatCurrency(remaining)}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={DEBT_STATUS_VARIANTS[row.original.status]}>
        {DEBT_STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "dueDate",
    header: "Hạn",
    cell: ({ row }) => row.original.dueDate ? formatDate(row.original.dueDate) : "-",
    meta: { hideOnMobile: true } as never,
  },
  {
    id: "notes",
    accessorKey: "notes",
    header: "Ghi chú",
    meta: { hideOnMobile: true } as never,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground max-w-[120px] truncate block">
        {row.original.notes || "-"}
      </span>
    ),
  },
];

// ── Payment table ────────────────────────────────────────────────────────────
export type PaymentRow = {
  id: string;
  date: Date;
  amount: number;
  method: string;
  notes: string | null;
  debt: DebtRow;
};

export const paymentColumns: ColumnDef<PaymentRow>[] = [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    id: "debtName",
    header: "Khoản nợ",
    cell: ({ row }) => {
      const name = row.original.debt.supplier?.name || row.original.debt.worker?.name || "Không xác định";
      const typeLabel = row.original.debt.type === "PAYABLE" ? "Phải trả" : "Phải thu";
      return <span className="font-medium">{name} ({typeLabel})</span>;
    },
  },
  {
    accessorKey: "amount",
    header: () => <span className="text-right">Số tiền</span>,
    cell: ({ row }) => (
      <span className="text-right font-mono block text-foreground">{formatCurrency(row.original.amount)}</span>
    ),
  },
  {
    accessorKey: "method",
    header: "Phương thức",
    cell: ({ row }) => methodLabels[row.original.method] || row.original.method,
  },
  {
    accessorKey: "notes",
    header: "Ghi chú",
    cell: ({ row }) => (
      <span className="max-w-xs truncate block text-muted-foreground">
        {row.original.notes || "-"}
      </span>
    ),
  },
];

export default function DebtsClient() {
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { getDebts, getPayments, getAccounts } = await import("@/actions/financial");
      const { serialize } = await import("@/lib/serialize");
      const [d, p, a] = await Promise.all([getDebts(), getPayments(), getAccounts()]);
      const sd = serialize(d);
      const sp = serialize(p);
      setDebts(sd.map((debt: any) => ({
        ...debt,
        dueDate: debt.dueDate ? new Date(debt.dueDate) : null,
        supplier: debt.supplier ?? null,
        worker: debt.worker ?? null,
      })));
      setPayments(sp.map((pay: any) => ({
        ...pay,
        date: new Date(pay.date),
        debt: {
          ...sd.find((d: any) => d.id === pay.debtId),
          supplier: pay.debt?.supplier ?? null,
          worker: pay.debt?.worker ?? null,
        },
      })));
      setAccounts(serialize(a));
      setLoading(false);
    }
    load();
  }, []);

  const totalPayable = debts.filter((d) => d.type === "PAYABLE").reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
  const totalReceivable = debts.filter((d) => d.type === "RECEIVABLE").reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);
  const activeDebts = debts.filter((d) => d.status !== "PAID");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý công nợ</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng phải trả</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-destructive">{formatCurrency(totalPayable)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng phải thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight text-emerald-600">{formatCurrency(totalReceivable)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Khoản nợ chưa thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{activeDebts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Thanh toán nợ</CardTitle></CardHeader>
        <CardContent>
          <PaymentForm
            debts={activeDebts.map((d) => ({
              id: d.id, amount: d.amount, paidAmount: d.paidAmount,
              type: d.type,
              supplierName: d.supplier?.name,
              workerName: d.worker?.name,
            }))}
            accounts={accounts}
            onSubmit={addPayment}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danh sách công nợ</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading
            ? <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
            : <DataTable columns={debtColumns} data={debts} searchColumn="supplier.name" searchPlaceholder="Tìm kiếm công nợ..." exportFilename="cong-no.csv" />
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lịch sử thanh toán</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading
            ? <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
            : <DataTable columns={paymentColumns} data={payments} searchColumn="debtName" searchPlaceholder="Tìm kiếm thanh toán..." />
          }
        </CardContent>
      </Card>
    </div>
  );
}