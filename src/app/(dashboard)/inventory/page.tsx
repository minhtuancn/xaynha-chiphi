import {
  getInventoryTransactions,
  getInventoryByMaterial,
} from "@/actions/inventory";
import { getProjects } from "@/actions/projects";
import { getPurchaseOrders } from "@/actions/purchase-orders";
import { serialize } from "@/lib/serialize";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const [transactions, materials, projects, purchaseOrders] = await Promise.all([
    getInventoryTransactions(),
    getInventoryByMaterial(),
    getProjects(),
    getPurchaseOrders(),
  ]);

  const receivedPOs = purchaseOrders.filter((po) => po.status === "RECEIVED");

  return (
    <InventoryClient
      materials={serialize(materials)}
      transactions={serialize(transactions)}
      projects={serialize(projects)}
      receivedPOs={serialize(receivedPOs)}
    />
  );
}