"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const SETTING_ALLOWLIST = new Set([
  "siteName",
  "companyName",
  "companyAddress",
  "companyPhone",
  "currency",
  "projectLat",
  "projectLon",
  "weatherApiKey",
  "defaultTheme",
]);

export async function updateSetting(key: string, value: string) {
  await requirePermission("settings", "edit");

  if (!SETTING_ALLOWLIST.has(key)) {
    throw new Error("Khóa cài đặt không hợp lệ");
  }

  if (value.length > 500) throw new Error("Giá trị cài đặt quá dài");

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

const userCreateSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  name: z.string().min(1, "Tên không được để trống").max(100),
  role: z.enum(["ADMIN", "USER"]),
  permissions: z.record(z.string(), z.boolean()).optional(),
});

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "USER";
  permissions?: Permissions;
}) {
  await requireAdmin();

  const validated = userCreateSchema.parse(data);

  const passwordHash = await bcrypt.hash(validated.password, 10);

  const user = await prisma.user.create({
    data: {
      email: validated.email,
      passwordHash,
      name: validated.name,
      role: validated.role,
      permissions: validated.permissions ? JSON.stringify(validated.permissions) : "{}",
      isActive: true,
    },
  });

  revalidatePath("/settings/users");
  return safeUser(user);
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; role?: "ADMIN" | "USER" }
) {
  await requireAdmin();

  const validated = userUpdateSchema.parse(data);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.email !== undefined && { email: validated.email }),
      ...(validated.role !== undefined && { role: validated.role }),
    },
  });

  revalidatePath("/settings/users");
  return safeUser(user);
}

/** Strip sensitive fields (passwordHash) before returning a User to the client. */
function safeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
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
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isActive: true, role: true },
  });

  if (!user) throw new Error("User not found");

  if (admin.id === id) {
    throw new Error("Không thể vô hiệu hóa tài khoản của chính bạn");
  }

  if (user.isActive && user.role === "ADMIN") {
    const activeAdminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true, deletedAt: null },
    });
    if (activeAdminCount <= 1) {
      throw new Error("Không thể vô hiệu hóa admin cuối cùng");
    }
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/settings/users");
}
