"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { columns } from "./columns";
import { useProjects } from "@/hooks/use-projects";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-semibold text-foreground">Quản lý dự án</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm dự án
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-8 w-8" />}
          title="Chưa có dự án nào"
          description="Tạo dự án đầu tiên để bắt đầu quản lý thi công."
          action={{ label: "Tạo dự án", onClick: () => window.location.href = "/projects/new" }}
        />
      ) : (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={projects}
              searchColumn="name"
              searchPlaceholder="Tìm kiếm dự án..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
