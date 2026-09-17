import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Package,
  ChevronRight,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Filter } from "lucide-react";
import { useOrderList } from "@/hooks/useOrder";
import { useDebounce } from "@/hooks/useDebounce";
import type { OrderStatus } from "@/api/orderApi";

interface Props {
  customerId: number;
}

const PAGE_SIZE = 10;

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-600" },
  WAITING_PAYMENT: {
    label: "Chờ thanh toán",
    color: "bg-amber-100 text-amber-700",
  },
  PENDING: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700" },
  WAITING_STOCK: {
    label: "Chờ bổ sung hàng",
    color: "bg-orange-100 text-orange-700",
  },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
  PROCESSING: { label: "Đang xử lý", color: "bg-blue-100 text-blue-700" },
  SHIPPING: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
  RETURNING: { label: "Đang hoàn", color: "bg-orange-100 text-orange-700" },
  RETURNED_TO_SHOP: {
    label: "Đã hoàn kho",
    color: "bg-gray-100 text-gray-600",
  },
  CANCELED_BY_DAMAGED: {
    label: "Hàng hỏng",
    color: "bg-rose-100 text-rose-700",
  },
  FAILED_DELIVERY: {
    label: "Giao thất bại",
    color: "bg-rose-100 text-rose-700",
  },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", color: "bg-rose-100 text-rose-700" },
  REFUNDED: { label: "Đã hoàn tiền", color: "bg-purple-100 text-purple-700" },
};

const money = (n: number) => (n ?? 0).toLocaleString("vi-VN") + " đ";

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

const TYPE_LABEL: Record<string, string> = {
  ONLINE: "Trực tuyến",
  POS: "Tại quầy",
  POS_SHIP: "Tại quầy + Giao hàng",
};

export default function CustomerOrderHistory({ customerId }: Props) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: orderPage, isLoading } = useOrderList({
    customerId,
    keyword: debouncedSearch || undefined,
    fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
    toDate: toDate ? `${toDate}T23:59:59` : undefined,
    page,
    size: PAGE_SIZE,
  });

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, fromDate, toDate]);

  const orders = orderPage?.content ?? [];
  const totalPages = orderPage?.totalPages ?? 0;
  const totalElements = orderPage?.totalElements ?? 0;
  const isFirst = page === 0;
  const isLast = page >= totalPages - 1;

  const startItem = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const endItem = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <Card>
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShoppingBag className="size-4 text-blue-600" />
              Lịch sử đơn hàng
            </CardTitle>
            <CardDescription className="mt-1">
              Danh sách các đơn hàng của khách hàng này
            </CardDescription>
          </div>
          {!isLoading && totalElements > 0 && (
            <span className="text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-full">
              {totalElements} đơn hàng
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Bộ lọc */}
        <div className="flex flex-col sm:flex-row gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn hàng..."
              className="pl-9 h-9 text-xs bg-white border-gray-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Từ</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 w-[130px] text-xs bg-white border-gray-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Đến</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 w-[130px] text-xs bg-white border-gray-200"
              />
            </div>
          </div>
        </div>

        {}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, n) => (
              <div
                key={n}
                className="flex items-center gap-4 p-3.5 border rounded-xl animate-pulse"
              >
                <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="p-3 rounded-full bg-muted/50">
              <Package className="size-7 text-muted-foreground opacity-60" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              Chưa có đơn hàng nào
            </p>
            <p className="text-xs text-muted-foreground/70">
              Khách hàng này chưa thực hiện giao dịch nào
            </p>
          </div>
        ) : (
          <>
            {}
            <div className="space-y-2.5">
              {orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] ?? {
                  label: order.status,
                  color: "bg-gray-100 text-gray-600",
                };
                return (
                  <Link
                    key={order.orderId}
                    to={`/orders/${order.orderId}`}
                    className="group flex items-center gap-3.5 p-3.5 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-150"
                  >
                    {}
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <ShoppingBag className="size-5" />
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                          #{order.orderCode}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {TYPE_LABEL[order.orderType] ?? order.orderType}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span>{fmtDate(order.createdAt)}</span>
                        <span className="text-gray-300">·</span>
                        <span className="font-bold text-gray-700">
                          {money(order.totalAmount)}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{order.totalItems} sản phẩm</span>
                      </div>
                    </div>

                    {}
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                      <ChevronRight className="size-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                {}
                <span className="text-xs text-gray-500 font-medium">
                  Hiển thị{" "}
                  <span className="font-bold text-gray-700">
                    {startItem}–{endItem}
                  </span>{" "}
                  /{" "}
                  <span className="font-bold text-gray-700">
                    {totalElements}
                  </span>{" "}
                  đơn hàng
                </span>

                {}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={isFirst}
                    className="h-8 w-8 p-0 rounded-lg border-gray-200 disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const isActive = i === page;

                    const showPage =
                      i === 0 ||
                      i === totalPages - 1 ||
                      Math.abs(i - page) <= 1;

                    if (!showPage) {
                      const prevShown =
                        i === 1 ||
                        i === totalPages - 2 ||
                        Math.abs(i - 1 - page) <= 1;
                      if (!prevShown) return null;
                      return (
                        <span
                          key={i}
                          className="text-xs text-gray-400 px-1 select-none"
                        >
                          …
                        </span>
                      );
                    }

                    return (
                      <Button
                        key={i}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(i)}
                        className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${
                          isActive
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {i + 1}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages - 1, p + 1))
                    }
                    disabled={isLast}
                    className="h-8 w-8 p-0 rounded-lg border-gray-200 disabled:opacity-40"
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
