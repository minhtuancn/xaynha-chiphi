"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getProjectScope(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const setting = await prisma.userSetting.findUnique({
    where: { userId: user.id },
    select: { selectedProjectId: true },
  });

  return setting?.selectedProjectId ?? null;
}
