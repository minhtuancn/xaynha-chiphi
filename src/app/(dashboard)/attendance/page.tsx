"use client";

import { useState, useEffect } from "react";
import { getWorkers, bulkAttendance, getAttendanceByDate } from "@/actions/workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/forms/date-picker";
import { formatCurrency } from "@/lib/utils";
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

  function formatTimeInput(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function parseTime(timeStr: string, baseDate: Date): Date | undefined {
    if (!timeStr) return undefined;
    const [hours, minutes] = timeStr.split(":").map(Number);
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

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

    await bulkAttendance(date, recordsArray);
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
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
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
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
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
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
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
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 text-lg font-bold">{statusCounts.LATE}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
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
                <tr key={worker.id} className="border-b transition-colors hover:bg-muted/50">
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
                          onClick={() => updateRecord(worker.id, { status })}
                          className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                            record.status === status
                              ? status === "PRESENT"
                                ? "border-green-500 bg-green-50 text-green-700"
                                : status === "ABSENT"
                                  ? "border-red-500 bg-red-50 text-red-700"
                                  : "border-yellow-500 bg-yellow-50 text-yellow-700"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
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
                      className="h-8 w-28"
                      disabled={record.status === "ABSENT"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="time"
                      value={record.checkOut}
                      onChange={(e) => updateRecord(worker.id, { checkOut: e.target.value })}
                      className="h-8 w-28"
                      disabled={record.status === "ABSENT"}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={record.notes}
                      onChange={(e) => updateRecord(worker.id, { notes: e.target.value })}
                      className="h-8 w-32"
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
