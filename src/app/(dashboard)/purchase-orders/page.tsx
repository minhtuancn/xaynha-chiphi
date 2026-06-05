import Link from "next/link";
import { Plus } from "lucide-react";
import { getPurchaseOrders } from "@/actions/purchase-orders";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { serialize } from "@/lib/serialize";
import { Card } from "@/components/ui/card";
import { columns } from "./columns";
import type { PurchaseOrderRow } from "./columns";

export default async function PurchaseOrdersPage() {
  const orders = serialize(await getPurchaseOrders()) as unknown as PurchaseOrderRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn đặt hàng</h1>
        <Link href="/purchase-orders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn hàng
          </Button>
        </Link>
      </div>
      <Card className="shadow-sm p-6">
        <DataTable
          columns={columns}
          data={orders}
          searchColumn="supplierName"
          searchPlaceholder="Tìm kiếm đơn hàng..."
        />
      </Card>
    </div>
  );
}
