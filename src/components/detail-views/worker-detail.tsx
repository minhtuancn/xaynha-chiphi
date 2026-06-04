"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";

type WorkerDetailProps = {
  worker: {
    id: string;
    name: string;
    phone: string | null;
    idCard: string | null;
    skill: string | null;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Số điện thoại:</span> <span className="font-medium">{worker.phone || "-"}</span></div>
          <div><span className="text-muted-foreground">CMND/CCCD:</span> <span className="font-medium">{worker.idCard || "-"}</span></div>
          <div><span className="text-muted-foreground">Tay nghề:</span> <span className="font-medium">{worker.skill || "-"}</span></div>
          <div><span className="text-muted-foreground">Lương ngày:</span> <span className="font-medium">{formatCurrency(worker.dailyWage)}</span></div>
          <div><span className="text-muted-foreground">Trạng thái:</span> <Badge variant={worker.status === "ACTIVE" ? "default" : "secondary"}>{worker.status === "ACTIVE" ? "Đang làm" : "Ngưng làm"}</Badge></div>
          <div><span className="text-muted-foreground">Số lần chấm công:</span> <span className="font-medium">{worker._count.attendances}</span></div>
        </CardContent>
      </Card>

      {worker.notes && (
        <Card>
          <CardHeader><CardTitle>Ghi chú</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{worker.notes}</p></CardContent>
        </Card>
      )}

      {worker.debts && worker.debts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Công nợ gần đây</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              {worker.debts.map((d) => (
                <div key={d.id} className="flex justify-between border-b pb-1">
                  <span>{formatDate(d.createdAt)} - {d.type === "PAYABLE" ? "Phải trả" : "Phải thu"}</span>
                  <span className="font-mono">{formatCurrency(d.amount - d.paidAmount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
