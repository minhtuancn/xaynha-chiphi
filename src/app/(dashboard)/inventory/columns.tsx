"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatUnit } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

export interface MaterialStockRow {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
}

export const columns: ColumnDef<MaterialStockRow>[] = [
  {
    id: "stt",
    header: "STT",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Vật liệu",
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
    accessorKey: "unit",
    header: "Đơn vị",
  },
  {
    accessorKey: "currentStock",
    header: "Tồn kho",
    cell: ({ row }) => formatUnit(row.original.currentStock, row.original.unit),
  },
  {
    accessorKey: "minStock",
    header: "Tối thiểu",
    cell: ({ row }) => formatUnit(row.original.minStock, row.original.unit),
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const current = row.original.currentStock;
      const min = row.original.minStock;

      if (current <= 0) return <Badge variant="destructive">Hết hàng</Badge>;
      if (current < min) return <Badge variant="secondary" className="bg-yellow-500 text-white">Sắp hết</Badge>;
      return <Badge variant="default" className="bg-green-600">Ổn định</Badge>;
    },
  },
];
