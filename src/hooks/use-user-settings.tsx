"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { UserSettingData } from "@/actions/user-settings";

const DEFAULT_SETTINGS: UserSettingData = {
  language: "vi",
  theme: "light",
  dateFormat: "dd/MM/yyyy",
  timezone: "Asia/Ho_Chi_Minh",
  currency: "VND",
  currencyDec: 0,
  selectedProjectId: null,
};

type FormatCurrencyFn = (amount: number | string) => string;
type FormatDateFn = (date: Date | string | null) => string;
type FormatNumberFn = (num: number | string, decimals?: number) => string;

interface UserSettingsContextValue {
  settings: UserSettingData;
  formatCurrency: FormatCurrencyFn;
  formatDate: FormatDateFn;
  formatNumber: FormatNumberFn;
  updateSettings: (data: UserSettingData) => Promise<void>;
  selectedProjectId: string | null;
  setSelectedProject: (projectId: string | null) => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextValue | null>(null);

function buildFormatCurrency(settings: UserSettingData): FormatCurrencyFn {
  return (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0 ₫";
    const locale = settings.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: settings.currency,
      minimumFractionDigits: settings.currencyDec,
      maximumFractionDigits: settings.currencyDec,
    }).format(num);
  };
}

function buildFormatDate(settings: UserSettingData): FormatDateFn {
  return (date: Date | string | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "-";
    const locale = settings.language === "en" ? "en-US" : "vi-VN";
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };
}

function buildFormatNumber(settings: UserSettingData): FormatNumberFn {
  return (num: number | string, decimals = 2) => {
    const value = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(value)) return "0";
    const locale = settings.language === "en" ? "en-US" : "vi-VN";
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };
}

export function UserSettingsProvider({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: UserSettingData | null;
}) {
  const [settings, setSettings] = useState<UserSettingData>(initialSettings ?? DEFAULT_SETTINGS);

  const updateSettings = useCallback(async (data: UserSettingData) => {
    const { upsertUserSetting } = await import("@/actions/user-settings");
    await upsertUserSetting(data);
    setSettings(data);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (data.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(data.theme);
    }
  }, []);

  const setSelectedProject = useCallback(async (projectId: string | null) => {
    const { setSelectedProject: setSP } = await import("@/actions/user-settings");
    await setSP(projectId);
    setSettings(prev => ({ ...prev, selectedProjectId: projectId }));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (settings.theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings.theme]);

  const value: UserSettingsContextValue = {
    settings,
    formatCurrency: buildFormatCurrency(settings),
    formatDate: buildFormatDate(settings),
    formatNumber: buildFormatNumber(settings),
    updateSettings,
    selectedProjectId: settings.selectedProjectId ?? null,
    setSelectedProject,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings(): UserSettingsContextValue {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error("useUserSettings must be used within UserSettingsProvider");
  return ctx;
}
