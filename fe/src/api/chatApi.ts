
import axiosInstance, { type PageResponse } from "./axiosInstance";
import { type OrderSummaryResponse } from "./orderApi";

export type ConversationStatus = "OPEN" | "PENDING" | "ASSIGNED" | "CLOSED";
export type MessageType = "TEXT" | "IMAGE" | "ORDER";

export interface ConversationResponse {
  conversationId: number;
  title?: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffId?: number;
  staffName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCountUser?: number;
  unreadCountStaff?: number;
  status: ConversationStatus;
  assignedAt?: string;
  closedAt?: string;
  closedById?: number;
  closedByType?: string;
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
  orderSummary?: OrderSummaryResponse;
}

export interface ConversationAssignmentResponse {
  assignmentId: number;
  conversationId: number;
  staffId?: number;
  staffName?: string;
  staffEmail?: string;
  action: string;
  performedById?: number;
  performedByName?: string;
  createdAt: string;
  notes?: string;
}

const emptyFile = () =>
  new File([new Blob([])], "empty", { type: "application/octet-stream" });

const chatApi = {
  getMyConversations: async (): Promise<PageResponse<ConversationResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<ConversationResponse>
    >("/chat/conversations/me", { params: { page: 0, size: 20 } });
    return data;
  },

  getById: async (conversationId: number): Promise<ConversationResponse> => {
    const { data } = await axiosInstance.get<ConversationResponse>(
      `/chat/conversations/${conversationId}`,
    );
    return data;
  },

  createConversation: async (
    title: string,
    firstMessage: string,
    file?: File,
  ): Promise<ConversationResponse> => {
    const fd = new FormData();
    fd.append("title", title);
    fd.append("firstMessage", firstMessage);
    if (file) fd.append("file", file);
    const { data } = await axiosInstance.post<ConversationResponse>(
      "/chat/conversations",
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  getMessages: async (
    conversationId: number,
    page = 0,
    size = 30,
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
    messageType: MessageType = "TEXT",
    orderId?: number,
    file?: File,
  ): Promise<MessageResponse> => {
    const fd = new FormData();
    fd.append("messageContent", messageContent);
    fd.append("messageType", messageType);
    if (orderId) {
      fd.append("orderId", orderId.toString());
    }
    if (file) {
      fd.append("file", file);
    } else {
      fd.append("file", emptyFile());
    }
    const { data } = await axiosInstance.post<MessageResponse>(
      `/chat/messages/${conversationId}`,
      fd,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  getSelectableOrders: async (
    page = 0,
    size = 10,
  ): Promise<PageResponse<OrderSummaryResponse>> => {
    const { data } = await axiosInstance.get<
      PageResponse<OrderSummaryResponse>
    >("/chat/orders/selectable", { params: { page, size } });
    return data;
  },

  getAssignments: async (
    conversationId: number,
  ): Promise<ConversationAssignmentResponse[]> => {
    const { data } = await axiosInstance.get<ConversationAssignmentResponse[]>(
      `/chat/conversations/${conversationId}/assignments`,
    );
    return data;
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    await axiosInstance.patch(`/chat/conversations/${conversationId}/read`);
  },

  close: async (conversationId: number): Promise<ConversationResponse> => {
    const { data } = await axiosInstance.patch<ConversationResponse>(
      `/chat/conversations/${conversationId}/close`,
    );
    return data;
  },
};

export default chatApi;
