import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  UserCheck,
  CheckCircle,
  Inbox,
  Loader2,
  Image as ImageIcon,
  ShoppingBag,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  useAssignedConversations,
  usePendingConversations,
  useAssignStaff,
  useMessages,
  useSendMessage,
  useCloseConversation,
  useAllConversations,
  CHAT_KEYS,
} from "@/hooks/useChat";
import { useMe } from "@/hooks/useAuth";
import { useOrderList } from "@/hooks/useOrder";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/api/orderApi";
import { resolveImageUrl } from "@/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "@/utils/socketService";
import type {
  ChatOrderSummaryResponse,
  ConversationResponse,
  MessageResponse,
} from "@/api/chatApi";
import useChatStore from "@/store/chatStore";
import { Link } from "react-router-dom";

const getBubbleStyle = (mine: boolean, isFirst: boolean, isLast: boolean) => {
  if (mine) {
    if (isFirst && isLast) return { borderRadius: "18px 18px 4px 18px" };
    if (isFirst) return { borderRadius: "18px 18px 4px 18px" };
    if (isLast) return { borderRadius: "18px 4px 18px 18px" };
    return { borderRadius: "18px 4px 4px 18px" };
  } else {
    if (isFirst && isLast) return { borderRadius: "18px 18px 18px 4px" };
    if (isFirst) return { borderRadius: "18px 18px 18px 4px" };
    if (isLast) return { borderRadius: "4px 18px 18px 18px" };
    return { borderRadius: "4px 18px 18px 4px" };
  }
};

interface OrderItemDto {
  productName: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderDto {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  status?: string;
  createdAt?: string;
  customerName?: string;
  totalItems?: number;
  items?: OrderItemDto[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseLegacyOrderContent = (
  messageContent?: string,
): Partial<OrderDto> | null => {
  if (!messageContent) return null;

  try {
    const parsed: unknown = JSON.parse(messageContent);
    if (!isRecord(parsed)) return null;

    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(isRecord).map((item) => ({
        productName:
          typeof item.productName === "string"
            ? item.productName
            : "Sản phẩm",
        color: typeof item.color === "string" ? item.color : "—",
        size: typeof item.size === "string" ? item.size : "—",
        quantity: typeof item.quantity === "number" ? item.quantity : 0,
        price: typeof item.price === "number" ? item.price : 0,
      }))
      : undefined;

    return {
      orderId: typeof parsed.orderId === "number" ? parsed.orderId : undefined,
      orderCode:
        typeof parsed.orderCode === "string" ? parsed.orderCode : undefined,
      totalAmount:
        typeof parsed.finalAmount === "number"
          ? parsed.finalAmount
          : typeof parsed.totalAmount === "number"
            ? parsed.totalAmount
            : undefined,
      status:
        typeof parsed.orderStatus === "string"
          ? parsed.orderStatus
          : typeof parsed.status === "string"
            ? parsed.status
            : undefined,
      createdAt:
        typeof parsed.orderDate === "string"
          ? parsed.orderDate
          : typeof parsed.createdAt === "string"
            ? parsed.createdAt
            : undefined,
      customerName:
        typeof parsed.customerName === "string"
          ? parsed.customerName
          : undefined,
      items,
    };
  } catch {
    return null;
  }
};

const toOrderDto = (
  summary: ChatOrderSummaryResponse,
  legacy: Partial<OrderDto> | null,
): OrderDto => ({
  orderId: summary.orderId,
  orderCode: summary.orderCode,
  totalAmount: summary.finalAmount ?? summary.totalAmount,
  status: summary.orderStatus,
  createdAt: summary.orderDate,
  customerName: summary.customerName ?? legacy?.customerName,
  totalItems: summary.totalItems,
  items: legacy?.items,
});

const parseOrderMessage = (message: MessageResponse): OrderDto | null => {
  if (message.messageType !== "ORDER") return null;

  const legacy = parseLegacyOrderContent(message.messageContent);
  if (message.orderSummary) {
    return toOrderDto(message.orderSummary, legacy);
  }

  if (!legacy?.orderCode) return null;
  return {
    orderId: legacy.orderId ?? message.orderId ?? 0,
    orderCode: legacy.orderCode,
    totalAmount: legacy.totalAmount ?? 0,
    status: legacy.status,
    createdAt: legacy.createdAt,
    customerName: legacy.customerName,
    items: legacy.items,
    totalItems: legacy.items?.reduce((total, item) => total + item.quantity, 0),
  };
};

const getOrderStatusLabel = (status?: string) => {
  if (!status) return "Chưa xác định";
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
};

export default function ChatPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useMe();
  const [activeTab, setActiveTab] = useState<"assigned" | "pending" | "closed">(
    "assigned",
  );
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [conversationToClose, setConversationToClose] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const socket = socketService.connect();

    socket.on("new_conversation", (newConv) => {
      console.log("Realtime: New conversation request received:", newConv);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.pending });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
      queryClient.invalidateQueries({ queryKey: ["chat", "all"] });
    });

    return () => {
      socketService.disconnect();
    };
  }, [queryClient]);

  useEffect(() => {
    if (!activeConvId) return;

    socketService.joinConversation(activeConvId);

    const socket = socketService.getSocket();
    if (socket) {
      socket.on("new_message", (message: MessageResponse) => {
        console.log("Realtime: New message received:", message);
        useChatStore.getState().addMessage(message);
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeConvId),
        });
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
        queryClient.invalidateQueries({ queryKey: ["chat", "all"] });
      });

      socket.on("messages_read", (data) => {
        console.log("Realtime: Messages read:", data);
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeConvId),
        });
      });

      socket.on("message_deleted", (data) => {
        console.log("Realtime: Message deleted:", data);
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeConvId),
        });
      });

      socket.on("staff_reassigned", (data) => {
        console.log("Realtime: Staff reassigned:", data);
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
        queryClient.invalidateQueries({ queryKey: ["chat", "all"] });
      });

      socket.on("conversation_closed", (conversation: ConversationResponse) => {
        const chatStore = useChatStore.getState();
        chatStore.removeConversation(
          "assigned-open",
          conversation.conversationId,
        );
        chatStore.removeConversation("pending", conversation.conversationId);
        chatStore.upsertConversation("assigned-closed", conversation);
        chatStore.upsertConversation("all-closed", conversation);
        setConversationToClose(null);
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.assigned() });
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.pending });
        queryClient.invalidateQueries({ queryKey: ["chat", "all"] });
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(conversation.conversationId),
        });
      });
    }

    return () => {
      socketService.leaveConversation(activeConvId);
      if (socket) {
        socket.off("new_message");
        socket.off("messages_read");
        socket.off("message_deleted");
        socket.off("staff_reassigned");
        socket.off("conversation_closed");
      }
    };
  }, [activeConvId, queryClient]);

  const isAdmin = currentUser?.role === "ADMIN";
  const { data: assignedPage, isLoading: loadingAssigned } =
    useAssignedConversations("OPEN");
  const { data: pendingPage, isLoading: loadingPending } =
    usePendingConversations();

  const { data: allClosedPage, isLoading: loadingAllClosed } =
    useAllConversations("CLOSED");
  const { data: assignedClosedPage, isLoading: loadingAssignedClosed } =
    useAssignedConversations("CLOSED");

  const closedPage = isAdmin ? allClosedPage : assignedClosedPage;
  const loadingClosed = isAdmin ? loadingAllClosed : loadingAssignedClosed;

  const assignedConvs = assignedPage?.content ?? [];
  const pendingConvs = pendingPage?.content ?? [];
  const closedConvs = closedPage?.content ?? [];

  const { data: messagePage } = useMessages(activeConvId ?? undefined);
  const { mutate: sendMessage, isPending: sending } = useSendMessage(
    activeConvId ?? 0,
  );
  const { mutate: assignStaff, isPending: assigning } = useAssignStaff();
  const { mutate: closeConv, isPending: closing } = useCloseConversation();

  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderKeyword, setOrderKeyword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCustomerId = [
    ...assignedConvs,
    ...pendingConvs,
    ...closedConvs,
  ].find(
    (conversation) => conversation.conversationId === activeConvId,
  )?.userId;

  const { data: orderPage, isLoading: loadingOrders } = useOrderList({
    keyword: orderKeyword || undefined,
    customerId: activeCustomerId,
    page: 0,
    size: 5,
  });
  const orders = orderPage?.content.filter((o) => o.status !== "DRAFT") ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagePage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId) return;
    if (!inputText.trim() && !selectedFile) return;

    sendMessage(
      {
        content: inputText.trim(),
        file: selectedFile || undefined,
      },
      {
        onSuccess: () => {
          setInputText("");
          handleRemoveFile();
        },
      },
    );
  };

  const handleSendOrder = (order: OrderDto) => {
    if (!activeConvId) return;

    sendMessage(
      {
        content: `Thông tin đơn hàng #${order.orderCode}`,
        messageType: "ORDER",
        orderId: order.orderId,
      },
      {
        onSuccess: () => {
          setShowOrderModal(false);
          setOrderKeyword("");
        },
      },
    );
  };

  const handleClaimChat = (convId: number) => {
    assignStaff(convId, {
      onSuccess: () => {
        setActiveTab("assigned");
        setActiveConvId(convId);
      },
    });
  };

  const handleCloseChat = () => {
    if (!conversationToClose) return;
    closeConv(conversationToClose, {
      onSuccess: () => {
        setConversationToClose(null);
        setActiveTab("closed");
      },
    });
  };

  const currentConversation =
    assignedConvs.find((c) => c.conversationId === activeConvId) ||
    pendingConvs.find((c) => c.conversationId === activeConvId) ||
    closedConvs.find((c) => c.conversationId === activeConvId);

  const orderedMessages = messagePage?.content ?? [];

  return (
    <div className="space-y-6 py-6">
      <AlertDialog
        open={conversationToClose !== null}
        onOpenChange={(open) => {
          if (!open && !closing) setConversationToClose(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kết thúc cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kết thúc cuộc trò chuyện này? Khách hàng và
              nhân viên sẽ không thể gửi thêm tin nhắn sau khi cuộc trò chuyện
              được đóng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closing}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseChat}
              disabled={closing}
              variant="destructive"
            >
              {closing ? "Đang kết thúc..." : "Xác nhận kết thúc"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="text-blue-600" /> Hộp thư hỗ trợ khách hàng
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tư vấn, giải đáp thắc mắc trực tuyến của khách hàng tại cửa hàng.
        </p>
      </div>

      <Card className="border-gray-200 overflow-hidden shadow-sm">
        <CardContent className="p-0 h-[calc(100vh-220px)] min-h-[500px] flex">
          { }
          <div className="w-80 md:w-96 border-r border-gray-200 flex flex-col h-full bg-gray-50/20">
            { }
            <div className="flex border-b border-gray-200 p-2 gap-1 bg-white">
              <button
                onClick={() => {
                  setActiveTab("assigned");
                  setActiveConvId(null);
                }}
                className={cn(
                  "flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1",
                  activeTab === "assigned"
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                <UserCheck size={12} /> Đang tư vấn ({assignedConvs.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("pending");
                  setActiveConvId(null);
                }}
                className={cn(
                  "flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1",
                  activeTab === "pending"
                    ? "bg-amber-50 text-amber-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                <Inbox size={12} /> Đang chờ ({pendingConvs.length})
              </button>
              <button
                onClick={() => {
                  setActiveTab("closed");
                  setActiveConvId(null);
                }}
                className={cn(
                  "flex-1 py-2 text-[10px] sm:text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1",
                  activeTab === "closed"
                    ? "bg-gray-100 text-gray-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                <CheckCircle size={12} /> Đã đóng ({closedConvs.length})
              </button>
            </div>

            { }
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {activeTab === "assigned" ? (
                loadingAssigned ? (
                  <div className="flex items-center justify-center p-8 text-xs text-gray-400 gap-1.5">
                    <Loader2 className="animate-spin" size={14} /> Đang tải...
                  </div>
                ) : assignedConvs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Chưa nhận cuộc trò chuyện nào.
                  </div>
                ) : (
                  assignedConvs.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setActiveConvId(conv.conversationId)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-gray-50 transition flex gap-3 relative",
                        activeConvId === conv.conversationId &&
                        "bg-blue-50/40 hover:bg-blue-50/40",
                      )}
                    >
                      <Avatar className="h-9 w-9 border border-gray-150 shrink-0">
                        <AvatarImage src={resolveImageUrl(conv.userAvatar)} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                          {conv.userName?.charAt(0) || "K"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {conv.userName || "Khách vãng lai"}
                          </p>
                          <span className="text-[10px] text-gray-400 ">
                            {conv.lastMessageAt
                              ? new Date(conv.lastMessageAt).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                              : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">
                          {conv.lastMessage || "Chưa có tin nhắn"}
                        </p>
                      </div>
                      {conv.unreadCountStaff ? (
                        <span className="absolute right-4 bottom-4 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      ) : null}
                    </button>
                  ))
                )
              ) : activeTab === "pending" ? (
                loadingPending ? (
                  <div className="flex items-center justify-center p-8 text-xs text-gray-400 gap-1.5">
                    <Loader2 className="animate-spin" size={14} /> Đang tải...
                  </div>
                ) : pendingConvs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">
                    Không có cuộc trò chuyện nào đang chờ.
                  </div>
                ) : (
                  pendingConvs.map((conv) => (
                    <button
                      key={conv.conversationId}
                      onClick={() => setActiveConvId(conv.conversationId)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-gray-50 transition flex gap-3 relative",
                        activeConvId === conv.conversationId &&
                        "bg-amber-50/40 hover:bg-amber-50/40",
                      )}
                    >
                      <Avatar className="h-9 w-9 border border-gray-150 shrink-0">
                        <AvatarImage src={resolveImageUrl(conv.userAvatar)} />
                        <AvatarFallback className="bg-amber-100 text-amber-600 font-bold">
                          {conv.userName?.charAt(0) || "K"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-1">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {conv.userName || "Khách vãng lai"}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-amber-50 text-amber-700 border-amber-200"
                          >
                            Chờ nhận
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">
                          {conv.lastMessage || "Xin chào, tôi cần hỗ trợ..."}
                        </p>
                      </div>
                    </button>
                  ))
                )
              ) : loadingClosed ? (
                <div className="flex items-center justify-center p-8 text-xs text-gray-400 gap-1.5">
                  <Loader2 className="animate-spin" size={14} /> Đang tải...
                </div>
              ) : closedConvs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Chưa có cuộc trò chuyện nào đã đóng.
                </div>
              ) : (
                closedConvs.map((conv) => (
                  <button
                    key={conv.conversationId}
                    onClick={() => setActiveConvId(conv.conversationId)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-gray-50 transition flex gap-3 relative",
                      activeConvId === conv.conversationId &&
                      "bg-gray-100 hover:bg-gray-100",
                    )}
                  >
                    <Avatar className="h-9 w-9 border border-gray-150 shrink-0">
                      <AvatarImage src={resolveImageUrl(conv.userAvatar)} />
                      <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">
                        {conv.userName?.charAt(0) || "K"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex justify-between items-start gap-1">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {conv.userName || "Khách vãng lai"}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-gray-100 text-gray-600 border-gray-200"
                        >
                          Đã đóng
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {conv.lastMessage || "Hội thoại đã kết thúc"}
                      </p>
                      <p className="text-[9px] text-blue-600 font-medium bg-blue-50/50 inline-block px-1.5 py-0.5 rounded">
                        Tư vấn bởi:{" "}
                        <span className="font-semibold">
                          {conv.staffName || "Hệ thống"}
                        </span>
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          { }
          <div className="flex-1 flex flex-col h-full bg-white">
            {!activeConvId || !currentConversation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <MessageSquare className="h-12 w-12 text-gray-300" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Chưa chọn hội thoại
                </h3>
                <p className="text-xs text-gray-400 max-w-sm">
                  Chọn một cuộc trò chuyện từ danh sách bên trái để xem nội dung
                  nhắn tin và hỗ trợ khách hàng.
                </p>
              </div>
            ) : (
              <>
                { }
                <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <Link to={`/customers/${currentConversation.userId}/edit`}>
                      <Avatar className="h-10 w-10 border border-gray-150">
                        <AvatarImage
                          src={resolveImageUrl(currentConversation.userAvatar)}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">
                          {currentConversation.userName?.charAt(0) || "K"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 flex-wrap">
                        {currentConversation.userName || "Khách vãng lai"}
                        {currentConversation.userPhone && (
                          <span className="text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {currentConversation.userPhone}
                          </span>
                        )}
                        {currentConversation.userEmail && (
                          <span className="text-[10px] font-normal text-gray-400 hidden sm:inline">
                            ({currentConversation.userEmail})
                          </span>
                        )}
                      </h3>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
                        Hội thoại #{currentConversation.conversationId}
                      </p>
                    </div>
                  </div>

                  { }
                  <div>
                    {currentConversation.status === "CLOSED" ? (
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 border px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-gray-400" /> Đã
                        đóng
                      </span>
                    ) : activeTab === "pending" ? (
                      <Button
                        onClick={() =>
                          handleClaimChat(currentConversation.conversationId)
                        }
                        disabled={assigning}
                        className="bg-amber-600 hover:bg-amber-700 text-xs font-semibold h-8 gap-1.5"
                      >
                        <UserCheck size={14} /> Nhận hỗ trợ khách
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          setConversationToClose(
                            currentConversation.conversationId,
                          )
                        }
                        disabled={closing}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold h-8 gap-1.5"
                      >
                        <CheckCircle size={14} /> Kết thúc cuộc chat
                      </Button>
                    )}
                  </div>
                </div>

                { }
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 flex flex-col">
                  <div className="flex-1" />
                  {orderedMessages.map((msg, index) => {
                    const mine =
                      msg.senderType !== "CUSTOMER" &&
                      msg.senderId === currentUser?.userId;

                    const nextMsg = orderedMessages[index + 1];
                    const prevMsg = orderedMessages[index - 1];
                    const isLastInGroup =
                      !nextMsg ||
                      nextMsg.senderId !== msg.senderId ||
                      nextMsg.senderType !== msg.senderType;
                    const isFirstInGroup =
                      !prevMsg ||
                      prevMsg.senderId !== msg.senderId ||
                      prevMsg.senderType !== msg.senderType;

                    return (
                      <div
                        key={msg.messageId}
                        className={cn(
                          "flex gap-3 text-xs",
                          mine ? "justify-end" : "justify-start",
                          isFirstInGroup ? "mt-4" : "mt-0.5",
                        )}
                      >
                        {!mine &&
                          (isLastInGroup ? (
                            <Avatar className="h-7 w-7 border border-gray-150 shrink-0 self-end">
                              <AvatarImage
                                src={resolveImageUrl(msg.senderAvatar)}
                              />
                              <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-[10px]">
                                {msg.senderName?.charAt(0) || "K"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-7 h-7 shrink-0" />
                          ))}
                        <div
                          className={cn(
                            "flex flex-col max-w-[70%]",
                            mine ? "items-end" : "items-start",
                          )}
                        >
                          { }
                          {isFirstInGroup && !mine && (
                            <span className="text-[10px] text-gray-500 mb-0.5 font-medium ml-1">
                              {msg.senderName} (
                              {msg.senderType === "CUSTOMER"
                                ? "Khách hàng"
                                : "Nhân viên"}
                              )
                            </span>
                          )}
                          { }
                          {isFirstInGroup && mine && (
                            <span className="text-[10px] text-blue-600 mb-0.5 font-medium mr-1">
                              Bạn ({currentUser?.fullName})
                            </span>
                          )}

                          <div
                            className={cn(
                              "leading-relaxed shadow-sm text-xs transition-all",
                              msg.messageType === "ORDER"
                                ? "p-0 bg-transparent shadow-none"
                                : "px-4 py-2",
                              mine
                                ? msg.messageType === "ORDER"
                                  ? ""
                                  : "bg-blue-600 text-white"
                                : msg.messageType === "ORDER"
                                  ? ""
                                  : "bg-gray-100 text-gray-800 border border-gray-200",
                            )}
                            style={
                              msg.messageType === "ORDER"
                                ? undefined
                                : getBubbleStyle(
                                  mine,
                                  isFirstInGroup,
                                  isLastInGroup,
                                )
                            }
                          >
                            {msg.messageType === "IMAGE" ? (
                              <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white max-w-xs">
                                <img
                                  src={resolveImageUrl(msg.imageUrl)}
                                  alt="Hình ảnh tin nhắn"
                                  className="max-h-60 object-contain hover:opacity-95 transition cursor-pointer"
                                  onClick={() =>
                                    window.open(
                                      resolveImageUrl(msg.imageUrl),
                                      "_blank",
                                    )
                                  }
                                />
                              </div>
                            ) : msg.messageType === "ORDER" ? (
                              (() => {
                                const order = parseOrderMessage(msg);
                                if (!order) {
                                  return (
                                    <p className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                                      Không thể tải thông tin đơn hàng
                                    </p>
                                  );
                                }

                                return (
                                  <div className="border border-blue-200 rounded-xl bg-white text-gray-800 p-4 shadow-sm w-72 sm:w-80">
                                    <div className="flex items-center justify-between border-b pb-2 mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <ShoppingBag
                                          size={14}
                                          className="text-blue-600"
                                        />
                                        <span className="font-bold text-xs text-blue-700">
                                          Đơn hàng: {order.orderCode}
                                        </span>
                                      </div>
                                      <a
                                        href={`/orders/${order.orderId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                                      >
                                        Chi tiết <ExternalLink size={10} />
                                      </a>
                                    </div>
                                    <div className="space-y-1 text-[11px] text-gray-600">
                                      <div>
                                        Trạng thái:{" "}
                                        <span className="font-semibold text-gray-800 font-sans">
                                          {getOrderStatusLabel(order.status)}
                                        </span>
                                      </div>
                                      <div>
                                        Tổng tiền:{" "}
                                        <span className="font-semibold text-blue-600 ">
                                          {order.totalAmount?.toLocaleString(
                                            "vi-VN",
                                          )}
                                          đ
                                        </span>
                                      </div>
                                      <div>
                                        Ngày đặt:{" "}
                                        <span>
                                          {order.createdAt
                                            ? new Date(
                                              order.createdAt,
                                            ).toLocaleDateString("vi-VN")
                                            : ""}
                                        </span>
                                      </div>
                                    </div>
                                    {(order.items?.length ?? 0) > 0 ? (
                                      <div className="mt-2 border-t pt-2 space-y-1.5">
                                        {order.items
                                          ?.slice(0, 2)
                                          .map(
                                            (item: OrderItemDto, i: number) => (
                                              <div
                                                key={i}
                                                className="flex justify-between items-center text-[10px] text-gray-500"
                                              >
                                                <span className="truncate max-w-[180px]">
                                                  {item.productName} (
                                                  {item.color}/{item.size})
                                                </span>
                                                <span>x{item.quantity}</span>
                                              </div>
                                            ),
                                          )}
                                        {(order.items?.length ?? 0) > 2 && (
                                          <div className="text-[9px] text-gray-400 italic">
                                            Và {(order.items?.length ?? 0) - 2}{" "}
                                            sản phẩm khác...
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="mt-2 border-t pt-2 text-[10px] text-gray-500">
                                        {order.totalItems ?? 0} sản phẩm trong
                                        đơn
                                      </div>
                                    )}
                                  </div>
                                );
                              })()
                            ) : (
                              <p className="whitespace-pre-wrap">
                                {msg.messageContent}
                              </p>
                            )}
                          </div>
                          {isLastInGroup && (
                            <span
                              className={cn(
                                "block text-[9px] text-gray-400 font-sans mt-1 px-1",
                              )}
                            >
                              {new Date(msg.sentAt).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                { }
                {currentConversation.status === "CLOSED" ? (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-xs text-gray-500 font-medium">
                    Cuộc trò chuyện này đã được kết thúc bởi nhân viên:{" "}
                    <span className="text-blue-600 font-bold">
                      {currentConversation.staffName || "Hệ thống"}
                    </span>
                    . Không thể gửi thêm tin nhắn.
                  </div>
                ) : activeTab === "assigned" ? (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    { }
                    {previewUrl && (
                      <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-200 max-w-xs relative group">
                        <img
                          src={previewUrl}
                          alt="Ảnh xem trước"
                          className="h-16 w-16 object-cover rounded-md border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-gray-700 truncate">
                            {selectedFile?.name}
                          </p>
                          <p className="text-[9px] text-gray-400">
                            {selectedFile
                              ? (selectedFile.size / 1024).toFixed(1)
                              : 0}{" "}
                            KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}

                    <form
                      onSubmit={handleSend}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => fileInputRef.current?.click()}
                        className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
                        title="Gửi hình ảnh"
                      >
                        <ImageIcon size={18} />
                      </button>

                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => setShowOrderModal(true)}
                        className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
                        title="Gửi thông tin đơn hàng"
                      >
                        <ShoppingBag size={18} />
                      </button>

                      <Input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Nhập tin nhắn tư vấn gửi khách hàng..."
                        disabled={sending}
                        className="h-10 text-xs rounded-full bg-gray-50 border-gray-200 flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={
                          sending || (!inputText.trim() && !selectedFile)
                        }
                        className="rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      { }
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-blue-600" /> Chọn đơn
                hàng gửi khách
              </h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setOrderKeyword("");
                }}
                className="p-1 hover:bg-gray-250 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 border-b bg-white">
              <Input
                value={orderKeyword}
                onChange={(e) => setOrderKeyword(e.target.value)}
                placeholder="Tìm đơn hàng theo mã đơn hàng, số điện thoại..."
                className="text-xs h-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50/50 min-h-[250px]">
              {loadingOrders ? (
                <div className="flex items-center justify-center p-8 text-xs text-gray-450 gap-1.5">
                  <Loader2 className="animate-spin" size={14} /> Đang tải đơn
                  hàng...
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center p-8 text-xs text-gray-400">
                  Không tìm thấy đơn hàng phù hợp.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-xs transition flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-800">
                          {order.orderCode}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 font-medium text-gray-650">
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        Khách hàng:{" "}
                        <span className="font-medium text-gray-700">
                          {order.customerName || "Khách lẻ"}
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Ngày đặt:{" "}
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="font-bold text-xs text-blue-650 ">
                        {order.totalAmount.toLocaleString("vi-VN")}đ
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSendOrder(order)}
                        className="h-7 text-[10px] px-2.5 bg-blue-600 hover:bg-blue-700 font-semibold"
                      >
                        Chọn & Gửi
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
