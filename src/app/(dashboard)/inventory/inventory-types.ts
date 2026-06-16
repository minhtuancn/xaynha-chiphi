export type MaterialWithRelations = {
  id: string;
  name: string;
  unit: string;
  currentStock: number | string;
  minStock: number | string;
  category: { id: string; name: string } | null;
  supplier?: { id: string; name: string } | null;
};

export type TransactionRow = {
  id: string;
  date: Date | string;
  type: string;
  quantity: number | string;
  notes: string | null;
  reference: string | null;
  material: { id: string; name: string; unit: string };
};

export type PurchaseOrderForReturn = {
  id: string;
  orderDate: Date | string;
  supplier: { name: string };
  items: { materialId: string }[];
};