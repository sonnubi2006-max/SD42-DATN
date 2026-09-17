import axiosInstance from "./axiosInstance";
import type { PageResponse } from "./inventoryApi";
import type { OrderStatus } from "./orderApi";

export type ConversationStatus = "OPEN" | "PENDING" | "ASSIGNED" | "CLOSED";
export type MessageType = "TEXT" | "IMAGE" | "ORDER";

export interface ChatOrderSummaryResponse {
  orderId: number;
  orderCode: string;
  customerName?: string;
  receiverName?: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  finalAmount: number;
  totalItems: number;
  orderDate: string;
}

export interface ConversationResponse {
  conversationId: number;
  title?: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  userPhone?: string;
  staffId?: number;
  staffName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCountUser?: number;
  unreadCountStaff?: number;
  status: ConversationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageResponse {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  senderType?: string;
  messageContent?: string;
  imageUrl?: string;
  messageType: MessageType;
  isRead: boolean;
  readAt?: string;
  sentAt: string;
  deleted: boolean;
  orderId?: number;
  orderSummary?: ChatOrderSummaryResponse;
}

const emptyFile = () =>
  new File([new Blob([])], "empty", { type: "application/octet-stream" });

const chatApi = {
  getAssignedConversations: async (
    status?: ConversationStatus,
  ): Promise<PageResponse<ConversationResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<ConversationResponse>
    >("/chat/conversations/assigned", {
      params: { status, page: 0, size: 50 },
    });
    return data;
  },

  getPendingConversations: async (): Promise<
    PageResponse<ConversationResponse>
  > => {
    const { data } = await axiosInstance.get<
      PageResponse<ConversationResponse>
    >("/chat/conversations/pending", { params: { page: 0, size: 50 } });
    return data;
  },

  assignStaff: async (
    conversationId: number,
  ): Promise<ConversationResponse> => {
    const { data } = await axiosInstance.patch<ConversationResponse>(
      `/chat/conversations/${conversationId}/assign`,
    );
    return data;
  },

  getMessages: async (
    conversationId: number,
    page = 0,
    size = 50,
  ): Promise<PageResponse<MessageResponse>> => {
    const { data } = await axiosInstance.get<PageResponse<MessageResponse>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, size } },
    );
    return data;
  },

  sendMessage: async (
    conversationId: number,
    messageContent: string,
    file?: File,
    messageType?: MessageType,
    orderId?: number,
  ): Promise<MessageResponse> => {
    const fd = new FormData();
    fd.append("messageContent", messageContent);
    fd.append("messageType", messageType || (file ? "IMAGE" : "TEXT"));
    if (orderId) fd.append("orderId", orderId.toString());
    fd.append("file", file ?? emptyFile());
    const { data } = await axiosInstance.post<MessageResponse>(
      `/chat/messages/${conversationId}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  close: async (conversationId: number): Promise<ConversationResponse> => {
    const { data } = await axiosInstance.patch<ConversationResponse>(
      `/chat/conversations/${conversationId}/close`,
    );
    return data;
  },

  getAllConversations: async (
    status?: ConversationStatus,
  ): Promise<PageResponse<ConversationResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<ConversationResponse>
    >("/admin/chat/conversations", { params: { status, page: 0, size: 50 } });
    return data;
  },
};

export default chatApi;
