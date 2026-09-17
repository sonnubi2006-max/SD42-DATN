import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface OrderStatusChartProps {
  orderStats: any;
}

export default function OrderStatusChart({ orderStats }: OrderStatusChartProps) {
  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground">Trạng thái đơn hàng</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Phân bố đơn hàng theo quy trình xử lý</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3.5 flex-1 flex flex-col justify-center pt-0">
        {[
          { label: "Hoàn thành", count: orderStats?.deliveredCount ?? 0, color: "bg-emerald-500" },
          { label: "Đang giao", count: orderStats?.shippingCount ?? 0, color: "bg-indigo-500" },
          { label: "Đã xác nhận", count: orderStats?.confirmedCount ?? 0, color: "bg-blue-500" },
          { label: "Chờ xử lý", count: orderStats?.pendingCount ?? 0, color: "bg-amber-500" },
          { label: "Đã huỷ", count: orderStats?.cancelledCount ?? 0, color: "bg-rose-500" },
          { label: "Trả hàng", count: orderStats?.returnedCount ?? 0, color: "bg-gray-500" }
        ].map((item) => {
          const percent = orderStats?.totalOrders ? (item.count / orderStats.totalOrders) * 100 : 0;
          return (
            <div key={item.label} className="space-y-1.5 text-sm font-medium">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-semibold">{item.label}</span>
                <span className="text-foreground font-bold">{item.count} đơn ({percent.toFixed(0)}%)</span>
              </div>
              <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", item.color)}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
