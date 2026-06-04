"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteProject } from "@/actions/projects";
import { formatCurrency, formatDate, PROJECT_STATUS_LABELS } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Project } from "@prisma/client";

export type ProjectRow = Project;

function ActionsCell({ project }: { project: Project }) {
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deleteProject(project.id);
    if (result.success) {
      toast({ title: "Đã xóa dự án" });
      router.refresh();
    } else {
      toast({
        title: "Không thể xóa",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Link href={`/projects/${project.id}/edit?tab=edit`}>
        <Button variant="outline" size="sm">
          Sửa
        </Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa dự án</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dự án &quot;{project.name}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Tên dự án",
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}/edit?tab=view`}
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
    cell: ({ row }) => <ActionsCell project={row.original} />,
  },
];
