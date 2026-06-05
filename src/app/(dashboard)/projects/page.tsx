"use client";

import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { columns } from "./columns";
import { useProjects } from "@/hooks/use-projects";

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
        <Card className="py-12 shadow-sm border-dashed flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></Card>
      ) : !projects || projects.length === 0 ? (
        <Card className="py-12 shadow-sm border-dashed text-center">
          <CardContent>
            <p className="text-muted-foreground">Không có dự án nào.</p>
          </CardContent>
        </Card>
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
