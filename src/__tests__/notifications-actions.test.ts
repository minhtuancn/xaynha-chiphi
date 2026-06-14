import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createNotificationForCurrentUser,
  getNotificationDetail,
  markAsUnread,
} from "@/actions/notifications";

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedPrisma = vi.mocked(prisma);

describe("notification actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads a notification detail scoped to the current user", async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: "user-1" } as never);
    mockedPrisma.notification.findFirst.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      type: "INFO",
      message: "Thong bao chi tiet",
      read: false,
      createdAt: new Date("2026-06-10T00:00:00.000Z"),
    } as never);

    const notification = await getNotificationDetail("notif-1");

    expect(notification).toMatchObject({
      id: "notif-1",
      userId: "user-1",
    });
    expect(mockedPrisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
    });
  });

  test("marks a notification as unread for the current user", async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: "user-1" } as never);
    mockedPrisma.notification.updateMany.mockResolvedValue({ count: 1 } as never);

    await markAsUnread("notif-1");

    expect(mockedPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
      data: { read: false },
    });
  });

  test("creates a notification for the current user without extra permission checks", async () => {
    mockedGetCurrentUser.mockResolvedValue({ id: "user-1" } as never);
    mockedPrisma.notification.create.mockResolvedValue({ id: "notif-1" } as never);

    await createNotificationForCurrentUser({
      type: "SUCCESS",
      message: "Da cap nhat ban ghi",
    });

    expect(mockedPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "SUCCESS",
        message: "Da cap nhat ban ghi",
      },
    });
  });
});
