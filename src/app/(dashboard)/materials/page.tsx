"use client"

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useMaterialsPaginated } from "@/hooks/use-materials";
import { useMaterialCategories } from "@/hooks/use-material-categories";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryManager } from "@/components/category-manager";
import { columns, type MaterialWithRelations } from "./columns";
import { TableSkeleton } from "@/components/ui/loading-skeleton";

const PAGE_SIZE = 20;

export default function MaterialsPage() {
  const [page, setPage] = useState(1);
  const { data: materials, isLoading: materialsLoading } = useMaterialsPaginated(page, PAGE_SIZE);
  const { data: categories, isLoading: categoriesLoading } = useMaterialCategories();

  const isLoading = materialsLoading || categoriesLoading;
  const items = materials && "data" in materials ? (materials as { data: MaterialWithRelations[]; total: number }).data : (materials as MaterialWithRelations[] | undefined);
  const total = materials && "data" in materials ? (materials as { data: MaterialWithRelations[]; total: number }).total : undefined;

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
          <TableSkeleton rows={5} cols={5} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={(items || []) as MaterialWithRelations[]}
              searchColumn="name"
              searchPlaceholder="Tìm kiếm vật liệu..."
              filters={[
                {
                  column: "categoryName",
                  placeholder: "Lọc theo danh mục...",
                },
              ]}
            />
            {total != null && total > PAGE_SIZE && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <span className="text-sm text-muted-foreground">
                  Trang {page} / {Math.ceil(total / PAGE_SIZE)}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(Math.ceil(total / PAGE_SIZE), p + 1))}
                    disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
