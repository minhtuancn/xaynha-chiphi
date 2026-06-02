import Link from "next/link";
import { Plus } from "lucide-react";
import { getSuppliers } from "@/actions/suppliers";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Supplier } from "@prisma/client";

type SupplierWithCount = Supplier & {
  _count: { purchaseOrders: number };
};

const columns: ColumnDef<SupplierWithCount>[] = [
  {
    accessorKey: "name",
    header: "Tên nhà cung cấp",
    cell: ({ row }) => (
      <Link
        href={`/suppliers/${row.original.id}/edit`}
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
      const balance = row.original.debtBalance.toNumber();
      const isDebt = balance > 0;
      return (
        <span className={isDebt ? "text-red-600 font-semibold" : ""}>
          {formatCurrency(balance)}
        </span>
      );
    },
  },
  {
    accessorKey: "_count.purchaseOrders",
    header: "Số đơn hàng",
    cell: ({ row }) => row.original._count.purchaseOrders,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Link href={`/suppliers/${row.original.id}/edit`}>
        <Button variant="outline" size="sm">
          Sửa
        </Button>
      </Link>
    ),
  },
];

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý nhà cung cấp</h1>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhà cung cấp
          </Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={suppliers}
        searchColumn="name"
        searchPlaceholder="Tìm kiếm nhà cung cấp..."
      />
    </div>
  );
}
