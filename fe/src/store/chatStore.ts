import { create } from "zustand";
import type { ConversationResponse, MessageResponse } from "@/api/chatApi";

interface ChatState {
  conversations: ConversationResponse[];
  messagesByConversation: Record<number, MessageResponse[]>;
  setConversations: (conversations: ConversationResponse[]) => void;
  upsertConversation: (conversation: ConversationResponse) => void;
  removeConversation: (conversationId: number) => void;
  setMessages: (conversationId: number, messages: MessageResponse[]) => void;
  addMessage: (message: MessageResponse) => void;
  updateMessage: (
    conversationId: number,
    messageId: number,
    changes: Partial<MessageResponse>,
  ) => void;
  clear: () => void;
}

const sortMessages = (messages: MessageResponse[]) =>
  [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );

const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messagesByConversation: {},

  setConversations: (conversations) => set({ conversations }),

  upsertConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some(
        (item) => item.conversationId === conversation.conversationId,
      );
      return {
        conversations: exists
          ? state.conversations.map((item) =>
              item.conversationId === conversation.conversationId
                ? conversation
                : item,
            )
          : [conversation, ...state.conversations],
      };
    }),

  removeConversation: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.filter(
        (item) => item.conversationId !== conversationId,
      ),
    })),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: sortMessages(messages),
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const current =
        state.messagesByConversation[message.conversationId] ?? [];
      const messages = current.some(
        (item) => item.messageId === message.messageId,
      )
        ? current.map((item) =>
            item.messageId === message.messageId ? message : item,
          )
        : [...current, message];

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: sortMessages(messages),
        },
      };
    }),

  updateMessage: (conversationId, messageId, changes) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (
          state.messagesByConversation[conversationId] ?? []
        ).map((message) =>
          message.messageId === messageId
            ? { ...message, ...changes }
            : message,
        ),
      },
    })),

  clear: () => set({ conversations: [], messagesByConversation: {} }),
}));

export default useChatStore;
