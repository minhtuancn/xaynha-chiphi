"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { toast } from "@/hooks/use-toast";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

function timeAgo(date: string | Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

const TYPE_LABELS: Record<string, string> = {
  INFO: "Thông tin",
  WARNING: "Cảnh báo",
  ERROR: "Lỗi",
  SUCCESS: "Thành công",
  SYSTEM: "Hệ thống",
};

export function NotificationsDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const loadData = async () => {
    const [n, c] = await Promise.all([getNotifications(), getUnreadCount()]);
    setNotifications(n as unknown as NotificationItem[]);
    setUnread(c);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast({ title: "Đã đánh dấu tất cả là đã đọc" });
      await loadData();
    } catch {
      toast({ title: "Không thể cập nhật thông báo", variant: "destructive" });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      await loadData();
    } catch {
      toast({ title: "Không thể cập nhật thông báo", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast({ title: "Đã xóa thông báo" });
      await loadData();
    } catch {
      toast({ title: "Không thể xóa thông báo", variant: "destructive" });
    }
  };

  const handleOpenDetail = async (id: string) => {
    const notification = notifications.find((item) => item.id === id);
    if (notification && !notification.read) {
      await handleMarkRead(id);
    }
    setOpen(false);
    router.push(`/notifications?selected=${id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Thông báo</h3>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
            >
              <Check className="mr-1 h-3 w-3" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Không có thông báo
            </div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50",
                  !n.read && "bg-muted/30"
                )}
              >
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => void handleOpenDetail(n.id)}
                >
                  <p className="text-sm">{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => void handleMarkRead(n.id)}
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => void handleDelete(n.id)}
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2">
            <Link
              href="/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
