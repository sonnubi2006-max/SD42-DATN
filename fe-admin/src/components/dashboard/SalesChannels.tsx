import { Store, Globe } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface OrderTypeStats {
  posRevenue: number;
  onlineRevenue: number;
  posCount: number;
  onlineCount: number;
}

interface SalesChannelsProps {
  orderTypeStats: OrderTypeStats | undefined;
  isLoading: boolean;
}

export default function SalesChannels({
  orderTypeStats,
  isLoading,
}: SalesChannelsProps) {
  const money = (n: number) => {
    return (n ?? 0).toLocaleString("vi-VN") + "đ";
  };

  if (isLoading || !orderTypeStats) {
    return (
      <Card className="h-[200px] animate-pulse p-6">
        <div className="h-4 w-1/3 bg-muted rounded mb-4" />
        <div className="h-28 bg-muted/40 rounded-xl" />
      </Card>
    );
  }

  const totalRevenue = Math.max(
    orderTypeStats.posRevenue + orderTypeStats.onlineRevenue,
    1,
  );
  const posPercent = (orderTypeStats.posRevenue / totalRevenue) * 100;
  const onlinePercent = (orderTypeStats.onlineRevenue / totalRevenue) * 100;

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-foreground">
          Kênh bán hàng
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Doanh số bán tại quầy và trực tuyến
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 flex-1 flex flex-col justify-center pt-0">
        {}
        <div className="h-4.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex text-[10px] font-medium text-white text-center">
          {orderTypeStats.posRevenue > 0 && (
            <div
              className="h-full bg-indigo-600 flex items-center justify-center transition-all duration-500"
              style={{ width: `${posPercent}%` }}
            >
              {posPercent >= 15 ? `${posPercent.toFixed(0)}%` : ""}
            </div>
          )}
          {orderTypeStats.onlineRevenue > 0 && (
            <div
              className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-500"
              style={{ width: `${onlinePercent}%` }}
            >
              {onlinePercent >= 15 ? `${onlinePercent.toFixed(0)}%` : ""}
            </div>
          )}
        </div>

        {}
        <div className="grid grid-cols-2 gap-4">
          {}
          <div className="p-3 bg-indigo-50/40 border border-indigo-100/30 dark:bg-indigo-950/20 dark:border-indigo-900/30 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-indigo-500 text-white rounded-xl">
              <Store className="size-4.5" />
            </div>
            <div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold block">
                Tại quầy
              </span>
              <span className="text-base font-medium text-foreground block mt-0.5">
                {money(orderTypeStats.posRevenue)}
              </span>
              <span className="text-xs text-muted-foreground">
                {orderTypeStats.posCount} hoá đơn
              </span>
            </div>
          </div>

          {}
          <div className="p-3 bg-emerald-50/40 border border-emerald-100/30 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <Globe className="size-4.5" />
            </div>
            <div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">
                Trực tuyến
              </span>
              <span className="text-base font-medium text-foreground block mt-0.5">
                {money(orderTypeStats.onlineRevenue)}
              </span>
              <span className="text-xs text-muted-foreground">
                {orderTypeStats.onlineCount} đơn hàng
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
