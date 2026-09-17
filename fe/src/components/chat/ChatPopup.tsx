import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  User,
  Info,
  Minus,
  Image as ImageIcon,
  ShoppingBag,
  Loader2,
  Star,
  ChevronRight,
  ChevronLeft,
  Flame,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  useConversations,
  useCreateConversation,
  useMessages,
  useSendMessage,
  useCloseConversation,
  CHAT_KEYS,
} from "@/hooks/useChat";
import useAuthStore from "@/store/authStore";
import { resolveImageUrl } from "@/utils/format";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { socketService } from "@/utils/socketService";
import { aiApi } from "@/api/aiApi";
import chatApi, {
  type ConversationResponse,
  type MessageResponse,
} from "@/api/chatApi";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/api/orderApi";
import useChatStore from "@/store/chatStore";

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

import {
  productMinPrice,
  productMaxPrice,
  productOriginalPrice,
  productThumbnail,
  type ProductResponse,
} from "@/api/productApi";
import { formatCurrency } from "@/utils/format";

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  sentAt: string;
  recommendedProducts?: ProductResponse[];
}

const generateMsgId = (prefix: string): string => {
  return `${prefix}-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}`;
};

interface ChatOrderDisplay {
  orderId?: number;
  orderCode: string;
  status?: string;
  amount?: number;
  receiverName?: string;
}

const parseOrderMessage = (
  message: MessageResponse,
): ChatOrderDisplay | null => {
  if (message.messageType !== "ORDER") return null;

  if (message.orderSummary) {
    return {
      orderId: message.orderSummary.orderId,
      orderCode: message.orderSummary.orderCode,
      status: message.orderSummary.orderStatus,
      amount: message.orderSummary.finalAmount,
      receiverName: message.orderSummary.receiverName,
    };
  }

  if (!message.messageContent) return null;

  try {
    const parsed = JSON.parse(message.messageContent) as Record<
      string,
      unknown
    >;
    const orderCode =
      typeof parsed.orderCode === "string" ? parsed.orderCode : undefined;

    if (!orderCode) return null;

    return {
      orderId:
        typeof parsed.orderId === "number" ? parsed.orderId : message.orderId,
      orderCode,
      status:
        typeof parsed.orderStatus === "string"
          ? parsed.orderStatus
          : typeof parsed.status === "string"
            ? parsed.status
            : undefined,
      amount:
        typeof parsed.finalAmount === "number"
          ? parsed.finalAmount
          : typeof parsed.totalAmount === "number"
            ? parsed.totalAmount
            : undefined,
      receiverName:
        typeof parsed.receiverName === "string"
          ? parsed.receiverName
          : undefined,
    };
  } catch {
    return null;
  }
};

const getOrderStatusLabel = (status?: string) => {
  if (!status) return undefined;
  return ORDER_STATUS_LABEL[status as OrderStatus] ?? status;
};

const renderMarkdown = (text: string) => {
  if (!text) return "";
  const paragraphs = text.split("\n");
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return <div key={i} className="h-1.5" />;

    const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed);
    const cleanPara = trimmed.startsWith("- ") || trimmed.startsWith("* ")
      ? trimmed.substring(2)
      : /^\d+\.\s/.test(trimmed)
        ? trimmed.replace(/^\d+\.\s/, "")
        : trimmed;

    const parts = cleanPara.split(/\*\*([^*]+)\*\*/g);
    const content = parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return (
          <strong key={idx} className="font-extrabold text-blue-900 break-words">
            {part}
          </strong>
        );
      }
      return <span key={idx} className="break-words">{part}</span>;
    });

    if (isListItem) {
      return (
        <li
          key={i}
          className="list-disc ml-4 my-1 text-slate-800 leading-relaxed break-words"
          style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {content}
        </li>
      );
    }
    return (
      <p
        key={i}
        className="my-1 leading-relaxed text-slate-800 break-words"
        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
      >
        {content}
      </p>
    );
  });
};

function AiProductCardCarousel({
  products,
  onAskAboutProduct,
}: {
  products: ProductResponse[];
  onAskAboutProduct?: (productName: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(products.length > 1);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

    // Approximate active item index based on scroll position
    const cardStep = 215; // card width (205px) + gap (10px)
    const idx = Math.round(scrollLeft / cardStep);
    setCurrentIndex(Math.min(Math.max(idx, 0), products.length - 1));
  };

  useEffect(() => {
    checkScroll();
  }, [products]);

  const slide = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardStep = 215;
    const offset = direction === "left" ? -cardStep : cardStep;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const scrollToIndex = (index: number) => {
    if (!scrollRef.current) return;
    const cardStep = 215;
    scrollRef.current.scrollTo({ left: index * cardStep, behavior: "smooth" });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full my-2 relative">
      {/* Slider Header */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Sparkles className="size-3.5 text-amber-500" />
          <span>Sản phẩm gợi ý</span>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
            {currentIndex + 1}/{products.length}
          </span>
        </div>
      </div>

      {/* Slider Track with Centered Navigation Buttons on 2 Sides */}
      <div className="relative group/slider">
        {/* Left Side Button (Centered vertically) */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={() => slide("left")}
            disabled={!canScrollLeft}
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2 z-20 size-7 rounded-full bg-white/95 hover:bg-white shadow-md border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs hover:scale-110 active:scale-95",
              canScrollLeft
                ? "text-slate-700 hover:text-blue-600 hover:border-blue-300 opacity-90 group-hover/slider:opacity-100"
                : "opacity-0 pointer-events-none"
            )}
            title="Xem sản phẩm trước"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}

        {/* Right Side Button (Centered vertically) */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={() => slide("right")}
            disabled={!canScrollRight}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 z-20 size-7 rounded-full bg-white/95 hover:bg-white shadow-md border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs hover:scale-110 active:scale-95",
              canScrollRight
                ? "text-slate-700 hover:text-blue-600 hover:border-blue-300 opacity-90 group-hover/slider:opacity-100"
                : "opacity-0 pointer-events-none"
            )}
            title="Xem sản phẩm tiếp theo"
          >
            <ChevronRight className="size-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto pb-2 flex gap-2.5 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => {
            const minPrice = productMinPrice(p);
            const originalPrice = productOriginalPrice(p);
            const img = resolveImageUrl(productThumbnail(p));

            const isDiscounted = originalPrice != null && minPrice != null && originalPrice > minPrice;
            const discountPercent = isDiscounted
              ? Math.round(((originalPrice - minPrice) / originalPrice) * 100)
              : 0;

            const colors = Array.from(
              new Set(
                p.variants
                  ?.filter((v) => v.status === "ACTIVE" && v.color)
                  .map((v) => v.color) ?? [],
              ),
            );

            const sizes = Array.from(
              new Set(
                p.variants
                  ?.filter((v) => v.status === "ACTIVE" && v.size)
                  .map((v) => v.size) ?? [],
              ),
            );

            return (
              <div
                key={p.productId}
                className="flex-shrink-0 w-[205px] bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col snap-start group"
              >
                {/* Product Image Box */}
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={p.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                      Không có ảnh
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between gap-1 pointer-events-none">
                    {discountPercent > 0 ? (
                      <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                        -{discountPercent}%
                      </span>
                    ) : p.brand?.brandName ? (
                      <span className="bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        {p.brand.brandName}
                      </span>
                    ) : <span />}

                    {p.averageRating && p.averageRating > 0 && (
                      <span className="bg-white/90 backdrop-blur-xs text-amber-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs border border-amber-100">
                        <Star className="size-2.5 fill-amber-400 text-amber-500" />
                        {p.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Bottom Overlay Info (Colors & Sizes) */}
                  {(colors.length > 0 || sizes.length > 0) && (
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] text-slate-700 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200/60 font-medium">
                      <span>{colors.length > 0 ? `${colors.length} màu` : "Đủ màu"}</span>
                      <span>•</span>
                      <span className="truncate max-w-[90px]" title={sizes.join(", ")}>
                        {sizes.length > 0 ? `Size: ${sizes.slice(0, 3).join(", ")}${sizes.length > 3 ? "..." : ""}` : "Đủ size"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info Content */}
                <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                  <div>
                    {p.category?.categoryName && (
                      <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600">
                        {p.category.categoryName}
                      </p>
                    )}
                    <h4
                      className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mt-0.5"
                      title={p.productName}
                    >
                      {p.productName}
                    </h4>

                    {/* Price Section */}
                    <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-xs font-extrabold text-blue-600">
                        {minPrice != null ? formatCurrency(minPrice) : "Liên hệ"}
                      </span>
                      {isDiscounted && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                    <a
                      href={`/products/${encodeURIComponent(p.productCode)}/${p.productSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="size-3" />
                    </a>

                    {onAskAboutProduct && (
                      <button
                        type="button"
                        onClick={() => onAskAboutProduct(p.productName)}
                        title="Hỏi AI tư vấn thêm về sản phẩm này"
                        className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-[10px] font-bold transition-colors shrink-0 cursor-pointer"
                      >
                        <Sparkles className="size-3 text-amber-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots Pagination */}
      {products.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-1">
          {products.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => scrollToIndex(dotIdx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200 cursor-pointer",
                dotIdx === currentIndex
                  ? "w-4 bg-blue-600"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400"
              )}
              title={`Xem sản phẩm ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPopup() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "staff">("ai");
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Xin chào anh/chị! 👋 Em là **Trợ lý AI Stylist & Bán hàng** của cửa hàng.\n\nEm có thể tư vấn chọn mẫu, phối đồ thời trang, gợi ý sản phẩm bán chạy, tìm kiếm theo khoảng giá, giải đáp khuyến mãi hoặc tra cứu đơn hàng. Anh/chị cần em hỗ trợ tìm sản phẩm gì hôm nay ạ?",
      sentAt: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);

  const { data: conversations } = useConversations();
  const { mutate: createConversation, isPending: creatingConv } =
    useCreateConversation();

  const convs = conversations?.content ?? [];
  const activeConversation = convs.length > 0 ? convs[0] : null;
  const activeId = activeConversation?.conversationId;

  const { data: messages } = useMessages(activeId);
  const { mutate: sendMessage, isPending: sendingMsg } = useSendMessage(
    activeId ?? 0,
  );
  const { mutate: closeConversation, isPending: closingConversation } =
    useCloseConversation();
  const [staffInput, setStaffInput] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showOrderList, setShowOrderList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: selectableOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["chat", "selectable-orders", activeId],
    queryFn: () => chatApi.getSelectableOrders(0, 10),
    enabled: activeTab === "staff" && isOpen && isAuthenticated && !!activeId,
  });

  const handleCloseConversation = () => {
    if (!activeId) return;
    closeConversation(activeId, {
      onSuccess: () => setShowCloseConfirm(false),
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeId) return;

    socketService.joinConversation(activeId);

    const socketInstance = socketService.getSocket();
    if (socketInstance) {
      socketInstance.on("new_message", (message: MessageResponse) => {
        console.log("Realtime (Customer): New message received:", message);
        useChatStore.getState().addMessage(message);
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeId),
        });
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
      });

      socketInstance.on("staff_joined", (conv) => {
        console.log("Realtime (Customer): Staff joined conversation:", conv);
        queryClient.invalidateQueries({ queryKey: CHAT_KEYS.conversations });
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeId),
        });
      });

      socketInstance.on(
        "conversation_closed",
        (conversation: ConversationResponse) => {
          useChatStore.getState().upsertConversation(conversation);
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.conversations,
          });
          queryClient.invalidateQueries({
            queryKey: CHAT_KEYS.messages(activeId),
          });
          setShowCloseConfirm(false);
        },
      );

      socketInstance.on("messages_read", (data) => {
        console.log("Realtime (Customer): Messages read:", data);
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeId),
        });
      });

      socketInstance.on("message_deleted", (data) => {
        console.log("Realtime (Customer): Message deleted:", data);
        queryClient.invalidateQueries({
          queryKey: CHAT_KEYS.messages(activeId),
        });
      });
    }

    return () => {
      socketService.leaveConversation(activeId);
      if (socketInstance) {
        socketInstance.off("new_message");
        socketInstance.off("staff_joined");
        socketInstance.off("conversation_closed");
        socketInstance.off("messages_read");
        socketInstance.off("message_deleted");
      }
    };
  }, [activeId, isAuthenticated, queryClient]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, messages, isAiTyping, isOpen, activeTab]);

  const sendQueryToAi = async (text: string) => {
    if (!text.trim()) return;

    const userText = text.trim();
    const uniqueUserId = generateMsgId("u");
    const newMsg: ChatMessage = {
      id: uniqueUserId,
      sender: "user",
      text: userText,
      sentAt: new Date().toISOString(),
    };

    let currentMessages: ChatMessage[] = [];
    setAiMessages((prev) => {
      currentMessages = [...prev, newMsg];
      return currentMessages;
    });

    setIsAiTyping(true);

    try {
      const historyPayload = currentMessages
        .filter((m) => m.id !== "welcome")
        .slice(0, -1)
        .map((m) => ({
          role: m.sender === "user" ? ("user" as const) : ("model" as const),
          content: m.text,
        }));

      const response = await aiApi.chat({
        message: userText,
        history: historyPayload,
      });

      const uniqueAiId = generateMsgId("ai");
      setAiMessages((prev) => [
        ...prev,
        {
          id: uniqueAiId,
          sender: "ai",
          text: response.reply,
          sentAt: new Date().toISOString(),
          recommendedProducts: response.recommendedProducts,
        },
      ]);
    } catch (error) {
      console.error("AI chat error:", error);
      const uniqueErrId = generateMsgId("ai-err");
      setAiMessages((prev) => [
        ...prev,
        {
          id: uniqueErrId,
          sender: "ai",
          text: "Dạ hiện tại kết nối mạng hoặc hệ thống tư vấn AI đang bận một chút, anh/chị vui lòng thử lại sau giây lát nhé!",
          sentAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleAiSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const text = aiInput;
    setAiInput("");
    sendQueryToAi(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStaffSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    if (!staffInput.trim() && !selectedFile) return;

    sendMessage(
      {
        content: staffInput.trim() || "Hình ảnh",
        messageType: selectedFile ? "IMAGE" : "TEXT",
        file: selectedFile || undefined,
      },
      {
        onSuccess: () => {
          setStaffInput("");
          removeSelectedFile();
        },
      },
    );
  };

  const handleSendOrder = (orderId: number, orderCode: string) => {
    if (!activeId) return;
    sendMessage(
      {
        content: `Tôi muốn hỏi về đơn hàng #${orderCode}`,
        messageType: "ORDER",
        orderId: orderId,
      },
      {
        onSuccess: () => {
          setShowOrderList(false);
        },
      },
    );
  };

  const handleCreateChatSession = () => {
    createConversation({
      title: "Trò chuyện hỗ trợ khách hàng",
      firstMessage: "Xin chào, tôi cần hỗ trợ trực tiếp từ nhân viên.",
    });
  };

  const handleQuickReply = (text: string) => {
    if (activeTab === "ai") {
      sendQueryToAi(text);
    }
  };

  const orderedStaffMessages = messages?.content ?? [];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kết thúc cuộc trò chuyện?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn kết thúc cuộc trò chuyện với nhân viên hỗ
              trợ? Sau khi kết thúc, bạn sẽ không thể gửi thêm tin nhắn trong
              cuộc trò chuyện này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingConversation}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseConversation}
              disabled={closingConversation}
              variant="destructive"
            >
              {closingConversation ? "Đang kết thúc..." : "Xác nhận kết thúc"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {}
      {isOpen && (
        <div className="mb-4 flex h-[560px] w-[380px] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ease-out animate-in fade-in slide-in-from-bottom-5">
          {}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm shadow-xs border border-white/20">
                  {activeTab === "ai" ? (
                    <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">
                    {activeTab === "ai"
                      ? "Trợ lý AI Stylist"
                      : "Hỗ trợ khách hàng"}
                  </h3>
                  <p className="text-[10px] text-blue-100 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Đang trực tuyến • Sẵn sàng tư vấn
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {activeTab === "staff" &&
                  activeConversation &&
                  activeConversation.status !== "CLOSED" && (
                    <button
                      onClick={() => setShowCloseConfirm(true)}
                      title="Kết thúc cuộc trò chuyện"
                      className="text-[9px] bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-0.5 rounded transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                      Kết thúc
                    </button>
                  )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {}
            <div className="mt-3 flex rounded-lg bg-black/15 p-0.5 border border-white/10">
              <button
                onClick={() => setActiveTab("ai")}
                className={cn(
                  "flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  activeTab === "ai"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-blue-100 hover:text-white",
                )}
              >
                Trò chuyện với AI
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={cn(
                  "flex-1 text-center py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  activeTab === "staff"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-blue-100 hover:text-white",
                )}
              >
                Gặp nhân viên
              </button>
            </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3 bg-slate-50/60 flex flex-col min-w-0">
            <div className="flex-1" />
            {activeTab === "ai" ? (
              <>
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2 text-xs min-w-0 w-full",
                      msg.sender === "user"
                        ? "justify-end animate-in slide-in-from-right-2"
                        : "justify-start animate-in slide-in-from-left-2",
                    )}
                  >
                    {msg.sender === "ai" && (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs mt-0.5">
                        <Sparkles className="size-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "flex flex-col gap-2 min-w-0",
                        msg.sender === "user"
                          ? "max-w-[85%] ml-auto"
                          : "w-full max-w-[calc(100%-36px)]"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-xs text-xs break-words",
                          msg.sender === "user"
                            ? "bg-blue-600 text-white rounded-tr-none ml-auto"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none w-fit max-w-full",
                        )}
                        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                      >
                        {msg.sender === "user"
                          ? msg.text
                          : renderMarkdown(msg.text)}
                      </div>
                      {msg.recommendedProducts &&
                        msg.recommendedProducts.length > 0 && (
                          <div className="w-full min-w-0 overflow-hidden">
                            <AiProductCardCarousel
                              products={msg.recommendedProducts}
                              onAskAboutProduct={(prodName) =>
                                sendQueryToAi(`Tư vấn chi tiết cho tôi về sản phẩm ${prodName} (chất liệu, cách phối đồ, bảng size)`)
                              }
                            />
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex gap-2 text-xs justify-start">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 animate-pulse mt-0.5">
                      <Sparkles className="size-3.5" />
                    </div>
                    <div className="bg-white text-slate-800 border border-slate-200/80 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-1.5 shadow-xs">
                      <span className="text-[11px] text-slate-400 font-medium mr-1">AI đang soạn câu trả lời</span>
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                )}

                {}
                {aiMessages.length === 1 && !isAiTyping && (
                  <div className="pt-2 pl-9 space-y-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="size-3 text-amber-500" />
                      Gợi ý chủ đề hỏi nhanh:
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500">🔥 Thịnh hành & Bán chạy:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Top mẫu bán chạy nhất hiện nay",
                            "Gợi ý sản phẩm hot trend mới về",
                          ].map((reply) => (
                            <button
                              key={reply}
                              onClick={() => handleQuickReply(reply)}
                              className="text-[11px] text-blue-600 bg-blue-50/70 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/70 rounded-full px-2.5 py-1 text-left transition-all cursor-pointer font-medium"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500">💡 Tư vấn phong cách:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Tư vấn giày thể thao phong cách trẻ trung dưới 1 triệu",
                            "Gợi ý set đồ đi chơi năng động",
                          ].map((reply) => (
                            <button
                              key={reply}
                              onClick={() => handleQuickReply(reply)}
                              className="text-[11px] text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-200/70 rounded-full px-2.5 py-1 text-left transition-all cursor-pointer font-medium"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500">🎁 Ưu đãi & Chính sách:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Khuyến mãi & Mã giảm giá hôm nay",
                            "Chính sách đổi trả và bảo hành",
                          ].map((reply) => (
                            <button
                              key={reply}
                              onClick={() => handleQuickReply(reply)}
                              className="text-[11px] text-emerald-600 bg-emerald-50/70 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200/70 rounded-full px-2.5 py-1 text-left transition-all cursor-pointer font-medium"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {!isAuthenticated ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-4 space-y-3">
                    <Info className="h-8 w-8 text-gray-400" />
                    <p className="text-xs text-gray-500 font-medium">
                      Vui lòng đăng nhập tài khoản của bạn để kết nối trực tiếp
                      với nhân viên hỗ trợ.
                    </p>
                  </div>
                ) : !activeId ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-4 space-y-3">
                    <MessageCircle className="h-8 w-8 text-gray-400" />
                    <p className="text-xs text-gray-500 font-medium">
                      Bạn chưa có cuộc trò chuyện nào hoạt động với nhân viên.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateChatSession}
                      disabled={creatingConv}
                      className="bg-blue-600 hover:bg-blue-700 text-xs font-semibold h-8"
                    >
                      Bắt đầu cuộc trò chuyện mới
                    </Button>
                  </div>
                ) : (
                  <>
                    {orderedStaffMessages.map((msg, index) => {
                      const mine =
                        msg.senderType === "CUSTOMER" &&
                        (msg.senderId === Number(user?.userId) ||
                          msg.senderId === user?.customerId);

                      const nextMsg = orderedStaffMessages[index + 1];
                      const prevMsg = orderedStaffMessages[index - 1];
                      const isLastInGroup =
                        !nextMsg ||
                        msg.senderId !== nextMsg.senderId ||
                        msg.senderType !== nextMsg.senderType;
                      const isFirstInGroup =
                        !prevMsg ||
                        msg.senderId !== prevMsg.senderId ||
                        msg.senderType !== prevMsg.senderType;
                      const orderDisplay = parseOrderMessage(msg);

                      return (
                        <div
                          key={msg.messageId}
                          className={cn(
                            "flex gap-2 text-xs",
                            mine ? "justify-end" : "justify-start",
                            isFirstInGroup ? "mt-3" : "mt-0.5",
                          )}
                        >
                          {!mine &&
                            (isLastInGroup ? (
                              <Avatar className="h-7 w-7 shrink-0 self-end">
                                <AvatarImage
                                  src={resolveImageUrl(msg.senderAvatar)}
                                />
                                <AvatarFallback>
                                  {msg.senderName?.charAt(0) ?? "?"}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-7 h-7 shrink-0" />
                            ))}
                          <div
                            className={cn(
                              "flex flex-col max-w-[75%]",
                              mine ? "items-end" : "items-start",
                            )}
                          >
                            <div
                              className={cn(
                                "px-3 py-2 leading-relaxed shadow-sm text-xs transition-all",
                                mine
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-800 border border-gray-200",
                              )}
                              style={getBubbleStyle(
                                mine,
                                isFirstInGroup,
                                isLastInGroup,
                              )}
                            >
                              {msg.messageType === "IMAGE" && msg.imageUrl && (
                                <div className="mb-1">
                                  <img
                                    src={resolveImageUrl(msg.imageUrl)}
                                    alt="Hình ảnh đính kèm"
                                    className="max-h-48 max-w-full rounded-lg object-cover cursor-pointer hover:opacity-95"
                                    onClick={() =>
                                      window.open(
                                        resolveImageUrl(msg.imageUrl),
                                        "_blank",
                                      )
                                    }
                                  />
                                </div>
                              )}
                              {orderDisplay && (
                                <div
                                  className={cn(
                                    "mb-1 min-w-[210px] space-y-1.5 rounded-lg border p-2.5 text-left text-xs",
                                    mine
                                      ? "border-white/25 bg-white/10"
                                      : "border-blue-100 bg-white",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex justify-between gap-2 font-bold",
                                      mine ? "text-amber-200" : "text-blue-700",
                                    )}
                                  >
                                    <span>#{orderDisplay.orderCode}</span>
                                    {orderDisplay.status && (
                                      <span className="text-right text-[10px] opacity-80">
                                        {getOrderStatusLabel(
                                          orderDisplay.status,
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  {orderDisplay.receiverName && (
                                    <div className="opacity-90">
                                      Người nhận: {orderDisplay.receiverName}
                                    </div>
                                  )}
                                  {orderDisplay.amount !== undefined && (
                                    <div className="opacity-90">
                                      Tổng:{" "}
                                      <span
                                        className={cn(
                                          "font-semibold",
                                          mine
                                            ? "text-yellow-300"
                                            : "text-red-600",
                                        )}
                                      >
                                        {new Intl.NumberFormat("vi-VN", {
                                          style: "currency",
                                          currency: "VND",
                                        }).format(orderDisplay.amount)}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      window.open(
                                        "/account?tab=orders",
                                        "_blank",
                                      )
                                    }
                                    className={cn(
                                      "mt-1 w-full rounded py-1 text-center text-[10px] font-medium transition-colors",
                                      mine
                                        ? "bg-white/20 text-white hover:bg-white/30"
                                        : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                                    )}
                                  >
                                    Xem chi tiết đơn hàng
                                  </button>
                                </div>
                              )}
                              {msg.messageType !== "ORDER" && (
                                <p>{msg.messageContent}</p>
                              )}
                              {msg.messageType === "ORDER" &&
                                !orderDisplay &&
                                msg.messageContent && (
                                  <p>Tôi muốn hỏi về đơn hàng này.</p>
                                )}
                            </div>
                            {isLastInGroup && (
                              <span className="block text-[9px] text-gray-400 font-sans mt-0.5 px-1">
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
                  </>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {}
          {activeTab === "staff" && activeConversation?.status !== "CLOSED" && (
            <>
              {previewUrl && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={previewUrl}
                      alt="Ảnh xem trước"
                      className="h-10 w-10 object-cover rounded-md border border-gray-200"
                    />
                    <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
                      {selectedFile?.name}
                    </span>
                  </div>
                  <button
                    onClick={removeSelectedFile}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {showOrderList && (
                <div className="max-h-40 overflow-y-auto bg-white border-t border-gray-200 p-2 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between px-2 pb-1 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500">
                      Chọn đơn hàng cần hỏi
                    </span>
                    <button
                      onClick={() => setShowOrderList(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-4 text-xs text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin mr-1" /> Đang tải
                      đơn hàng...
                    </div>
                  ) : !selectableOrders?.content ||
                    selectableOrders.content.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-400">
                      Bạn chưa có đơn hàng nào.
                    </div>
                  ) : (
                    selectableOrders.content.map((order) => (
                      <div
                        key={order.orderId}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 border border-gray-100 text-xs"
                      >
                        <div className="text-left">
                          <p className="font-bold text-blue-600">
                            #{order.orderCode}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                            }).format(order.finalAmount)}{" "}
                            • {getOrderStatusLabel(order.orderStatus)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleSendOrder(order.orderId, order.orderCode)
                          }
                          className="h-6 text-[10px] px-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Gửi
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {}
          <div className="border-t border-gray-150 p-3 bg-white">
            {activeTab === "ai" ? (
              <form onSubmit={handleAiSend} className="flex flex-col gap-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    "Sản phẩm mới",
                    "Tìm áo thun",
                    "Xem khuyến mãi",
                    "Tra cứu đơn hàng",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickReply(chip)}
                      className="flex-shrink-0 text-[10px] font-semibold text-blue-600 bg-blue-50/60 hover:bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 transition-all cursor-pointer active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Nhập câu hỏi cho AI..."
                    disabled={isAiTyping}
                    className="h-9 text-xs rounded-full bg-gray-50 border-gray-200 flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isAiTyping || !aiInput.trim()}
                    className="rounded-full h-9 w-9 bg-blue-600 hover:bg-blue-700 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            ) : activeConversation?.status === "CLOSED" ? (
              <div className="flex flex-col gap-2">
                <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg">
                  Cuộc trò chuyện này đã kết thúc.
                </div>
                <Button
                  size="sm"
                  onClick={handleCreateChatSession}
                  disabled={creatingConv}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs font-semibold h-8 rounded-full"
                >
                  Bắt đầu cuộc trò chuyện mới
                </Button>
              </div>
            ) : (
              <div
                className="flex flex-col gap-2"
                style={{
                  display: isAuthenticated && activeId ? "flex" : "none",
                }}
              >
                <form
                  onSubmit={handleStaffSend}
                  className="flex gap-1.5 items-center"
                >
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    title="Gửi hình ảnh"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0"
                  >
                    <ImageIcon className="h-4.5 w-4.5" />
                  </button>
                  <button
                    type="button"
                    title="Chọn đơn hàng gửi nhân viên"
                    onClick={() => setShowOrderList(!showOrderList)}
                    className={cn(
                      "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0",
                      showOrderList && "text-blue-600 bg-blue-50",
                    )}
                  >
                    <ShoppingBag className="h-4.5 w-4.5" />
                  </button>
                  <Input
                    value={staffInput}
                    onChange={(e) => setStaffInput(e.target.value)}
                    placeholder={
                      selectedFile
                        ? "Nhập chú thích ảnh..."
                        : "Nhập tin nhắn..."
                    }
                    className="h-9 text-xs rounded-full bg-gray-50 border-gray-200 flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={
                      sendingMsg || (!staffInput.trim() && !selectedFile)
                    }
                    className="rounded-full h-9 w-9 bg-blue-600 hover:bg-blue-700 shrink-0"
                  >
                    {sendingMsg ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95",
          isOpen
            ? "bg-red-500 hover:bg-red-600 rotate-90"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95",
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {}
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
