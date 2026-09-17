import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Package, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Pagination from "@/components/common/Pagination";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotification";
import type { NotificationResponse } from "@/api/notificationApi";
import { formatDateTime } from "@/utils/dateUtils";

function NotificationIcon({ type }: { type: NotificationResponse["type"] }) {
  switch (type) {
    case "ORDER":
      return <Package className="size-5 text-blue-600" />;
    case "PROMOTION":
      return <Tag className="size-5 text-green-600" />;
    default:
      return <Bell className="size-5 text-muted-foreground" />;
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useNotifications({ page, size: 15 });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: remove } = useDeleteNotification();

  const items = data?.content ?? [];

  const handleClick = (n: NotificationResponse) => {
    if (!n.isRead) markRead(n.notificationId);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
            <CheckCheck className="mr-1 size-4" /> Đánh dấu đã đọc
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải…</p>
      ) : !items.length ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
          <Bell className="size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Bạn chưa có thông báo nào.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.notificationId}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/40",
                !n.isRead && "border-primary/40 bg-primary/5",
              )}
              onClick={() => handleClick(n)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <NotificationIcon type={n.type} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium leading-snug">{n.title}</p>
                    {!n.isRead && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(n.notificationId);
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <Pagination
          className="mt-8"
          currentPage={data.number}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
