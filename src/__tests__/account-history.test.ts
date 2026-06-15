import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getAccountDetail } from "@/actions/financial";

const mockedPrisma = vi.mocked(prisma);

describe("account history detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads the latest 50 transactions with user metadata", async () => {
    mockedPrisma.account.findUnique.mockResolvedValue({
      id: "account-1",
      name: "Quỹ chính",
      type: "CASH",
      balance: "1000000",
      transactions: [],
    } as never);

    await getAccountDetail("account-1");

    expect(mockedPrisma.account.findUnique).toHaveBeenCalledWith({
      where: { id: "account-1" },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 20,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
  });
});
