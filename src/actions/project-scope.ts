"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function getProjectScope(): Promise<string | null> {
  const user = await requireUser();

  const setting = await prisma.userSetting.findUnique({
    where: { userId: user.id },
    select: { selectedProjectId: true },
  });

  return setting?.selectedProjectId ?? null;
}
