"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsDropdown } from "./notifications-dropdown";
import { ProjectSelector } from "./project-selector";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut, Upload } from "lucide-react";
import { useSidebar } from "./sidebar-provider";
import { useOffline } from "@/components/offline-provider";

function SyncIndicator() {
  const { pendingCount } = useOffline();
  if (pendingCount === 0) return null;
  return (
    <button className="relative p-2 hover:bg-muted rounded-full" title="Đang chờ đồng bộ">
      <Upload className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
        {pendingCount}
      </span>
    </button>
  );
}

interface HeaderProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

export function Header({ userName, userEmail, userRole }: HeaderProps) {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <button
        onClick={toggle}
        className="rounded-md p-1 hover:bg-accent md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <ProjectSelector />
      <div className="flex-1" />
      <NotificationsDropdown />
      <SyncIndicator />
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
              <p className="text-xs text-muted-foreground">{userRole === "ADMIN" ? "Quản trị viên" : "Người dùng"}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
