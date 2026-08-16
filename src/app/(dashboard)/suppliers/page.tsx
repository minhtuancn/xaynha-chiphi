import Link from "next/link";
import { Plus } from "lucide-react";
import { getSuppliers } from "@/actions/suppliers";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { serialize } from "@/lib/serialize";
import { columns } from "./columns";
import type { SupplierRow } from "./columns";

export default async function SuppliersPage() {
  const suppliers = serialize(await getSuppliers()) as unknown as SupplierRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý nhà cung cấp</h1>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhà cung cấp
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={suppliers}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm nhà cung cấp..."
      />
    </div>
  );
}
