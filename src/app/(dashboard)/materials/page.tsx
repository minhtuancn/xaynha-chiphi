import Link from "next/link";
import { Plus } from "lucide-react";
import { getMaterials } from "@/actions/materials";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { serialize } from "@/lib/serialize";
import { columns, type MaterialWithRelations } from "./columns";

export default async function MaterialsPage() {
  const materials = serialize(await getMaterials()) as unknown as MaterialWithRelations[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý vật liệu</h1>
        <Link href="/materials/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm vật liệu
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={materials}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm vật liệu..."
        filters={[
          {
            column: "category.name",
            placeholder: "Lọc theo danh mục...",
          },
        ]}
      />
    </div>
  );
}
