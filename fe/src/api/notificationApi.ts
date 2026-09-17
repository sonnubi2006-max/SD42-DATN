
import axiosInstance, { type PageResponse } from "./axiosInstance";

export type NotificationType =
  | "ORDER"
  | "PROMOTION"
  | "SYSTEM"
  | "REVIEW"
  | "CHAT";

export interface NotificationResponse {
  notificationId: number;
  userId: number;
  title: string;
  content: string;
  type: NotificationType;
  referenceId?: number;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationParams {
  page?: number;
  size?: number;
}

const notificationApi = {
  getAll: async (
    params?: NotificationParams,
  ): Promise<PageResponse<NotificationResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<NotificationResponse>
    >("/notifications", {
      params: { page: params?.page ?? 0, size: params?.size ?? 15 },
    });
    return data;
  },

  getUnread: async (
    params?: NotificationParams,
  ): Promise<PageResponse<NotificationResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<NotificationResponse>
    >("/notifications/unread", {
      params: { page: params?.page ?? 0, size: params?.size ?? 15 },
    });
    return data;
  },

  countUnread: async (): Promise<number> => {
    const { data } = await axiosInstance.get<number>(
      "/notifications/count-unread",
    );
    return data ?? 0;
  },

  markRead: async (id: number): Promise<void> => {
    await axiosInstance.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await axiosInstance.patch("/notifications/read-all");
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/notifications/${id}`);
  },

  removeAll: async (): Promise<void> => {
    await axiosInstance.delete("/notifications");
  },
};

export default notificationApi;
