import { useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import OrderStatusBadge from "@/components/order/OrderStatusBadge";
import { useMyOrdersInfinite } from "@/hooks/useOrder";
import { type OrderStatus } from "@/api/orderApi";
import { formatCurrency } from "@/utils/format";
import { formatDateTime } from "@/utils/dateUtils";
import AccountLayout from "@/components/account/AccountLayout";

const TABS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = (searchParams.get("status") as OrderStatus | "ALL") || "ALL";
  const keyword = searchParams.get("keyword") || "";

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyOrdersInfinite({
    size: 10,
    status: status === "ALL" ? null : status,
    keyword: keyword.trim() || undefined,
  });

  const orders = (data?.pages.flatMap((page) => page.content) ?? []).filter(
    (o) => o.orderStatus !== "DRAFT"
  );

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentEl = observerRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleStatusChange = (newStatus: OrderStatus | "ALL") => {
    setSearchParams((prev) => {
      if (newStatus === "ALL") {
        prev.delete("status");
      } else {
        prev.set("status", newStatus);
      }
      return prev;
    });
  };

  const handleKeywordChange = (newKeyword: string) => {
    setSearchParams((prev) => {
      if (!newKeyword) {
        prev.delete("keyword");
      } else {
        prev.set("keyword", newKeyword);
      }
      return prev;
    });
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đơn mua hàng</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và quản lý các đơn đặt hàng của bạn</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold cursor-pointer transition-all duration-200",
                  status === tab.value
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "bg-background text-foreground hover:bg-accent border-border",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {keyword && (
              <button
                onClick={() => handleKeywordChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải…</p>
        ) : !orders.length ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center">
            <Package className="size-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Không có đơn hàng nào.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-6 grid">
              {orders.map((order) => (
                <Link key={order.orderId} to={`/orders/${order.orderId}`}>
                  <Card className="transition-shadow hover:shadow-md border-border/75">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">#{order.orderCode}</span>
                          <OrderStatusBadge status={order.orderStatus} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {order.totalItems} sản phẩm •{" "}
                          {formatDateTime(order.orderDate)}
                        </p>
                      </div>
                      <span className="font-semibold text-sm text-primary">
                        {formatCurrency(order.finalAmount)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {}
            <div ref={observerRef} className="py-6 flex justify-center text-xs text-muted-foreground">
              {isFetchingNextPage ? (
                <span className="animate-pulse">Đang tải thêm đơn hàng...</span>
              ) : hasNextPage ? (
                <span>Cuộn xuống để tải thêm</span>
              ) : (
                <span>Đã hiển thị tất cả đơn hàng</span>
              )}
            </div>
          </>
        )}
      </div>
    </AccountLayout>
  );
}
