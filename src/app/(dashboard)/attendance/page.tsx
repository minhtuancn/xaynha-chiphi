"use client";

import { useState, useEffect } from "react";
import { getWorkers, bulkAttendance, getAttendanceByDate } from "@/actions/workers";
import { useOffline } from "@/components/offline-provider";
import { enqueue } from "@/lib/offline-queue";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/forms/date-picker";
import { formatCurrency } from "@/lib/utils";
import { formatTimeInput, parseTime } from "@/lib/time";
import type { Worker } from "@prisma/client";

type WorkerWithCount = Worker & {
  _count: { attendances: number };
};

type AttendanceRecord = {
  workerId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  checkIn: string;
  checkOut: string;
  notes: string;
};

const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "Có mặt",
  ABSENT: "Vắng mặt",
  LATE: "Đi trễ",
};

export default function AttendancePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [workers, setWorkers] = useState<WorkerWithCount[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [records, setRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadData() {
      const workersData = await getWorkers();
      setWorkers(workersData.filter((w) => w.status === "ACTIVE" && !w.deletedAt));

      const attendanceData = await getAttendanceByDate(date);
      const existingMap = new Map<string, AttendanceRecord>();
      for (const att of attendanceData) {
        existingMap.set(att.workerId, {
          workerId: att.workerId,
          status: att.status,
          checkIn: att.checkIn ? formatTimeInput(att.checkIn) : "",
          checkOut: att.checkOut ? formatTimeInput(att.checkOut) : "",
          notes: att.notes ?? "",
        });
      }
      setExistingAttendance(existingMap);

      const newRecords = new Map<string, AttendanceRecord>();
      for (const worker of workersData.filter((w) => w.status === "ACTIVE" && !w.deletedAt)) {
        const existing = existingMap.get(worker.id);
        newRecords.set(worker.id, {
          workerId: worker.id,
          status: existing?.status ?? "PRESENT",
          checkIn: existing?.checkIn ?? "",
          checkOut: existing?.checkOut ?? "",
          notes: existing?.notes ?? "",
        });
      }
      setRecords(newRecords);
      setSaved(false);
    }
    loadData();
  }, [date]);

  function updateRecord(workerId: string, updates: Partial<AttendanceRecord>) {
    setRecords((prev) => {
      const next = new Map(prev);
      const record = next.get(workerId);
      if (record) {
        next.set(workerId, { ...record, ...updates });
      }
      return next;
    });
  }

  const { isOffline } = useOffline();
  const { toast } = useToast();

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const recordsArray = Array.from(records.values()).map((r) => ({
      workerId: r.workerId,
      status: r.status,
      checkIn: parseTime(r.checkIn, date),
      checkOut: parseTime(r.checkOut, date),
      notes: r.notes || undefined,
    }));

    if (isOffline) {
      enqueue("bulkAttendance", { date: date.toISOString(), records: recordsArray });
      toast({ title: "Đã lưu vào hàng đợi", description: "Dữ liệu điểm danh sẽ được đồng bộ khi có kết nối lại." });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    try {
      await bulkAttendance(date, recordsArray);
    } catch (e: any) {
      if (e?.message?.includes("fetch") || e?.message?.includes("network") || e?.cause?.code === "ECONNREFUSED") {
        enqueue("bulkAttendance", { date: date.toISOString(), records: recordsArray });
        toast({ title: "Đã lưu vào hàng đợi", description: "Dữ liệu điểm danh sẽ được đồng bộ khi có kết nối lại." });
      } else {
        throw e;
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const statusCounts = {
    PRESENT: Array.from(records.values()).filter((r) => r.status === "PRESENT").length,
    ABSENT: Array.from(records.values()).filter((r) => r.status === "ABSENT").length,
    LATE: Array.from(records.values()).filter((r) => r.status === "LATE").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chấm công</h1>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <DatePicker value={date} onChange={(d) => d && setDate(d)} />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu chấm công"}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          Đã lưu chấm công thành công!
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Có mặt</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.PRESENT}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <span className="text-accent text-lg font-bold">{statusCounts.PRESENT}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vắng mặt</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.ABSENT}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <span className="text-destructive text-lg font-bold">{statusCounts.ABSENT}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đi trễ</p>
              <p className="text-2xl font-bold mt-1">{statusCounts.LATE}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-400 text-lg font-bold">{statusCounts.LATE}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b bg-muted/50 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Tên công nhân</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Tay nghề</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Lương ngày</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Giờ vào</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Giờ ra</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => {
              const record = records.get(worker.id);
              if (!record) return null;

              return (
                <tr key={worker.id} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-muted/50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium">{worker.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {worker.skill ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatCurrency(Number(worker.dailyWage))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {(["PRESENT", "ABSENT", "LATE"] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          aria-pressed={record.status === status}
                          onClick={() => updateRecord(worker.id, { status })}
                          className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                            record.status === status
                              ? status === "PRESENT"
                                ? "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/40 dark:text-green-300"
                              : status === "ABSENT"
                                ? "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/40 dark:text-red-300"
                              : "border-yellow-500 bg-yellow-50 text-yellow-700 dark:border-yellow-400 dark:bg-yellow-900/40 dark:text-yellow-300"
                            : "border-border bg-background text-muted-foreground hover:bg-muted dark:hover:bg-muted"
                          }`}
                        >
                          {ATTENDANCE_STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="time"
                      value={record.checkIn}
                      onChange={(e) => updateRecord(worker.id, { checkIn: e.target.value })}
                      className="h-8 w-28 md:w-auto min-w-[80px]"
                      disabled={record.status === "ABSENT"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="time"
                      value={record.checkOut}
                      onChange={(e) => updateRecord(worker.id, { checkOut: e.target.value })}
                      className="h-8 w-28 md:w-auto min-w-[80px]"
                      disabled={record.status === "ABSENT"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={record.notes}
                      onChange={(e) => updateRecord(worker.id, { notes: e.target.value })}
                      className="h-8 w-32 md:w-auto min-w-[100px]"
                      placeholder="Ghi chú..."
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {workers.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            Không có công nhân đang hoạt động
          </div>
        )}
      </div>
    </div>
  );
}
