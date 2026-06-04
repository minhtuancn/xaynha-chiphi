"use client";

import { UserSettingsProvider } from "@/hooks/use-user-settings";
import type { UserSettingData } from "@/actions/user-settings";
import { ReactNode } from "react";

export function DashboardLayoutClient({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: UserSettingData | null;
}) {
  return (
    <UserSettingsProvider initialSettings={initialSettings}>
      {children}
    </UserSettingsProvider>
  );
}