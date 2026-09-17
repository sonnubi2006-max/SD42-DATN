import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useCreateConversation,
  useMessages,
  useSendMessage,
  useCloseConversation,
} from "@/hooks/useChat";
import useAuthStore from "@/store/authStore";
import { resolveImageUrl } from "@/utils/format";
import { formatTime } from "@/utils/dateUtils";

export default function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const { data: conversations, isLoading } = useConversations();
  const { mutate: createConversation, isPending: creating } =
    useCreateConversation();

  const [activeId, setActiveId] = useState<number>();
  const { data: messages } = useMessages(activeId);
  const { mutate: sendMessage, isPending: sending } = useSendMessage(
    activeId ?? 0,
  );
  const { mutate: closeConversation, isPending: closing } = useCloseConversation();

  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const convs = conversations?.content ?? [];
  const activeConv = convs.find((c) => c.conversationId === activeId);

  useEffect(() => {
    if (!activeId && convs.length) setActiveId(convs[0].conversationId);
  }, [convs, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    sendMessage({ content: text.trim() }, { onSuccess: () => setText("") });
  };

  const handleClose = () => {
    if (!activeId) return;
    if (window.confirm("Bạn có chắc chắn muốn kết thúc cuộc trò chuyện này?")) {
      closeConversation(activeId);
    }
  };

  const handleNewConversation = () => {
    createConversation(
      { title: "Hỗ trợ khách hàng", firstMessage: "Xin chào, tôi cần hỗ trợ." },
      { onSuccess: (c) => setActiveId(c.conversationId) },
    );
  };

  const ordered = [...(messages?.content ?? [])].reverse();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trò chuyện hỗ trợ</h1>
        <Button size="sm" onClick={handleNewConversation} disabled={creating}>
          <Plus className="mr-1 size-4" /> Cuộc trò chuyện mới
        </Button>
      </div>

      <div className="grid h-[70vh] grid-cols-1 overflow-hidden rounded-xl border md:grid-cols-3">
        {}
        <div className="border-r md:col-span-1">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Đang tải…</div>
          ) : !convs.length ? (
            <div className="p-4 text-sm text-muted-foreground">
              Chưa có cuộc trò chuyện.
            </div>
          ) : (
            <div className="divide-y overflow-y-auto">
              {convs.map((c) => (
                <button
                  key={c.conversationId}
                  onClick={() => setActiveId(c.conversationId)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent/40",
                    activeId === c.conversationId && "bg-accent/60",
                  )}
                >
                  <Avatar className="size-9">
                    <AvatarFallback>
                      {c.staffName?.charAt(0) ?? "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-medium">
                        {c.title || "Hỗ trợ"}
                      </p>
                      {c.status === "CLOSED" && (
                        <span className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold">
                          Đã đóng
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.lastMessage ?? "Chưa có tin nhắn"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {}
        <div className="flex flex-col md:col-span-2 bg-background">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Chọn hoặc tạo một cuộc trò chuyện để bắt đầu.
            </div>
          ) : (
            <>
              {}
              <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>
                      {activeConv?.staffName?.charAt(0) ?? "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-sm font-semibold">{activeConv?.title || "Hỗ trợ khách hàng"}</h3>
                    <p className="text-xs text-muted-foreground">
                      Trạng thái:{" "}
                      <span className={cn(
                        "font-medium",
                        activeConv?.status === "CLOSED" ? "text-red-500" : "text-green-500"
                      )}>
                        {activeConv?.status === "CLOSED" ? "Đã kết thúc" : "Đang hoạt động"}
                      </span>
                    </p>
                  </div>
                </div>

                {activeConv?.status !== "CLOSED" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleClose}
                    disabled={closing}
                    className="text-xs h-8 px-3"
                  >
                    Kết thúc cuộc trò chuyện
                  </Button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {ordered.map((m) => {
                  const mine = m.senderName === user?.username;
                  return (
                    <div
                      key={m.messageId}
                      className={cn(
                        "flex gap-2",
                        mine ? "justify-end" : "justify-start",
                      )}
                    >
                      {!mine && (
                        <Avatar className="size-7">
                          <AvatarImage src={resolveImageUrl(m.senderAvatar)} />
                          <AvatarFallback>
                            {m.senderName?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 text-sm",
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {m.imageUrl && (
                          <img
                            src={resolveImageUrl(m.imageUrl)}
                            alt="Ảnh"
                            className="mb-1 max-h-48 rounded-lg object-cover"
                          />
                        )}
                        {m.messageContent && <p>{m.messageContent}</p>}
                        <span
                          className={cn(
                            "mt-1 block text-[10px]",
                            mine
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatTime(m.sentAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {activeConv?.status === "CLOSED" ? (
                <div className="border-t p-4 text-center bg-muted/10 text-xs text-muted-foreground">
                  Cuộc trò chuyện này đã được đóng. Bạn không thể gửi thêm tin nhắn tại đây.
                </div>
              ) : (
                <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Nhập tin nhắn…"
                  />
                  <Button type="submit" size="icon" disabled={sending || !text.trim()}>
                    {sending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
