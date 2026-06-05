"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Supplier } from "@prisma/client";

export type SupplierRow = Supplier & {
  _count: { purchaseOrders: number };
};

export const columns: ColumnDef<SupplierRow>[] = [
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
    cell: ({ row }) => (
      <Link
        href={`/suppliers/${row.original.id}/edit?tab=view`}
        className="font-medium hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "contact",
    header: "Người liên hệ",
    cell: ({ row }) => row.original.contact ?? "-",
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => row.original.phone ?? "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email ?? "-",
  },
  {
    accessorKey: "debtBalance",
    header: "Nợ phải trả",
    cell: ({ row }) => {
      const balance = Number(row.original.debtBalance);
      const isDebt = balance > 0;
      return (
        <span className={isDebt ? "text-red-600 font-semibold" : ""}>
          {formatCurrency(balance)}
        </span>
      );
    },
  },
  {
    id: "orderCount",
    accessorFn: (row) => row._count.purchaseOrders,
    header: "Số đơn hàng",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/suppliers/${row.original.id}/edit?tab=edit`}>
        <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          Sửa
        </Button>
      </Link>
    ),
  },
];
