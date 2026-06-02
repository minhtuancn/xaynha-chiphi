import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "./prisma";
import { type Permissions, parsePermissions, hasPermission, type ModuleName, type ModulePermission } from "./utils";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email, deletedAt: null },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden: Admin required");
  return user;
}

export async function checkPermission(
  module: ModuleName,
  action: ModulePermission
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const permissions = parsePermissions(user.permissions);
  return hasPermission(permissions, user.role, module, action);
}

export async function requirePermission(
  module: ModuleName,
  action: ModulePermission
): Promise<void> {
  const allowed = await checkPermission(module, action);
  if (!allowed) throw new Error(`Forbidden: ${action} on ${module}`);
}
