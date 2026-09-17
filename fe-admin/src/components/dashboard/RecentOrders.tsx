import { Link } from "react-router-dom";
import { ShoppingBag, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOrderList } from "@/hooks/useOrder";
import { ORDER_STATUS_LABEL } from "@/api/orderApi";

const money = (n: number) => (n ?? 0).toLocaleString("vi-VN") + " đ";

const fmtTime = (iso: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(iso));
};

export default function RecentOrders() {
  const { data: orderPage, isLoading } = useOrderList({ page: 0, size: 5, sort: "createdAt,desc" } as any);
  // sort is probably omitted in typescript interface but backend supports it by default pageable

  const orders = orderPage?.content ?? [];

  return (
    <Card className="h-full border border-gray-100 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShoppingBag className="size-4.5 text-blue-600" />
          Đơn hàng mới nhất
        </CardTitle>
        <Link to="/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
          Xem tất cả <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-gray-300" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="size-8 text-gray-200 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Chưa có đơn hàng</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {orders.map((order) => (
              <Link
                key={order.orderId}
                to={`/orders/${order.orderId}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-gray-50/50 transition-colors group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      #{order.orderCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                      order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                    <span>{order.customerName || "Khách lẻ"}</span>
                    <span>•</span>
                    <span>{fmtTime(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{money(order.totalAmount)}</p>
                    <p className="text-xs font-medium text-gray-500">{order.totalItems} SP</p>
                  </div>
                  <ChevronRight className="size-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
