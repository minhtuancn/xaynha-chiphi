import Link from "next/link";
import { Plus } from "lucide-react";
import { getWorkers } from "@/actions/workers";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Worker } from "@prisma/client";

type WorkerWithCount = Worker & {
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

const columns: ColumnDef<WorkerWithCount>[] = [
  {
    accessorKey: "name",
    header: "Tên công nhân",
    cell: ({ row }) => (
      <Link
        href={`/workers/${row.original.id}/edit`}
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
    cell: ({ row }) => formatCurrency(row.original.dailyWage.toNumber()),
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
    accessorKey: "_count.attendances",
    header: "Số lần chấm công",
    cell: ({ row }) => row.original._count.attendances,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/workers/${row.original.id}/edit`}>
        <Button variant="outline" size="sm">
          Sửa
        </Button>
      </Link>
    ),
  },
];

export default async function WorkersPage() {
  const workers = await getWorkers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý công nhân</h1>
        <Link href="/workers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm công nhân
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={workers}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm công nhân..."
      />
    </div>
  );
}
