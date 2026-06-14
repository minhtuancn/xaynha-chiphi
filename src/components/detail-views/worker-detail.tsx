"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { Briefcase, CalendarDays, Phone, CreditCard, Activity, Building2, Hash } from "lucide-react";

type WorkerDetailProps = {
  worker: {
    id: string;
    name: string;
    phone: string | null;
    idCard: string | null;
    skill: string | null;
    taxCode: string | null;
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountHolder: string | null;
    bankBranch: string | null;
    dailyWage: number;
    status: string;
    notes: string | null;
    createdAt: Date | string;
    _count: { attendances: number };
    attendances: { id: string; date: Date | string; status: string }[];
    debts: { id: string; amount: number; paidAmount: number; type: string; status: string; createdAt: Date | string }[];
  };
};

export function WorkerDetail({ worker }: WorkerDetailProps) {
  const { formatCurrency, formatDate } = useUserSettings();

  const totalDebt = worker.debts.reduce((s, d) => s + (d.amount - d.paidAmount), 0);
  const presentDays = worker.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const totalDays = worker.attendances.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const estimatedMonthly = worker.dailyWage * 26;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Lương ngày</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(worker.dailyWage)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">~{formatCurrency(estimatedMonthly)}/tháng</p>
              </div>
              <div className="rounded-full bg-accent/10 p-2.5 text-accent">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tỷ lệ chấm công</p>
                <p className="mt-1 text-xl font-bold">{attendanceRate}%</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{presentDays}/{totalDays} ngày</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-2.5 text-green-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Công nợ</p>
                <p className={cn("mt-1 text-xl font-bold", totalDebt > 0 ? "text-destructive" : "text-green-600")}>
                  {formatCurrency(totalDebt)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{worker.debts.length} khoản</p>
              </div>
              <div className={cn("rounded-full p-2.5", totalDebt > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600")}>
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Số lần chấm công</p>
                <p className="mt-1 text-xl font-bold">{worker._count.attendances}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">tổng cộng</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main info */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Briefcase className="h-4 w-4" />}>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {worker.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Điện thoại:</span>
                <span className="font-medium">{worker.phone}</span>
              </div>
            )}
            {worker.idCard && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">CMND/CCCD:</span>
                <span className="font-medium">{worker.idCard}</span>
              </div>
            )}
            {worker.skill && (
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Tay nghề:</span>
                <Badge variant="outline">{worker.skill}</Badge>
              </div>
            )}
            {worker.taxCode && (
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Mã số thuế:</span>
                <span className="font-medium">{worker.taxCode}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Trạng thái:</span>
              <Badge variant={worker.status === "ACTIVE" ? "default" : "secondary"}>
                {worker.status === "ACTIVE" ? "Đang làm" : "Ngưng làm"}
              </Badge>
            </div>
          </div>
          {(worker.bankName || worker.bankAccountNumber || worker.bankAccountHolder || worker.bankBranch) && (
            <div className="mt-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {worker.bankName && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Ngân hàng:</span>
                    <span className="font-medium">{worker.bankName}</span>
                  </div>
                )}
                {worker.bankAccountNumber && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <span className="font-medium">{worker.bankAccountNumber}</span>
                  </div>
                )}
                {worker.bankAccountHolder && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Chủ TK:</span>
                    <span className="font-medium">{worker.bankAccountHolder}</span>
                  </div>
                )}
                {worker.bankBranch && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Chi nhánh:</span>
                    <span className="font-medium">{worker.bankBranch}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {worker.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-1">Ghi chú</p>
              <p className="text-sm">{worker.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent attendances */}
      {worker.attendances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle icon={<CalendarDays className="h-4 w-4" />}>Chấm công gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 overflow-x-auto">
              {worker.attendances.slice(0, 14).map((a) => (
                <div key={a.id} className="flex flex-col items-center shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium",
                    a.status === "PRESENT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    a.status === "LATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {a.status === "PRESENT" ? "C" : a.status === "LATE" ? "M" : "V"}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {typeof a.date === "string" ? a.date.slice(5, 10) : new Date(a.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent debts */}
      {worker.debts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle icon={<CreditCard className="h-4 w-4" />}>Công nợ gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {worker.debts.map((d) => (
                <div key={d.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm">{formatDate(d.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.type === "PAYABLE" ? "Phải trả" : "Phải thu"}
                      {" · "}
                      <Badge variant="outline" className="text-xs">{d.status}</Badge>
                    </p>
                  </div>
                  <span className={cn("font-mono font-medium", d.amount - d.paidAmount > 0 ? "text-destructive" : "text-green-600")}>
                    {formatCurrency(d.amount - d.paidAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
