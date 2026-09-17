import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import chatApi, {
  type ConversationStatus,
  type MessageResponse,
  type MessageType,
} from "@/api/chatApi";
import useChatStore, { type ConversationBucket } from "@/store/chatStore";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const isApiError = (error: unknown): error is ApiError =>
  typeof error === "object" && error !== null && "response" in error;

export const CHAT_KEYS = {
  assigned: (status?: ConversationStatus) =>
    ["chat", "assigned", status] as const,
  pending: ["chat", "pending"] as const,
  messages: (conversationId: number) =>
    ["chat", "messages", conversationId] as const,
};

const assignedBucket = (status?: ConversationStatus): ConversationBucket =>
  status === "CLOSED" ? "assigned-closed" : "assigned-open";

const EMPTY_MESSAGES: MessageResponse[] = [];

export function useAssignedConversations(status?: ConversationStatus) {
  const bucket = assignedBucket(status);
  const conversations = useChatStore((s) => s.conversationsByBucket[bucket]);
  const setConversations = useChatStore((s) => s.setConversations);
  const query = useQuery({
    queryKey: CHAT_KEYS.assigned(status),
    queryFn: () => chatApi.getAssignedConversations(status),
  });

  useEffect(() => {
    if (query.data) setConversations(bucket, query.data.content);
  }, [bucket, query.data, setConversations]);

  return {
    ...query,
    data: query.data ? { ...query.data, content: conversations } : query.data,
  };
}

export function usePendingConversations() {
  const conversations = useChatStore((s) => s.conversationsByBucket.pending);
  const setConversations = useChatStore((s) => s.setConversations);
  const query = useQuery({
    queryKey: CHAT_KEYS.pending,
    queryFn: chatApi.getPendingConversations,
  });

  useEffect(() => {
    if (query.data) setConversations("pending", query.data.content);
  }, [query.data, setConversations]);

  return {
    ...query,
    data: query.data ? { ...query.data, content: conversations } : query.data,
  };
}

export function useAssignStaff() {
  const queryClient = useQueryClient();
  const removeConversation = useChatStore((s) => s.removeConversation);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  return useMutation({
    mutationFn: (conversationId: number) => chatApi.assignStaff(conversationId),
    onSuccess: (conversation) => {
      removeConversation("pending", conversation.conversationId);
      upsertConversation("assigned-open", conversation);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.pending });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
      toast.success("Đã nhận cuộc trò chuyện");
    },
    onError: (error: unknown) => {
      toast.error(
        (isApiError(error) && error.response?.data?.message) ||
          "Nhận cuộc trò chuyện thất bại",
      );
    },
  });
}

export function useMessages(conversationId?: number) {
  const messages = useChatStore(
    (s) => s.messagesByConversation[conversationId ?? 0] ?? EMPTY_MESSAGES,
  );
  const setMessages = useChatStore((s) => s.setMessages);
  const query = useQuery({
    queryKey: CHAT_KEYS.messages(conversationId ?? 0),
    queryFn: () => chatApi.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (conversationId && query.data) {
      setMessages(conversationId, query.data.content);
    }
  }, [conversationId, query.data, setMessages]);

  return {
    ...query,
    data: query.data ? { ...query.data, content: messages } : query.data,
  };
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const addMessage = useChatStore((s) => s.addMessage);
  return useMutation({
    mutationFn: ({
      content,
      file,
      messageType,
      orderId,
    }: {
      content: string;
      file?: File;
      messageType?: MessageType;
      orderId?: number;
    }) => chatApi.sendMessage(conversationId, content, file, messageType, orderId),
    onSuccess: (message) => {
      addMessage(message);
      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.messages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
    },
    onError: () => {
      toast.error("Gửi tin nhắn thất bại");
    },
  });
}

export function useCloseConversation() {
  const queryClient = useQueryClient();
  const removeConversation = useChatStore((s) => s.removeConversation);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  return useMutation({
    mutationFn: (conversationId: number) => chatApi.close(conversationId),
    onSuccess: (conversation) => {
      removeConversation("assigned-open", conversation.conversationId);
      removeConversation("pending", conversation.conversationId);
      upsertConversation("assigned-closed", conversation);
      upsertConversation("all-closed", conversation);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
      queryClient.invalidateQueries({ queryKey: ["chat", "all"] });
      toast.success("Đã kết thúc cuộc hội thoại");
    },
    onError: () => {
      toast.error("Kết thúc cuộc hội thoại thất bại");
    },
  });
}

export function useAllConversations(status?: ConversationStatus) {
  const bucket: ConversationBucket = "all-closed";
  const conversations = useChatStore((s) => s.conversationsByBucket[bucket]);
  const setConversations = useChatStore((s) => s.setConversations);
  const query = useQuery({
    queryKey: ["chat", "all", status],
    queryFn: () => chatApi.getAllConversations(status),
  });

  useEffect(() => {
    if (query.data) setConversations(bucket, query.data.content);
  }, [bucket, query.data, setConversations]);

  return {
    ...query,
    data: query.data ? { ...query.data, content: conversations } : query.data,
  };
}
