import {
  getInventoryTransactions,
  getInventoryByMaterial,
} from "@/actions/inventory";
import { getProjects } from "@/actions/projects";
import { getPurchaseOrders } from "@/actions/purchase-orders";
import { serialize } from "@/lib/serialize";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const [txResult, materials, projects, poResult] = await Promise.all([
    getInventoryTransactions(),
    getInventoryByMaterial(),
    getProjects(),
    getPurchaseOrders(),
  ]);

  const transactions = (txResult as { data: unknown[] }).data ?? [];
  const purchaseOrders = (poResult as { data: unknown[] }).data ?? [];
  const receivedPOs = (purchaseOrders as { status: string }[]).filter((po) => po.status === "RECEIVED");

  return (
    <InventoryClient
      materials={serialize(materials)}
      transactions={serialize(transactions as never)}
      projects={serialize(projects)}
      receivedPOs={serialize(receivedPOs as never)}
    />
  );
}