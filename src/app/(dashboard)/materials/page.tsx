import Link from "next/link";
import { Plus } from "lucide-react";
import { getMaterials, getMaterialCategories } from "@/actions/materials";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryManager } from "@/components/category-manager";
import { serialize } from "@/lib/serialize";
import { columns, type MaterialWithRelations } from "./columns";

export default async function MaterialsPage() {
  const [materials, categories] = await Promise.all([
    getMaterials(),
    getMaterialCategories(),
  ]);

  const serializedMaterials = serialize(materials) as unknown as MaterialWithRelations[];
  const serializedCategories = serialize(categories);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý vật liệu</h1>
        <div className="flex gap-2">
          <CategoryManager categories={serializedCategories} />
          <Link href="/materials/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm vật liệu
            </Button>
          </Link>
        </div>
      </div>
      <Card className="shadow-sm">
        <DataTable
          columns={columns}
          data={serializedMaterials}
          searchColumn="name"
          searchPlaceholder="Tìm kiếm vật liệu..."
          filters={[
            {
              column: "categoryName",
              placeholder: "Lọc theo danh mục...",
            },
          ]}
        />
      </Card>
    </div>
  );
}
