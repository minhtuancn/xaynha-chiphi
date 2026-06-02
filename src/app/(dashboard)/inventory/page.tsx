import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryForm } from "@/components/forms/inventory-form";
import {
  getInventoryTransactions,
  getInventoryByMaterial,
  createTransaction,
} from "@/actions/inventory";
import { formatUnit, formatNumber } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const INVENTORY_TYPE_LABELS: Record<string, string> = {
  IN: "Nhập kho",
  OUT: "Xuất kho",
  ADJUSTMENT: "Điều chỉnh",
};

const INVENTORY_TYPE_VARIANTS: Record<string, "default" | "destructive" | "secondary"> = {
  IN: "default",
  OUT: "destructive",
  ADJUSTMENT: "secondary",
};

export default async function InventoryPage() {
  const [transactions, materials] = await Promise.all([
    getInventoryTransactions(),
    getInventoryByMaterial(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý kho</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {materials.map((mat) => {
          const current = mat.currentStock.toNumber();
          const min = mat.minStock.toNumber();
          const isLow = current < min;
          return (
            <Card
              key={mat.id}
              className={cn(
                isLow && "border-red-300 bg-red-50 dark:bg-red-950/20"
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {mat.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatUnit(current, mat.unit)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tối thiểu: {formatUnit(min, mat.unit)}
                  {isLow && (
                    <span className="text-red-600 font-semibold ml-2">
                      ⚠ Thấp
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thêm giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryForm
            materials={materials.map((m) => ({
              id: m.id,
              name: m.name,
              unit: m.unit,
            }))}
            onSubmit={createTransaction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Vật liệu</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Loại</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Số lượng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Mã tham chiếu</th>
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
                        <Badge variant={INVENTORY_TYPE_VARIANTS[tx.type]}>
                          {INVENTORY_TYPE_LABELS[tx.type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatNumber(tx.quantity.toNumber(), 2)}{" "}
                        <span className="text-muted-foreground">
                          {tx.material.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tx.reference || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {tx.notes || "-"}
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
