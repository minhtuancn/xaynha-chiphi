"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, getCurrentUser } from "@/lib/auth";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getNotificationDetail(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  return prisma.notification.findFirst({
    where: { id, userId: user.id },
  });
}

export async function getUnreadCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  return prisma.notification.count({
    where: { userId: user.id, read: false },
  });
}

export async function markAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });

  revalidatePath("/notifications");
}

export async function markAsUnread(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: false },
  });

  revalidatePath("/notifications");
}

export async function markAllAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
}

export async function deleteNotification(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.notification.deleteMany({
    where: { id, userId: user.id },
  });

  revalidatePath("/notifications");
}

export async function createNotification(data: {
  userId: string;
  type: string;
  message: string;
}) {
  await requirePermission("notifications", "create");

  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      message: data.message,
    },
  });
}

export async function createNotificationForCurrentUser(data: {
  type: string;
  message: string;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  return prisma.notification.create({
    data: {
      userId: user.id,
      type: data.type,
      message: data.message,
    },
  });
}

export async function notifyAdmins(type: string, message: string) {
  try {
    // Only authenticated callers may broadcast notifications; internal
    // callers (other server actions) already hold a session.
    await requirePermission("notifications", "create");

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", deletedAt: null, isActive: true },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: admins.map((u) => ({
        userId: u.id,
        type,
        message,
      })),
    });
  } catch (err: unknown) {
    console.warn("Failed to notify admins:", err);
  }
}
