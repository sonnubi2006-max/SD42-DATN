import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import notificationApi, {
  type NotificationParams,
} from "@/api/notificationApi";
import useAuthStore from "@/store/authStore";

export const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  list: (params?: NotificationParams) =>
    ["notifications", "list", params] as const,
  unreadCount: ["notifications", "count-unread"] as const,
};

export function useNotifications(params?: NotificationParams) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => notificationApi.getAll(params),
    enabled: isAuthenticated,
  });
}

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: notificationApi.countUnread,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all }),
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.removeAll(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all }),
  });
}
