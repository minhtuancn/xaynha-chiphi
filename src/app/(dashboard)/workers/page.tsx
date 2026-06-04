import Link from "next/link";
import { Plus } from "lucide-react";
import { getWorkers } from "@/actions/workers";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { serialize } from "@/lib/serialize";
import { columns } from "./columns";
import type { WorkerRow } from "./columns";

export default async function WorkersPage() {
  const workers = serialize(await getWorkers()) as unknown as WorkerRow[];

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
