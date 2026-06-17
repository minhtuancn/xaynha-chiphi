import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "./prisma";

export { auth as getServerSession } from "@/app/api/auth/[...nextauth]/auth";

export { signIn, signOut } from "@/app/api/auth/[...nextauth]/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });
  return user;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden: Admin required");
  return user;
}

type UserPermissions = Record<string, string[]>;

function hasPermission(permissions: UserPermissions, module: string, action: string): boolean {
  const allowed = permissions[module];
  if (!allowed) return false;
  if (allowed.includes("manage")) return true;
  return allowed.includes(action);
}

export async function requirePermission(module: string, action: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;

  let permissions: UserPermissions = {};
  try {
    permissions = JSON.parse(user.permissions || "{}");
  } catch {
    // malformed JSON — deny
  }

  if (!hasPermission(permissions, module, action)) {
    throw new Error(`Forbidden: missing permission ${module}:${action}`);
  }
  return user;
}