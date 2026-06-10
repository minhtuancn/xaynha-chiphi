import Link from "next/link";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/forms/payment-form";
import {
  getAccounts,
  getDebts,
  getPayments,
  addPayment,
} from "@/actions/financial";
import { formatCurrency, formatDate, DEBT_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { serialize } from "@/lib/serialize";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default async function DebtsPage() {
  const [debts, payments, accounts] = await Promise.all([
    getDebts(),
    getPayments(),
    getAccounts(),
  ]);

  const sDebts = serialize(debts);
  const sPayments = serialize(payments);
  const sAccounts = serialize(accounts);
  const totalPayable = sDebts
    .filter((d) => d.type === "PAYABLE")
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const totalReceivable = sDebts
    .filter((d) => d.type === "RECEIVABLE")
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const activeDebts = sDebts.filter((d) => d.status !== "PAID");

  const methodLabels: Record<string, string> = {
    CASH: "Tiền mặt",
    BANK: "Ngân hàng",
    TRANSFER: "Chuyển khoản",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý công nợ</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phải trả
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalPayable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phải thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(totalReceivable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Khoản nợ chưa thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeDebts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thanh toán nợ</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm
            debts={activeDebts.map((d) => ({
              id: d.id,
              amount: d.amount,
              paidAmount: d.paidAmount,
              type: d.type,
              supplierName: d.supplier?.name,
              workerName: d.worker?.name,
            }))}
            accounts={sAccounts}
            onSubmit={addPayment}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Tổng nợ</TableHead>
                  <TableHead className="text-right">Đã trả</TableHead>
                  <TableHead className="text-right">Còn lại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hạn</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sDebts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Chưa có khoản nợ nào
                    </TableCell>
                  </TableRow>
                ) : (
                  sDebts.map((debt) => {
                    const name = debt.supplier?.name || debt.worker?.name || "Không xác định";
                    const remaining = debt.amount - debt.paidAmount;
                    return (
                      <TableRow
                        key={debt.id}
                        className="group hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>
                          <Badge variant={DEBT_TYPE_VARIANTS[debt.type]}>
                            {DEBT_TYPE_LABELS[debt.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(debt.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-accent">
                          {formatCurrency(debt.paidAmount)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          remaining > 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={DEBT_STATUS_VARIANTS[debt.status]}>
                            {DEBT_STATUS_LABELS[debt.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {debt.dueDate ? formatDate(debt.dueDate) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="outline" className="text-xs cursor-default">
                              {debt.notes ? debt.notes.slice(0, 30) + (debt.notes.length > 30 ? "…" : "") : "Chi tiết"}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Ngày</TableHead>
                  <TableHead>Khoản nợ</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Chưa có thanh toán nào
                    </TableCell>
                  </TableRow>
                ) : (
                  sPayments.map((payment) => {
                    const debtName = payment.debt.supplier?.name || payment.debt.worker?.name || "Không xác định";
                    const typeLabel = payment.debt.type === "PAYABLE" ? "Phải trả" : "Phải thu";
                    return (
                      <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell className="font-medium">
                          {debtName} ({typeLabel})
                        </TableCell>
                        <TableCell className="text-right font-mono text-accent">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>{methodLabels[payment.method] || payment.method}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {payment.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
