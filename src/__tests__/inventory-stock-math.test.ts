import { describe, expect, test, vi } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: "user-1" }),
}));
vi.mock("@/lib/serialize", () => ({
  serialize: (v: unknown) => JSON.parse(JSON.stringify(v, (_k, val) => (val instanceof Decimal ? Number(val) : val))),
}));

const mockTx = {
  inventoryTransaction: { create: vi.fn() },
  material: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  dailyLog: { findFirst: vi.fn() },
  materialUsage: { create: vi.fn() },
};
const mockTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => {
      mockTransaction(...args);
      if (typeof args[0] === "function") return args[0](mockTx);
      return args[0];
    },
  },
}));

let createTransaction: (data: any) => Promise<any>;
beforeAll(async () => {
  const mod = await import("@/actions/inventory");
  createTransaction = mod.createTransaction;
});

describe("createTransaction stock math (H9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.material.findUnique.mockReset();
    mockTx.material.update.mockReset();
  });

  test("IN increments currentStock and records a transaction", async () => {
    await createTransaction({
      materialId: "mat-1",
      type: "IN",
      quantity: 10,
      date: new Date("2026-06-10"),
      projectId: "proj-1",
    });

    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ materialId: "mat-1", type: "IN" }) })
    );
    expect(mockTx.material.update).toHaveBeenCalledWith({
      where: { id: "mat-1" },
      data: { currentStock: { increment: 10 } },
    });
  });

  test("OUT decrements currentStock", async () => {
    mockTx.material.findUnique.mockResolvedValue({ currentStock: new Decimal(50) });
    await createTransaction({
      materialId: "mat-1",
      type: "OUT",
      quantity: 20,
      date: new Date("2026-06-10"),
    });

    expect(mockTx.material.findUnique).toHaveBeenCalled();
    expect(mockTx.material.update).toHaveBeenCalledWith({
      where: { id: "mat-1" },
      data: { currentStock: { increment: -20 } },
    });
  });

  test("OUT exceeding stock throws inside the transaction", async () => {
    mockTx.material.findUnique.mockResolvedValue({ currentStock: new Decimal(5) });

    await expect(
      createTransaction({
        materialId: "mat-1",
        type: "OUT",
        quantity: 20,
        date: new Date("2026-06-10"),
      })
    ).rejects.toThrow("vượt quá tồn kho");
  });

  test("ADJUSTMENT sets absolute stock value", async () => {
    await createTransaction({
      materialId: "mat-1",
      type: "ADJUSTMENT",
      quantity: 42,
      date: new Date("2026-06-10"),
    });

    expect(mockTx.material.update).toHaveBeenCalledWith({
      where: { id: "mat-1" },
      data: { currentStock: new Decimal(42) },
    });
  });
});
