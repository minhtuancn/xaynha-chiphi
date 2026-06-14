"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Trash2, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  getNotifications,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
} from "@/actions/notifications";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/hooks/use-toast";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  useEffect(() => {
    const requestedId = searchParams.get("selected");
    if (requestedId && notifications.some((n) => n.id === requestedId)) {
      setSelectedId(requestedId);
      return;
    }

    if (selectedId && notifications.some((n) => n.id === selectedId)) return;

    setSelectedId(filtered[0]?.id ?? null);
  }, [searchParams, notifications, filtered, selectedId]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedNotification = filtered.find((n) => n.id === selectedId)
    ?? notifications.find((n) => n.id === selectedId)
    ?? null;

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast({ title: "Đã đánh dấu đã đọc" });
      await load();
    } catch {
      toast({ title: "Không thể cập nhật thông báo", variant: "destructive" });
    }
  };

  const handleMarkUnread = async (id: string) => {
    try {
      await markAsUnread(id);
      toast({ title: "Đã đánh dấu chưa đọc" });
      await load();
    } catch {
      toast({ title: "Không thể cập nhật thông báo", variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast({ title: "Đã đánh dấu tất cả là đã đọc" });
      await load();
    } catch {
      toast({ title: "Không thể cập nhật thông báo", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast({ title: "Đã xóa thông báo" });
      if (selectedId === id) {
        setSelectedId(null);
        router.replace("/notifications");
      }
      await load();
    } catch {
      toast({ title: "Không thể xóa thông báo", variant: "destructive" });
    }
  };

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    router.replace(`/notifications?selected=${id}`);
    const notification = notifications.find((n) => n.id === id);
    if (notification && !notification.read) {
      await handleMarkRead(id);
    }
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((n) => (
              <Card
                key={n.id}
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer",
                  !n.read && "border-l-4 border-l-primary bg-background shadow-sm",
                  selectedId === n.id && "ring-2 ring-primary/30"
                )}
                onClick={() => handleSelect(n.id)}
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
                    <p className="text-sm text-foreground flex-grow mb-4 line-clamp-3">{n.message}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(n.createdAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        {!n.read ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleMarkRead(n.id);
                            }}
                            title="Đánh dấu đã đọc"
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleMarkUnread(n.id);
                            }}
                            title="Đánh dấu chưa đọc"
                            className="h-8 px-2 text-xs hover:bg-muted"
                          >
                            Chưa đọc
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(n.id);
                          }}
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

          <Card className="shadow-sm xl:sticky xl:top-20 h-fit">
            <CardHeader>
              <CardTitle>Chi tiết thông báo</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedNotification ? (
                <EmptyState
                  icon={<Bell className="h-8 w-8" />}
                  title="Chọn một thông báo"
                  description="Nhấn vào một thông báo ở danh sách để xem chi tiết."
                  className="border-0 shadow-none"
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={TYPE_VARIANTS[selectedNotification.type] || "secondary"}>
                      {TYPE_LABELS[selectedNotification.type] || selectedNotification.type}
                    </Badge>
                    <Badge variant={selectedNotification.read ? "outline" : "default"}>
                      {selectedNotification.read ? "Đã đọc" : "Chưa đọc"}
                    </Badge>
                  </div>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm leading-6 whitespace-pre-wrap">
                      {selectedNotification.message}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(selectedNotification.createdAt)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!selectedNotification.read ? (
                      <Button size="sm" onClick={() => void handleMarkRead(selectedNotification.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Đánh dấu đã đọc
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => void handleMarkUnread(selectedNotification.id)}>
                        Chuyển sang chưa đọc
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete(selectedNotification.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa thông báo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
