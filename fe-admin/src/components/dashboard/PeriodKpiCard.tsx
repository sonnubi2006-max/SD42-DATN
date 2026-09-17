import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PeriodKpiCardProps {
  title: string;
  stats?: {
    totalItemsSold: number;
    totalOrders: number;
    deliveredCount: number;
    cancelledCount: number;
    returnedCount: number;
    completedReturnCount: number;
    totalRefundAmount: number;
    grossRevenue: number;
    totalRevenue: number;
    cashRevenue: number;
    transferRevenue: number;
  };
  isLoading: boolean;
  iconColorClass?: string;
  borderColorClass?: string;
}

const money = (n: number) => (n ?? 0).toLocaleString("vi-VN") + " đ";

export default function PeriodKpiCard({
  title,
  stats,
  isLoading,
  iconColorClass = "text-blue-600 bg-blue-50",
  borderColorClass = "bg-blue-600",
}: PeriodKpiCardProps) {
  const completed = stats?.deliveredCount ?? 0;
  const cancelled = stats?.cancelledCount ?? 0;
  const total = stats?.totalOrders ?? 0;
  const processing = Math.max(0, total - (completed + cancelled));

  return (
    <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 bg-gradient-to-br from-white to-gray-50/50 relative overflow-hidden rounded-2xl group">
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 opacity-80 group-hover:opacity-100 transition-opacity ${borderColorClass}`}
      />
      <div className="absolute -right-6 -top-6 size-24 bg-gradient-to-br from-black/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <CardContent className="p-6 space-y-5 relative z-10">
        {}
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-1.5 rounded-lg ${iconColorClass}`}>
            <Calendar className="size-4.5 text-current" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 leading-tight">
            {isLoading ? "Đang tải..." : money(stats?.totalRevenue ?? 0)}
          </h3>
          <p className="text-[11px] font-bold text-emerald-600/80 uppercase tracking-wider">
            Doanh thu · đã trừ phí ship
          </p>
          <p className="text-sm font-semibold text-gray-500 mt-1">
            Sản phẩm đã bán{" "}
            <span className="text-gray-900 font-extrabold">
              {isLoading ? "0" : (stats?.totalItemsSold ?? 0)}
            </span>{" "}
            · Đơn hàng{" "}
            <span className="text-gray-900 font-extrabold">
              {isLoading ? "0" : total}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-emerald-700">
              Tiền mặt
            </p>
            <p className="mt-1 text-sm font-extrabold text-emerald-800">
              {isLoading ? money(0) : money(stats?.cashRevenue ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-blue-700">
              Chuyển khoản
            </p>
            <p className="mt-1 text-sm font-extrabold text-blue-800">
              {isLoading ? money(0) : money(stats?.transferRevenue ?? 0)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-3.5 border-t border-gray-100/60 text-xs font-bold">
          <span className="flex-1 text-center py-2 rounded bg-emerald-50 border border-emerald-100 text-emerald-700">
            Hoàn thành: {isLoading ? 0 : completed}
          </span>
          <span className="flex-1 text-center py-2 rounded bg-rose-50 border border-rose-100 text-rose-700">
            Hủy: {isLoading ? 0 : cancelled}
          </span>
          <span className="flex-1 text-center py-2 rounded bg-blue-50 border border-blue-100 text-blue-700">
            Xử lý: {isLoading ? 0 : processing}
          </span>
        </div>
        <div className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs">
          <div className="flex justify-between text-violet-700">
            <span>Đơn đổi trả</span>
            <b>{isLoading ? "0" : `${stats?.returnedCount ?? 0} đơn`}</b>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
