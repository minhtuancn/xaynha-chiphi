"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatUnit } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Material, MaterialCategory, Supplier } from "@prisma/client";

export type MaterialWithRelations = Material & {
  category: MaterialCategory;
  supplier: Supplier | null;
};

export const columns: ColumnDef<MaterialWithRelations>[] = [
  {
    id: "stt",
    header: "STT",
    cell: ({ row }) => row.index + 1,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Tên vật liệu",
    cell: ({ row }) => (
      <Link
        href={`/materials/${row.original.id}/edit?tab=view`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    id: "categoryName",
    accessorFn: (row) => row.category?.name ?? "",
    header: "Danh mục",
    cell: ({ row }) => row.original.category.name,
  },
  {
    accessorKey: "currentStock",
    header: "Tồn kho",
    cell: ({ row }) => {
      const current = Number(row.original.currentStock);
      const min = Number(row.original.minStock);
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
      formatUnit(Number(row.original.minStock), row.original.unit),
  },
  {
    accessorKey: "unitCost",
    header: "Đơn giá",
    cell: ({ row }) => formatCurrency(Number(row.original.unitCost)),
  },
  {
    id: "supplierName",
    accessorFn: (row) => row.supplier?.name ?? "-",
    header: "Nhà cung cấp",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/materials/${row.original.id}/edit?tab=edit`}>
          <Button variant="outline" size="sm">
            Sửa
          </Button>
        </Link>
      </div>
    ),
  },
];
