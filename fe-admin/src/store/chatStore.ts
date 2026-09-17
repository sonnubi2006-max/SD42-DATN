import { create } from "zustand";
import type { ConversationResponse, MessageResponse } from "@/api/chatApi";

export type ConversationBucket =
  | "assigned-open"
  | "assigned-closed"
  | "pending"
  | "all-closed";

interface ChatState {
  conversationsByBucket: Record<ConversationBucket, ConversationResponse[]>;
  messagesByConversation: Record<number, MessageResponse[]>;
  setConversations: (
    bucket: ConversationBucket,
    conversations: ConversationResponse[],
  ) => void;
  upsertConversation: (
    bucket: ConversationBucket,
    conversation: ConversationResponse,
  ) => void;
  removeConversation: (
    bucket: ConversationBucket,
    conversationId: number,
  ) => void;
  setMessages: (conversationId: number, messages: MessageResponse[]) => void;
  addMessage: (message: MessageResponse) => void;
  updateMessage: (
    conversationId: number,
    messageId: number,
    changes: Partial<MessageResponse>,
  ) => void;
  clear: () => void;
}

const emptyConversations = (): Record<
  ConversationBucket,
  ConversationResponse[]
> => ({
  "assigned-open": [],
  "assigned-closed": [],
  pending: [],
  "all-closed": [],
});

const sortMessages = (messages: MessageResponse[]) =>
  [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );

const useChatStore = create<ChatState>((set) => ({
  conversationsByBucket: emptyConversations(),
  messagesByConversation: {},

  setConversations: (bucket, conversations) =>
    set((state) => ({
      conversationsByBucket: {
        ...state.conversationsByBucket,
        [bucket]: conversations,
      },
    })),

  upsertConversation: (bucket, conversation) =>
    set((state) => {
      const current = state.conversationsByBucket[bucket];
      const exists = current.some(
        (item) => item.conversationId === conversation.conversationId,
      );
      return {
        conversationsByBucket: {
          ...state.conversationsByBucket,
          [bucket]: exists
            ? current.map((item) =>
                item.conversationId === conversation.conversationId
                  ? conversation
                  : item,
              )
            : [conversation, ...current],
        },
      };
    }),

  removeConversation: (bucket, conversationId) =>
    set((state) => ({
      conversationsByBucket: {
        ...state.conversationsByBucket,
        [bucket]: state.conversationsByBucket[bucket].filter(
          (item) => item.conversationId !== conversationId,
        ),
      },
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

  clear: () =>
    set({
      conversationsByBucket: emptyConversations(),
      messagesByConversation: {},
    }),
}));

export default useChatStore;
