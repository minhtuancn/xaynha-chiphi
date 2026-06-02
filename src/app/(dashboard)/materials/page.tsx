import Link from "next/link";
import { Plus } from "lucide-react";
import { getMaterials } from "@/actions/materials";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatUnit } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Material, MaterialCategory, Supplier } from "@prisma/client";

type MaterialWithRelations = Material & {
  category: MaterialCategory;
  supplier: Supplier | null;
};

const columns: ColumnDef<MaterialWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Tên vật liệu",
    cell: ({ row }) => (
      <Link
        href={`/materials/${row.original.id}/edit`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "category.name",
    header: "Danh mục",
    cell: ({ row }) => row.original.category.name,
  },
  {
    accessorKey: "currentStock",
    header: "Tồn kho",
    cell: ({ row }) => {
      const current = row.original.currentStock.toNumber();
      const min = row.original.minStock.toNumber();
      const isLow = current < min;
      return (
        <span className={isLow ? "text-red-600 font-semibold" : ""}>
          {formatUnit(current, row.original.unit)}
        </span>
      );
    },
  },
  {
    accessorKey: "minStock",
    header: "Tối thiểu",
    cell: ({ row }) =>
      formatUnit(row.original.minStock.toNumber(), row.original.unit),
  },
  {
    accessorKey: "unitCost",
    header: "Đơn giá",
    cell: ({ row }) => formatCurrency(row.original.unitCost.toNumber()),
  },
  {
    accessorKey: "supplier.name",
    header: "Nhà cung cấp",
    cell: ({ row }) => row.original.supplier?.name ?? "-",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/materials/${row.original.id}/edit`}>
        <Button variant="outline" size="sm">
          Sửa
        </Button>
      </Link>
    ),
  },
];

export default async function MaterialsPage() {
  const materials = await getMaterials();

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
      />
    </div>
  );
}
