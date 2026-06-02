import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentForm } from "@/components/forms/payment-form";
import {
  getDebts,
  getPayments,
  createDebt,
  addPayment,
} from "@/actions/financial";
import { formatCurrency, formatDate, DEBT_STATUS_LABELS } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  const [debts, payments] = await Promise.all([
    getDebts(),
    getPayments(),
  ]);

  const totalPayable = debts
    .filter((d) => d.type === "PAYABLE")
    .reduce((sum, d) => sum + d.amount.sub(d.paidAmount).toNumber(), 0);

  const totalReceivable = debts
    .filter((d) => d.type === "RECEIVABLE")
    .reduce((sum, d) => sum + d.amount.sub(d.paidAmount).toNumber(), 0);

  const activeDebts = debts.filter((d) => d.status !== "PAID");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý công nợ</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng phải trả
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
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
            <div className="text-2xl font-bold text-green-600">
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
              amount: d.amount.toNumber(),
              paidAmount: d.paidAmount.toNumber(),
              type: d.type,
              supplierName: d.supplier?.name,
              workerName: d.worker?.name,
            }))}
            onSubmit={addPayment}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Đối tượng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Loại</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Tổng nợ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Đã trả</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Còn lại</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Hạn</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {debts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có khoản nợ nào
                    </td>
                  </tr>
                ) : (
                  debts.map((debt) => {
                    const name = debt.supplier?.name || debt.worker?.name || "Không xác định";
                    const remaining = debt.amount.sub(debt.paidAmount).toNumber();
                    return (
                      <tr key={debt.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-sm font-medium">
                          {name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={DEBT_TYPE_VARIANTS[debt.type]}>
                            {DEBT_TYPE_LABELS[debt.type]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          {formatCurrency(debt.amount.toNumber())}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-green-600">
                          {formatCurrency(debt.paidAmount.toNumber())}
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-sm text-right font-mono",
                          remaining > 0 ? "text-red-600" : "text-muted-foreground"
                        )}>
                          {formatCurrency(remaining)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={DEBT_STATUS_VARIANTS[debt.status]}>
                            {DEBT_STATUS_LABELS[debt.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {debt.dueDate ? formatDate(debt.dueDate) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {debt.notes || "-"}
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

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Khoản nợ</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Số tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Phương thức</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có thanh toán nào
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => {
                    const debtName = payment.debt.supplier?.name || payment.debt.worker?.name || "Không xác định";
                    const typeLabel = payment.debt.type === "PAYABLE" ? "Phải trả" : "Phải thu";
                    const methodLabels: Record<string, string> = {
                      CASH: "Tiền mặt",
                      BANK: "Ngân hàng",
                      TRANSFER: "Chuyển khoản",
                    };
                    return (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="px-4 py-3 text-sm">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {debtName} ({typeLabel})
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-green-600">
                          {formatCurrency(payment.amount.toNumber())}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {methodLabels[payment.method] || payment.method}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {payment.notes || "-"}
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
