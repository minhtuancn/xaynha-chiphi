"use client";

import { useState, useEffect } from "react";
import { Check, Trash2, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string | Date;
}

const TYPE_LABELS: Record<string, string> = {
  INFO: "Thông tin",
  WARNING: "Cảnh báo",
  ERROR: "Lỗi",
  SUCCESS: "Thành công",
  SYSTEM: "Hệ thống",
};

const TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  INFO: "default",
  WARNING: "secondary",
  ERROR: "destructive",
  SUCCESS: "outline",
  SYSTEM: "secondary",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data as unknown as NotificationItem[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "READ") return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    await load();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    await load();
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Thông báo</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} chưa đọc</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="UNREAD">Chưa đọc</SelectItem>
              <SelectItem value="READ">Đã đọc</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Đọc tất cả
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <ListSkeleton items={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={notifications.length === 0 ? "Không có thông báo nào" : "Không có thông báo phù hợp"}
          description={notifications.length === 0 ? "Bạn sẽ nhận được thông báo khi có cập nhật." : "Thử thay đổi bộ lọc."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "transition-all hover:shadow-md",
                !n.read && "border-l-4 border-l-primary bg-background shadow-sm"
              )}
            >
              <CardContent className="p-5">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={TYPE_VARIANTS[n.type] || "secondary"} className="text-xs">
                      {TYPE_LABELS[n.type] || n.type}
                    </Badge>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-foreground flex-grow mb-4">{n.message}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {!n.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(n.id)}
                          title="Đánh dấu đã đọc"
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(n.id)}
                        title="Xóa"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
