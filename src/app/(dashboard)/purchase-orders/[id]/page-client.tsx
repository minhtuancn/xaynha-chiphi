"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatDate, PO_STATUS_LABELS, PO_STATUS_VARIANTS } from "@/lib/utils";
import { updatePurchaseOrderStatus, deletePurchaseOrder, updatePurchaseOrder } from "@/actions/purchase-orders";
import type { PurchaseOrder } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";

type PurchaseOrderDetail = Omit<PurchaseOrder, "totalAmount"> & {
  totalAmount: number;
  supplier: { id: string; name: string; phone: string | null; email: string | null; address: string | null };
  project: { id: string; name: string };
  items: {
    id: string;
    materialId: string;
    material: { id: string; name: string; unit: string };
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
};

const nextStatuses: Record<string, string[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["RECEIVED", "CANCELLED"],
  RECEIVED: [],
  CANCELLED: [],
};

export default function PurchaseOrderDetailPage({
  order,
  suppliers,
  projects,
  materials,
}: {
  order: PurchaseOrderDetail;
  suppliers: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  materials: { id: string; name: string; unit: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  async function handleUpdateStatus(status: string) {
    await updatePurchaseOrderStatus(order.id, status as "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED");
    router.refresh();
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Xóa đơn hàng này?",
      description: "Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      variant: "destructive",
    });
    if (!ok) return;
    await deletePurchaseOrder(order.id);
    toast({ title: "Đã xóa đơn hàng" });
    router.push("/purchase-orders");
  }

  const detailView = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Chi tiết đơn hàng</h1>
          <Badge variant={PO_STATUS_VARIANTS[order.status] || "secondary"}>
            {PO_STATUS_LABELS[order.status] || order.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {nextStatuses[order.status]?.length > 0 && (
            <Select onValueChange={handleUpdateStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Cập nhật" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses[order.status].map((s) => (
                  <SelectItem key={s} value={s}>
                    {PO_STATUS_LABELS[s] || s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Ngày đặt</span>
              <span className="font-medium">{formatDate(order.orderDate)}</span>
              <span className="text-muted-foreground">Ngày giao</span>
              <span className="font-medium">
                {order.deliveryDate ? formatDate(order.deliveryDate) : "Chưa xác định"}
              </span>
              <span className="text-muted-foreground">Dự án</span>
              <span className="font-medium">{order.project.name}</span>
              <span className="text-muted-foreground">Tổng tiền</span>
              <span className="font-bold">{formatCurrency(order.totalAmount)}</span>
            </div>
            {order.notes && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Ghi chú</p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nhà cung cấp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.supplier.name}</p>
            {order.supplier.phone && (
              <p className="text-sm text-muted-foreground">
                Điện thoại: {order.supplier.phone}
              </p>
            )}
            {order.supplier.email && (
              <p className="text-sm text-muted-foreground">
                Email: {order.supplier.email}
              </p>
            )}
            {order.supplier.address && (
              <p className="text-sm text-muted-foreground">
                Địa chỉ: {order.supplier.address}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vật liệu ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Tên vật liệu</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Số lượng</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Đơn giá</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm font-medium">
                      {item.material.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {item.quantity} {item.material.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-right">
                    Tổng cộng
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-right font-mono">
                    {formatCurrency(order.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const editView = (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin đơn hàng</CardTitle>
      </CardHeader>
      <CardContent>
        <PurchaseOrderForm
          defaultValues={{
            supplierId: order.supplierId,
            projectId: order.projectId,
            orderDate: new Date(order.orderDate),
            deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
            notes: order.notes ?? "",
            items: order.items.map((item) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          }}
          onSubmit={async (data) => {
            await updatePurchaseOrder(order.id, data);
            router.refresh();
          }}
          submitLabel="Cập nhật"
          suppliers={suppliers}
          projects={projects}
          materials={materials}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Đơn hàng</h1>
      </div>
      <DetailViewTabs viewTab={detailView} editTab={editView} />
      {confirmDialog}
    </div>
  );
}
