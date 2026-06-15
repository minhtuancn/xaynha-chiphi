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

export async function requirePermission(_module: string, _action: string) {
  return await requireAdmin();
}