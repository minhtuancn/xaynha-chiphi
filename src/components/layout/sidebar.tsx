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
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Stages", href: "/stages", icon: ListChecks },
  { label: "Daily Logs", href: "/daily-logs", icon: BookOpen },
  { label: "Materials", href: "/materials", icon: BrickWall },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { label: "Suppliers", href: "/suppliers", icon: Users },
  { label: "Workers", href: "/workers", icon: UserCheck },
  { label: "Attendance", href: "/attendance", icon: FileText },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Accounts", href: "/accounts", icon: Wallet },
  { label: "Debts", href: "/debts", icon: CreditCard },
  { label: "Photos", href: "/photos", icon: Camera },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🏠</span>
          <span>Xây Nhà</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
