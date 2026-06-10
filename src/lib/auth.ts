import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import {
  hasPermission,
  parsePermissions,
  type ModuleName,
  type ModulePermission,
} from "@/lib/utils";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.deletedAt || !user.isActive) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function requirePermission(module: ModuleName, action: ModulePermission) {
  const user = await requireUser();
  const permissions = parsePermissions(user.permissions);

  if (!hasPermission(permissions, user.role, module, action)) {
    throw new Error("Forbidden");
  }

  return user;
}
