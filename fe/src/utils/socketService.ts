import { io, Socket } from "socket.io-client";
import { cookieUtil } from "@/utils/cookie";

let socket: Socket | null = null;

const getSocketUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.hostname}:9092`;
  } catch {
    return "http://localhost:9092";
  }
};

export const socketService = {
  connect(): Socket {
    const token = cookieUtil.getAccessToken();
    const url = getSocketUrl();

    if (socket) {
      if (socket.connected) return socket;
      if (socket.io?.opts) {
        socket.io.opts.query = { token: token || "" };
      }
      socket.connect();
      return socket;
    }

    socket = io(url, {
      query: { token: token || "" },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      autoConnect: false,
    });

    socket.connect();

    socket.on("connect", () => {
      console.log("Socket connected to:", url);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return socket;
  },

  disconnect(): void {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket(): Socket | null {
    return socket;
  },

  joinConversation(conversationId: number): void {
    if (socket) {
      socket.emit("join_conversation", conversationId);
      console.log(`Socket emitted join_conversation for room: conversation-${conversationId}`);
    }
  },

  leaveConversation(conversationId: number): void {
    if (socket) {
      socket.emit("leave_conversation", conversationId);
      console.log(`Socket emitted leave_conversation for room: conversation-${conversationId}`);
    }
  },
};
