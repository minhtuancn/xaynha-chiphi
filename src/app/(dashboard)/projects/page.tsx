import Link from "next/link";
import { Plus } from "lucide-react";
import { getProjects } from "@/actions/projects";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, PROJECT_STATUS_LABELS } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Project } from "@prisma/client";

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Tên dự án",
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}/edit`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
  },
  {
    accessorKey: "budget",
    header: "Ngân sách",
    cell: ({ row }) => formatCurrency(row.getValue("budget")),
  },
  {
    accessorKey: "progress",
    header: "Tiến độ",
    cell: ({ row }) => `${row.getValue("progress")}%`,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <StatusBadge
        status={row.getValue("status")}
        labels={PROJECT_STATUS_LABELS}
      />
    ),
  },
  {
    accessorKey: "startDate",
    header: "Ngày bắt đầu",
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/projects/${row.original.id}/edit`}>
        <Button variant="outline" size="sm">
          Sửa
        </Button>
      </Link>
    ),
  },
];

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý dự án</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm dự án
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={projects}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm dự án..."
      />
    </div>
  );
}
