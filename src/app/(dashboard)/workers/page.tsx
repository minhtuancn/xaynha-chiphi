"use client"

import Link from "next/link";
import { Plus } from "lucide-react";
import { useWorkers } from "@/hooks/use-workers";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { columns } from "./columns";
import type { WorkerRow } from "./columns";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

export default function WorkersPage() {
  const { data: workers, isLoading } = useWorkers();

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

      <Card className="shadow-sm p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <DataTable
            columns={columns}
            data={(workers || []) as unknown as WorkerRow[]}
            searchColumn="name"
            searchPlaceholder="Tìm kiếm công nhân..."
          />
        )}
      </Card>
    </div>
  );
}
