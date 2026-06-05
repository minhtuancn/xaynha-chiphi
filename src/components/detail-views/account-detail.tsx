"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownRight, Banknote, CreditCard } from "lucide-react";

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

  const income = account.transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = account.transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Balance hero */}
      <Card variant="gradient">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "rounded-full p-2",
                  account.type === "CASH" ? "bg-accent/10" : "bg-primary/10"
                )}>
                  {account.type === "CASH"
                    ? <Banknote className={cn("h-5 w-5", "text-accent")} />
                    : <CreditCard className="h-5 w-5 text-primary" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium">{account.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {account.type === "CASH" ? "Tiền mặt" : "Ngân hàng"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Số dư</p>
                <p className="text-3xl font-bold tracking-tight">{formatCurrency(account.balance)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Thu nhập</p>
                <p className="mt-1 text-lg font-bold text-green-600">{formatCurrency(income)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{account.transactions.filter((t) => t.type === "INCOME").length} giao dịch</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Chi tiêu</p>
                <p className="mt-1 text-lg font-bold text-destructive">{formatCurrency(expense)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{account.transactions.filter((t) => t.type === "EXPENSE").length} giao dịch</p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <ArrowDownRight className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Wallet className="h-4 w-4" />}>
            Giao dịch gần đây
            <Badge variant="secondary" className="ml-2 text-xs">{account.transactions?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!account.transactions || account.transactions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Chưa có giao dịch</p>
            </div>
          ) : (
            <div className="divide-y">
              {account.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "rounded-full p-1.5 mt-0.5",
                      tx.type === "INCOME" ? "bg-green-500/10" : "bg-destructive/10"
                    )}>
                      {tx.type === "INCOME"
                        ? <ArrowUpRight className={cn("h-3.5 w-3.5", "text-green-600")} />
                        : <ArrowDownRight className={cn("h-3.5 w-3.5", "text-destructive")} />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description || "Giao dịch"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className={cn("font-mono font-medium", tx.type === "INCOME" ? "text-green-600" : "text-destructive")}>
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