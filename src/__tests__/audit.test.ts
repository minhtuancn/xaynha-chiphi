import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const mockedPrisma = vi.mocked(prisma);

describe("logAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("writes an audit log record with serialized changes", async () => {
    mockedPrisma.auditLog.create.mockResolvedValue({ id: "audit-1" } as never);

    await logAudit("user-1", "UPDATE", "Expense", "expense-1", {
      oldValues: { status: "PENDING" },
      newValues: { status: "APPROVED" },
    });

    expect(mockedPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        action: "UPDATE",
        entity: "Expense",
        entityId: "expense-1",
        changes: JSON.stringify({
          oldValues: { status: "PENDING" },
          newValues: { status: "APPROVED" },
        }),
      },
    });
  });
});
