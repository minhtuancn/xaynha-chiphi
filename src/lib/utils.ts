import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number | string,
  options?: { currencyDec?: number }
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: options?.currencyDec ?? 0,
    maximumFractionDigits: options?.currencyDec ?? 0,
  }).format(num);
}

export function formatNumber(num: number | string, decimals = 2): string {
  const value = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(value)) return "0";
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDateInput(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export const UNIT_LABELS: Record<string, string> = {
  m2: "m²",
  m3: "m³",
  kg: "kg",
  tan: "tấn",
  cay: "cây",
  vien: "viên",
  bao: "bao",
  thang: "thùng",
  lit: "lít",
  met: "m",
  bo: "bộ",
  chiec: "chiếc",
  tam: "tấm",
  cuon: "cuộn",
  can: "cân",
};

export function formatUnit(value: number | string, unit: string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const label = UNIT_LABELS[unit] || unit;
  return `${formatNumber(num, 0)} ${label}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export const STAGE_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Chưa bắt đầu",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Hoàn thành",
  ON_HOLD: "Tạm dừng",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ làm",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Lập kế hoạch",
  ACTIVE: "Đang thi công",
  PAUSED: "Tạm dừng",
  COMPLETED: "Hoàn thành",
};

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

export const DEBT_STATUS_LABELS: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PARTIAL: "Đã thanh toán một phần",
  PAID: "Đã thanh toán",
  OVERDUE: "Quá hạn",
};

export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  SENT: "Đã gửi",
  RECEIVED: "Đã nhận",
  CANCELLED: "Đã hủy",
};

export const PO_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  DRAFT: "secondary",
  SENT: "default",
  RECEIVED: "default",
  CANCELLED: "destructive",
};

export const WEATHER_LABELS: Record<string, string> = {
  sunny: "Nắng đẹp",
  cloudy: "Nhiều mây",
  rainy: "Mưa",
  stormy: "Bão",
  windy: "Nhiều gió",
};

export const WORKER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang làm",
  INACTIVE: "Ngưng làm",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: "Có mặt",
  ABSENT: "Vắng mặt",
  LATE: "Đi trễ",
};

export type ModulePermission = "view" | "create" | "edit" | "delete";
export type ModuleName =
  | "dashboard"
  | "projects"
  | "stages"
  | "dailyLogs"
  | "materials"
  | "inventory"
  | "purchaseOrders"
  | "suppliers"
  | "workers"
  | "attendance"
  | "expenses"
  | "accounts"
  | "debts"
  | "photos"
  | "documents"
  | "materialUsage"
  | "checklists"
  | "notifications"
  | "reports"
  | "settings";

export type Permissions = Partial<Record<ModuleName, ModulePermission[]>>;

export function parsePermissions(permissionsJson: string): Permissions {
  try {
    return JSON.parse(permissionsJson);
  } catch {
    return {};
  }
}

export function hasPermission(
  permissions: Permissions,
  role: string,
  module: ModuleName,
  action: ModulePermission
): boolean {
  if (role === "ADMIN") return true;
  return permissions[module]?.includes(action) ?? false;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
