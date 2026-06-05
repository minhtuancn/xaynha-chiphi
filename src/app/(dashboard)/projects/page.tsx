import Link from "next/link";
import { Plus } from "lucide-react";
import { getProjects } from "@/actions/projects";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { serialize } from "@/lib/serialize";
import { columns } from "./columns";
import type { Project } from "@prisma/client";

export default async function ProjectsPage() {
  const projects = serialize(await getProjects()) as unknown as Project[];

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
      {projects.length === 0 ? (
        <Card className="py-12 shadow-sm text-center">
          <CardContent>
            <p className="text-muted-foreground">Không có dự án nào.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={projects}
          searchColumn="name"
          searchPlaceholder="Tìm kiếm dự án..."
        />
      )}
    </div>
  );
}
