"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { InventoryForm } from "@/components/forms/inventory-form";
import { InventoryUsageForm } from "@/components/inventory-usage-form";
import { InventoryReturnForm } from "@/components/inventory-return-form";
import { columns, type MaterialStockRow } from "./columns";
import { formatNumber, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { MaterialWithRelations, TransactionRow, PurchaseOrderForReturn } from "./inventory-types";

const STOCK_FILTERS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Sắp hết", value: "LOW" },
  { label: "Hết hàng", value: "OUT" },
];

const INVENTORY_TYPE_LABELS: Record<string, string> = {
  IN: "Nhập kho",
  OUT: "Xuất khác",
  USAGE: "Sử dụng",
  RETURN: "Trả hàng",
  ADJUSTMENT: "Điều chỉnh",
};

const INVENTORY_TYPE_VARIANTS: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  IN: "default",
  OUT: "destructive",
  USAGE: "secondary",
  RETURN: "outline",
  ADJUSTMENT: "secondary",
};

interface InventoryClientProps {
  materials: MaterialWithRelations[];
  transactions: TransactionRow[];
  projects: { id: string; name: string }[];
  receivedPOs: PurchaseOrderForReturn[];
}

export function InventoryClient({
  materials,
  transactions,
  projects,
  receivedPOs,
}: InventoryClientProps) {
  const [stockFilter, setStockFilter] = useState("ALL");
  const router = useRouter();
  const { toast } = useToast();

  const stockData: MaterialStockRow[] = materials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    currentStock: Number(m.currentStock),
    minStock: Number(m.minStock),
  }));

  const filteredStock = stockData.filter((row) => {
    if (stockFilter === "LOW") return row.currentStock > 0 && row.currentStock < row.minStock;
    if (stockFilter === "OUT") return row.currentStock <= 0;
    return true;
  });

  const simpleMaterials = materials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Quản lý kho</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Danh sách vật tư tồn kho</CardTitle>
          <div className="flex gap-2">
            {STOCK_FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={stockFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStockFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredStock}
            searchColumn="name"
            searchPlaceholder="Tìm kiếm vật liệu..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thêm giao dịch mới</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="in">
            <TabsList className="mb-4">
              <TabsTrigger value="in">Nhập / Điều chỉnh</TabsTrigger>
              <TabsTrigger value="usage">Xuất kho sử dụng</TabsTrigger>
              <TabsTrigger value="return">Xuất trả NCC</TabsTrigger>
            </TabsList>
            <TabsContent value="in">
              <InventoryForm
                materials={simpleMaterials}
                onSubmit={async (data) => {
                  const { createTransaction } = await import("@/actions/inventory");
                  await createTransaction(data);
                  toast({ title: "Đã lưu giao dịch kho", description: "Tồn kho đã được cập nhật." });
                  router.refresh();
                }}
              />
            </TabsContent>
            <TabsContent value="usage">
              <InventoryUsageForm
                projects={projects}
                materials={simpleMaterials}
                onSubmit={async (data) => {
                  const { createTransaction } = await import("@/actions/inventory");
                  await createTransaction(data);
                  toast({ title: "Đã lưu giao dịch kho", description: "Tồn kho đã được cập nhật." });
                  router.refresh();
                }}
              />
            </TabsContent>
            <TabsContent value="return">
              <InventoryReturnForm
                purchaseOrders={receivedPOs}
                materials={simpleMaterials}
                onSubmit={async (data) => {
                  const { createTransaction } = await import("@/actions/inventory");
                  await createTransaction(data);
                  toast({ title: "Đã lưu giao dịch kho", description: "Tồn kho đã được cập nhật." });
                  router.refresh();
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Vật liệu</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tham chiếu</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Số lượng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {tx.material.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          tx.type === "IN" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                          tx.type === "OUT" ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" :
                          tx.type === "USAGE" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300" :
                          tx.type === "RETURN" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {INVENTORY_TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tx.reference ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatNumber(tx.quantity, 2)}{" "}
                        <span className="text-muted-foreground">
                          {tx.material.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tx.notes ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}