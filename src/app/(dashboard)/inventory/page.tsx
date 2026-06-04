import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { InventoryForm } from "@/components/forms/inventory-form";
import { InventoryUsageForm } from "@/components/inventory-usage-form";
import { InventoryReturnForm } from "@/components/inventory-return-form";
import { columns, type MaterialStockRow } from "./columns";
import {
  getInventoryTransactions,
  getInventoryByMaterial,
  createTransaction,
} from "@/actions/inventory";
import { getProjects } from "@/actions/projects";
import { getPurchaseOrders } from "@/actions/purchase-orders";
import { formatNumber, formatDate } from "@/lib/utils";
import { serialize } from "@/lib/serialize";

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

export default async function InventoryPage() {
  const [transactions, materials, projects, purchaseOrders] = await Promise.all([
    getInventoryTransactions(),
    getInventoryByMaterial(),
    getProjects(),
    getPurchaseOrders(),
  ]);

  const sMaterials = serialize(materials);
  const sTransactions = serialize(transactions);
  const sProjects = serialize(projects);
  const receivedPOs = serialize(
    purchaseOrders.filter((po) => po.status === "RECEIVED")
  );

  const stockData: MaterialStockRow[] = sMaterials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    currentStock: m.currentStock,
    minStock: m.minStock,
  }));

  const simpleMaterials = sMaterials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý kho</h1>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách vật tư tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={stockData}
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
                onSubmit={createTransaction}
              />
            </TabsContent>
            <TabsContent value="usage">
              <InventoryUsageForm
                projects={sProjects}
                materials={simpleMaterials}
                onSubmit={createTransaction}
              />
            </TabsContent>
            <TabsContent value="return">
              <InventoryReturnForm
                purchaseOrders={receivedPOs}
                materials={simpleMaterials}
                onSubmit={createTransaction}
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
                  <th className="px-4 py-3 text-right text-sm font-medium">Số lượng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Mã tham chiếu / Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {sTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                ) : (
                  sTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {tx.material.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={INVENTORY_TYPE_VARIANTS[tx.type]}>
                          {INVENTORY_TYPE_LABELS[tx.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatNumber(tx.quantity, 2)}{" "}
                        <span className="text-muted-foreground">
                          {tx.material.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex flex-col">
                          {tx.reference && <span>Tham chiếu: {tx.reference}</span>}
                          {tx.notes && <span>{tx.notes}</span>}
                          {!tx.reference && !tx.notes && "-"}
                        </div>
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
