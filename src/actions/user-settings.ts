"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const userSettingSchema = z.object({
  language: z.string().min(1).max(10).default("vi"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  dateFormat: z.string().min(1).max(20).default("dd/mm/yyyy"),
  timezone: z.string().min(1).max(50).default("Asia/Ho_Chi_Minh"),
  currency: z.string().min(1).max(10).default("VND"),
  currencyDec: z.number().int().min(0).max(2).default(0),
  selectedProjectId: z.string().nullable().optional(),
});

export type UserSettingData = {
  language: string;
  theme: string;
  dateFormat: string;
  timezone: string;
  currency: string;
  currencyDec: number;
  selectedProjectId?: string | null;
};

export async function getUserSetting(): Promise<UserSettingData | null> {
  const user = await requireUser();
  const setting = await prisma.userSetting.findUnique({
    where: { userId: user.id },
  });
  if (!setting) return null;
  return {
    language: setting.language,
    theme: setting.theme,
    dateFormat: setting.dateFormat,
    timezone: setting.timezone,
    currency: setting.currency,
    currencyDec: setting.currencyDec,
    selectedProjectId: setting.selectedProjectId,
  };
}

export async function upsertUserSetting(data: UserSettingData) {
  const user = await requireUser();
  const validated = userSettingSchema.parse(data);
  await prisma.userSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...validated },
    update: validated,
  });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function setSelectedProject(projectId: string | null) {
  const user = await requireUser();
  const validated = z.string().nullable().optional().parse(projectId);
  await prisma.userSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, selectedProjectId: validated ?? null },
    update: { selectedProjectId: validated ?? null },
  });
  revalidatePath("/");
}
