"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatUnit } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { MaterialCategory, Supplier } from "@prisma/client";

export type MaterialWithRelations = {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitCost: number;
  category: MaterialCategory;
  supplier: Supplier | null;
};

export const columns: ColumnDef<MaterialWithRelations>[] = [
  {
    id: "stt",
    header: "STT",
    meta: { hideOnMobile: true } as never,
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
        <span className={isLow ? "text-destructive font-semibold" : ""}>
          {formatUnit(current, row.original.unit)}
        </span>
      );
    },
  },
  {
    accessorKey: "minStock",
    header: "Tối thiểu",
    meta: { hideOnMobile: true } as never,
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
    meta: { hideOnMobile: true } as never,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <Link href={`/materials/${row.original.id}/edit?tab=edit`}>
          <Button variant="outline" size="sm">
            Sửa
          </Button>
        </Link>
      </div>
    ),
  },
];
