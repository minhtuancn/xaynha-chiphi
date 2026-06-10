import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {
      GET: vi.fn(),
      POST: vi.fn(),
    },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config) => config),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/app/api/auth/[...nextauth]/auth";

const mockedPrisma = vi.mocked(prisma);
const mockedBcrypt = vi.mocked(bcrypt);
const credentialsProvider = authConfig.providers[0];
const authorize = credentialsProvider.authorize!;

describe("authConfig authorize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns null for inactive users", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@local.com",
      name: "User",
      role: "USER",
      isActive: false,
      deletedAt: null,
      passwordHash: "hashed",
    } as never);

    const result = await authorize({
      email: "user@local.com",
      password: "user123",
      rememberMe: "false",
    });

    expect(result).toBeNull();
    expect(mockedBcrypt.compare).not.toHaveBeenCalled();
  });

  test("returns null for invalid passwords", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@local.com",
      name: "User",
      role: "USER",
      isActive: true,
      deletedAt: null,
      passwordHash: "hashed",
    } as never);
    mockedBcrypt.compare.mockResolvedValue(false as never);

    const result = await authorize({
      email: "user@local.com",
      password: "wrong",
      rememberMe: "false",
    });

    expect(result).toBeNull();
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  test("returns session payload and updates lastLoginAt for valid credentials", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      email: "admin@local.com",
      name: "Admin",
      role: "ADMIN",
      isActive: true,
      deletedAt: null,
      passwordHash: "hashed",
    } as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);

    const result = await authorize({
      email: "admin@local.com",
      password: "admin123",
      rememberMe: "true",
    });

    expect(result).toMatchObject({
      id: "admin-1",
      email: "admin@local.com",
      name: "Admin",
      role: "ADMIN",
      rememberMe: true,
    });
    expect(mockedPrisma.user.update).toHaveBeenCalledTimes(1);
  });
});
