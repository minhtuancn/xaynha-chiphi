"use client"

import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { useMaterials } from "@/hooks/use-materials";
import { useMaterialCategories } from "@/hooks/use-material-categories";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryManager } from "@/components/category-manager";
import { columns, type MaterialWithRelations } from "./columns";

export default function MaterialsPage() {
  const { data: materials, isLoading: materialsLoading } = useMaterials();
  const { data: categories, isLoading: categoriesLoading } = useMaterialCategories();

  const isLoading = materialsLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý vật liệu</h1>
        <div className="flex gap-2">
          {categories && <CategoryManager categories={categories} />}
          <Link href="/materials/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm vật liệu
            </Button>
          </Link>
        </div>
      </div>
      <Card className="shadow-sm p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={(materials || []) as unknown as MaterialWithRelations[]}
            searchColumn="name"
            searchPlaceholder="Tìm kiếm vật liệu..."
            filters={[
              {
                column: "categoryName",
                placeholder: "Lọc theo danh mục...",
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
