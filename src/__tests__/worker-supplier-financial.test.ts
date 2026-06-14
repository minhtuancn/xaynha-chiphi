import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: "user-1" }),
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    worker: {
      create: vi.fn(),
      update: vi.fn(),
    },
    supplier: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createWorker, updateWorker } from "@/actions/workers";
import { createSupplier, updateSupplier } from "@/actions/suppliers";

const mockedPrisma = vi.mocked(prisma);
const mockedLogAudit = vi.mocked(logAudit);

describe("worker financial fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("persists bank and tax details when creating a worker", async () => {
    mockedPrisma.worker.create.mockResolvedValue({ id: "worker-1" } as never);

    await createWorker({
      name: "Nguyen Van A",
      phone: "0900000000",
      idCard: "012345678901",
      skill: "Thợ hồ",
      taxCode: "0101234567",
      bankName: "Vietcombank",
      bankAccountNumber: "123456789",
      bankAccountHolder: "Nguyen Van A",
      bankBranch: "Chi nhánh 1",
      dailyWage: 350000,
      notes: "Ghi chú",
    });

    expect(mockedPrisma.worker.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        taxCode: "0101234567",
        bankName: "Vietcombank",
        bankAccountNumber: "123456789",
        bankAccountHolder: "Nguyen Van A",
        bankBranch: "Chi nhánh 1",
      }),
    });
    expect(mockedLogAudit).toHaveBeenCalledWith(
      "user-1",
      "CREATE",
      "Worker",
      expect.any(String),
      expect.objectContaining({
        newValues: expect.objectContaining({ name: "Nguyen Van A" }),
      })
    );
  });

  test("persists bank and tax details when updating a worker", async () => {
    mockedPrisma.worker.update.mockResolvedValue({ id: "worker-1" } as never);

    await updateWorker("worker-1", {
      name: "Nguyen Van B",
      phone: "0900000001",
      idCard: "012345678902",
      skill: "Thợ điện",
      taxCode: "0201234567",
      bankName: "BIDV",
      bankAccountNumber: "987654321",
      bankAccountHolder: "Nguyen Van B",
      bankBranch: "Chi nhánh 2",
      dailyWage: 400000,
      notes: "Đã cập nhật",
    });

    expect(mockedPrisma.worker.update).toHaveBeenCalledWith({
      where: { id: "worker-1" },
      data: expect.objectContaining({
        taxCode: "0201234567",
        bankName: "BIDV",
        bankAccountNumber: "987654321",
        bankAccountHolder: "Nguyen Van B",
        bankBranch: "Chi nhánh 2",
      }),
    });
    expect(mockedLogAudit).toHaveBeenCalledWith(
      "user-1",
      "UPDATE",
      "Worker",
      "worker-1",
      expect.any(Object)
    );
  });
});

describe("supplier financial fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("persists bank and tax details when creating a supplier", async () => {
    mockedPrisma.supplier.create.mockResolvedValue({ id: "supplier-1" } as never);

    await createSupplier({
      name: "Cong ty VLXD ABC",
      contact: "Tran Van C",
      phone: "0911111111",
      email: "abc@example.com",
      address: "TP HCM",
      taxCode: "0301234567",
      bankName: "ACB",
      bankAccountNumber: "111222333",
      bankAccountHolder: "Cong ty VLXD ABC",
      bankBranch: "Chi nhanh trung tam",
      notes: "NCC chính",
    });

    expect(mockedPrisma.supplier.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        taxCode: "0301234567",
        bankName: "ACB",
        bankAccountNumber: "111222333",
        bankAccountHolder: "Cong ty VLXD ABC",
        bankBranch: "Chi nhanh trung tam",
      }),
    });
    expect(mockedLogAudit).toHaveBeenCalledWith(
      "user-1",
      "CREATE",
      "Supplier",
      expect.any(String),
      expect.objectContaining({
        newValues: expect.objectContaining({ name: "Cong ty VLXD ABC" }),
      })
    );
  });

  test("persists bank and tax details when updating a supplier", async () => {
    mockedPrisma.supplier.update.mockResolvedValue({ id: "supplier-1" } as never);

    await updateSupplier("supplier-1", {
      name: "Cong ty VLXD XYZ",
      contact: "Tran Van D",
      phone: "0922222222",
      email: "xyz@example.com",
      address: "Ha Noi",
      taxCode: "0401234567",
      bankName: "Techcombank",
      bankAccountNumber: "444555666",
      bankAccountHolder: "Cong ty VLXD XYZ",
      bankBranch: "Chi nhanh bac",
      notes: "NCC phụ",
    });

    expect(mockedPrisma.supplier.update).toHaveBeenCalledWith({
      where: { id: "supplier-1" },
      data: expect.objectContaining({
        taxCode: "0401234567",
        bankName: "Techcombank",
        bankAccountNumber: "444555666",
        bankAccountHolder: "Cong ty VLXD XYZ",
        bankBranch: "Chi nhanh bac",
      }),
    });
    expect(mockedLogAudit).toHaveBeenCalledWith(
      "user-1",
      "UPDATE",
      "Supplier",
      "supplier-1",
      expect.any(Object)
    );
  });
});
