import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import chatApi, { type MessageResponse, type MessageType } from "@/api/chatApi";
import useAuthStore from "@/store/authStore";
import useChatStore from "@/store/chatStore";

export const CHAT_KEYS = {
  conversations: ["chat", "conversations"] as const,
  messages: (conversationId: number) =>
    ["chat", "messages", conversationId] as const,
};

const EMPTY_MESSAGES: MessageResponse[] = [];

export function useConversations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const clearChat = useChatStore((s) => s.clear);
  const query = useQuery({
    queryKey: CHAT_KEYS.conversations,
    queryFn: chatApi.getMyConversations,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) setConversations(query.data.content);
  }, [query.data, setConversations]);

  useEffect(() => {
    if (!isAuthenticated) clearChat();
  }, [clearChat, isAuthenticated]);

  return {
    ...query,
    data: query.data ? { ...query.data, content: conversations } : query.data,
  };
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

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  return useMutation({
    mutationFn: ({
      title,
      firstMessage,
      file,
    }: {
      title: string;
      firstMessage: string;
      file?: File;
    }) => chatApi.createConversation(title, firstMessage, file),
    onSuccess: (conversation) => {
      upsertConversation(conversation);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
      toast.success("Đã tạo cuộc trò chuyện");
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Không thể tạo cuộc trò chuyện"),
  });
}

export function useSendMessage(conversationId: number) {
  const queryClient = useQueryClient();
  const addMessage = useChatStore((s) => s.addMessage);
  return useMutation({
    mutationFn: ({
      content,
      messageType = "TEXT",
      orderId,
      file,
    }: {
      content: string;
      messageType?: MessageType;
      orderId?: number;
      file?: File;
    }) =>
      chatApi.sendMessage(conversationId, content, messageType, orderId, file),
    onSuccess: (message) => {
      addMessage(message);
      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.messages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Gửi tin nhắn thất bại"),
  });
}

export function useCloseConversation() {
  const queryClient = useQueryClient();
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  return useMutation({
    mutationFn: (conversationId: number) => chatApi.close(conversationId),
    onSuccess: (conversation, conversationId) => {
      upsertConversation(conversation);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
      queryClient.invalidateQueries({
        queryKey: CHAT_KEYS.messages(conversationId),
      });
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Không thể kết thúc cuộc trò chuyện"),
  });
}
