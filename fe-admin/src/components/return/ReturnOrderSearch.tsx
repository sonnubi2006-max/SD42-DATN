import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Loader2,
  PackageOpen,
  Search,
} from "lucide-react";
import type { OrderResponse } from "@/api/orderApi";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ReturnOrderSearchProps {
  searchCode: string;
  onSearchCodeChange: (value: string) => void;
  eligibleOrders: OrderResponse[];
  selectedOrderId: number | null;
  onSelectOrder: (order: OrderResponse) => void;
  isLoading: boolean;
  isSelecting: boolean;
  searchError: string | null;
}

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function ReturnOrderSearch({
  searchCode,
  onSearchCodeChange,
  eligibleOrders,
  selectedOrderId,
  onSelectOrder,
  isLoading,
  isSelecting,
  searchError,
}: ReturnOrderSearchProps) {
  const keyword = searchCode.trim().toLocaleLowerCase("vi-VN");
  const filteredOrders = eligibleOrders.filter((order) => {
    if (!keyword) return true;
    return [order.orderCode, order.customerName, order.customerPhone].some(
      (value) => value?.toLocaleLowerCase("vi-VN").includes(keyword),
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-xs font-semibold text-gray-700">
            Tìm và chọn đơn hàng cần trả
          </Label>
          <p className="mt-1 text-[10px] text-gray-500">
            Danh sách chỉ gồm đơn còn hạn và còn sản phẩm có thể trả.
          </p>
        </div>
        {!isLoading && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
            {eligibleOrders.length} đơn khả dụng
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Tìm theo mã đơn, tên hoặc số điện thoại khách hàng..."
          value={searchCode}
          onChange={(event) => onSearchCodeChange(event.target.value)}
          className="h-9 pl-9 text-xs"
          aria-label="Tìm đơn hàng có thể trả"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/40 p-2">
        {isLoading ? (
          <div className="flex min-h-28 items-center justify-center gap-2 text-xs text-gray-500">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            Đang tải danh sách đơn có thể trả...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex min-h-28 flex-col items-center justify-center px-4 text-center">
            <PackageOpen size={24} className="mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-600">
              {keyword
                ? "Không tìm thấy đơn khả dụng phù hợp"
                : "Hiện không có đơn hàng nào có thể trả"}
            </p>
            <p className="mt-1 text-[10px] text-gray-400">
              Thử tìm bằng mã đơn, tên hoặc số điện thoại khác.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => {
              const selected = selectedOrderId === order.orderId;
              const remainingItems = order.items.reduce(
                (sum, item) =>
                  sum + (item.remainingReturnQuantity ?? item.quantity),
                0,
              );

              return (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => onSelectOrder(order)}
                  disabled={isSelecting}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selected
                      ? "border-blue-400 bg-blue-50 ring-1 ring-blue-100"
                      : "border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  } disabled:cursor-wait disabled:opacity-70`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-xs text-gray-950">
                          {order.orderCode}
                        </strong>
                        {selected && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                            <CheckCircle2 size={10} /> Đã chọn
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[11px] text-gray-600">
                        {order.customerName || "Khách vãng lai"}
                        {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-bold text-gray-900">
                        {order.finalAmount.toLocaleString("vi-VN")}đ
                      </p>
                      <p className="mt-1 text-[9px] text-emerald-700">
                        Còn {remainingItems} sản phẩm có thể trả
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-500">
                    <CalendarClock size={11} />
                    Hạn trả: {formatDate(order.returnDeadline)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {searchError && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle size={14} /> {searchError}
        </p>
      )}
    </div>
  );
}
