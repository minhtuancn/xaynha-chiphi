"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  BookOpen,
  BrickWall,
  Package,
  ShoppingCart,
  Users,
  UserCheck,
  Receipt,
  Wallet,
  CreditCard,
  Camera,
  FileText,
  BarChart3,
  Settings,
  ClipboardList,
  MinusCircle,
  Bell,
  X,
} from "lucide-react";
import { useSidebar } from "./sidebar-provider";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Dự án", href: "/projects", icon: FolderKanban },
  { label: "Giai đoạn", href: "/stages", icon: ListChecks },
  { label: "Checklist", href: "/checklists", icon: ClipboardList },
  { label: "Nhật ký", href: "/daily-logs", icon: BookOpen },
  { label: "Vật liệu", href: "/materials", icon: BrickWall },
  { label: "Tồn kho", href: "/inventory", icon: Package },
  { label: "Vật tư sử dụng", href: "/material-usage", icon: MinusCircle },
  { label: "Đặt hàng", href: "/purchase-orders", icon: ShoppingCart },
  { label: "Nhà cung cấp", href: "/suppliers", icon: Users },
  { label: "Công nhân", href: "/workers", icon: UserCheck },
  { label: "Chấm công", href: "/attendance", icon: FileText },
  { label: "Chi phí", href: "/expenses", icon: Receipt },
  { label: "Tài khoản", href: "/accounts", icon: Wallet },
  { label: "Công nợ", href: "/debts", icon: CreditCard },
  { label: "Thông báo", href: "/notifications", icon: Bell },
  { label: "Hình ảnh", href: "/photos", icon: Camera },
  { label: "Tài liệu", href: "/documents", icon: FileText },
  { label: "Báo cáo", href: "/reports", icon: BarChart3 },
  { label: "Cài đặt", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={close}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform duration-200",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
            onClick={close}
          >
            <span className="text-xl">🏠</span>
            <span>Xây Nhà</span>
          </Link>
          <button
            onClick={close}
            className="rounded-md p-1 hover:bg-accent md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  "hover:translate-x-0.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
