"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type UserSettingData = {
  language: string;
  theme: string;
  dateFormat: string;
  timezone: string;
  currency: string;
  currencyDec: number;
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
  };
}

export async function upsertUserSetting(data: UserSettingData) {
  const user = await requireUser();
  await prisma.userSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function applyUserTheme(theme: string) {
  await requireUser();
  // Persisted via upsertUserSetting; theme is also applied client-side
}
