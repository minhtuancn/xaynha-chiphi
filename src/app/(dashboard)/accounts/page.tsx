import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/forms/transaction-form";
import {
  getAccounts,
  getTransactions,
  createTransaction,
  createAccount,
} from "@/actions/financial";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { serialize } from "@/lib/serialize";

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

export default async function AccountsPage() {
  const [accounts, transactions] = await Promise.all([
    getAccounts(),
    getTransactions(),
  ]);

  const serializedAccounts = serialize(accounts);
  const serializedTransactions = serialize(transactions);

  const totalBalance = serializedAccounts.reduce((sum, acc) => sum + acc.balance, 0);

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
        {serializedAccounts.map((acc) => (
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
            accounts={serializedAccounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))}
            onSubmit={createTransaction}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-all">
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tài khoản</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Loại</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Số tiền</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Danh mục</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {serializedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  serializedTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {tx.account.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={TRANSACTION_TYPE_VARIANTS[tx.type]}>
                          {TRANSACTION_TYPE_LABELS[tx.type]}
                        </Badge>
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-sm text-right font-mono",
                        tx.type === "INCOME" ? "text-accent" : "text-destructive"
                      )}>
                        {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tx.category || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {tx.description || "-"}
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
