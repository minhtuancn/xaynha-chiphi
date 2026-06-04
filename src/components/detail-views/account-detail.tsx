"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";

interface AccountDetailProps {
  account: {
    id: string;
    name: string;
    type: string;
    balance: number;
    transactions: {
      id: string;
      date: Date | string;
      type: string;
      amount: number;
      description: string | null;
    }[];
  };
}

export function AccountDetail({ account }: AccountDetailProps) {
  const { formatCurrency, formatDate } = useUserSettings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{account.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {formatCurrency(account.balance)}
          </div>
          <Badge variant="outline" className="mt-2">
            {account.type === "CASH" ? "Tiền mặt" : "Ngân hàng"}
          </Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây ({account.transactions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!account.transactions || account.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có giao dịch</p>
          ) : (
            <div className="text-sm space-y-2">
              {account.transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between border-b pb-1">
                  <span>{formatDate(tx.date)} - {tx.description || "-"}</span>
                  <span className={cn("font-mono", tx.type === "INCOME" ? "text-green-600" : "text-red-600")}>
                    {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
