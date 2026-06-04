"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, PO_STATUS_LABELS } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";

type PurchaseOrderItem = {
  id: string;
  material: { id: string; name: string; unit: string };
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PurchaseOrderRow = {
  id: string;
  orderDate: Date;
  deliveryDate: Date | null;
  status: string;
  totalAmount: number;
  notes: string | null;
  supplier: { id: string; name: string };
  project: { id: string; name: string };
  items: PurchaseOrderItem[];
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  RECEIVED: "default",
  CANCELLED: "destructive",
};

export const columns: ColumnDef<PurchaseOrderRow>[] = [
  {
    accessorKey: "orderDate",
    header: "Ngày đặt",
    cell: ({ row }) => formatDate(row.original.orderDate),
  },
  {
    id: "supplierName",
    accessorFn: (row) => row.supplier.name,
    header: "Nhà cung cấp",
    cell: ({ row }) => (
      <Link
        href={`/purchase-orders/${row.original.id}?tab=view`}
        className="font-medium hover:underline"
      >
        {row.original.supplier.name}
      </Link>
    ),
  },
  {
    id: "projectName",
    accessorFn: (row) => row.project.name,
    header: "Dự án",
  },
  {
    accessorKey: "totalAmount",
    header: "Tổng tiền",
    cell: ({ row }) => formatCurrency(row.original.totalAmount),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status] || "secondary"}>
        {PO_STATUS_LABELS[row.original.status] || row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/purchase-orders/${row.original.id}?tab=view`}>
        <Button variant="outline" size="sm">
          Chi tiết
        </Button>
      </Link>
    ),
  },
];