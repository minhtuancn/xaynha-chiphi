"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { type Permissions, parsePermissions } from "@/lib/utils";
import bcrypt from "bcryptjs";

export async function getSettings() {
  await requirePermission("settings", "view");

  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}

export async function updateSetting(key: string, value: string) {
  await requirePermission("settings", "edit");

  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  revalidatePath("/settings");
}

export async function getUsers() {
  await requireAdmin();

  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      permissions: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "USER";
  permissions?: Permissions;
}) {
  await requireAdmin();

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
      permissions: data.permissions ? JSON.stringify(data.permissions) : "{}",
      isActive: true,
    },
  });

  revalidatePath("/settings/users");
  return user;
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; role?: "ADMIN" | "USER" }
) {
  await requireAdmin();

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.role !== undefined && { role: data.role }),
    },
  });

  revalidatePath("/settings/users");
  return user;
}

export async function updateUserPermissions(
  id: string,
  permissions: Permissions
) {
  await requireAdmin();

  await prisma.user.update({
    where: { id },
    data: {
      permissions: JSON.stringify(permissions),
    },
  });

  revalidatePath("/settings/users");
}

export async function toggleUserActive(id: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { isActive: true },
  });

  if (!user) throw new Error("User not found");

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/settings/users");
}
