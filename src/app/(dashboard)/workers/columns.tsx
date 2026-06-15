"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Worker } from "@prisma/client";

export type WorkerRow = Worker & {
  _count: { attendances: number };
};

const WORKER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang làm",
  INACTIVE: "Ngưng làm",
};

const WORKER_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
};

export const columns: ColumnDef<WorkerRow>[] = [
  {
    accessorKey: "name",
    header: "Tên công nhân",
    cell: ({ row }) => (
      <Link
        href={`/workers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.phone ?? "-",
  },
  {
    accessorKey: "skill",
    header: "Tay nghề",
    cell: ({ row }) => row.original.skill ?? "-",
  },
  {
    accessorKey: "dailyWage",
    header: "Lương ngày",
    cell: ({ row }) => formatCurrency(Number(row.original.dailyWage)),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={WORKER_STATUS_VARIANT[row.original.status] ?? "outline"}>
        {WORKER_STATUS_LABELS[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: "attendanceCount",
    accessorFn: (row) => row._count.attendances,
    header: "Số lần chấm công",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/workers/${row.original.id}?tab=edit`}>
        <Button variant="outline" size="sm">
          Sửa
        </Button>
      </Link>
    ),
  },
];
