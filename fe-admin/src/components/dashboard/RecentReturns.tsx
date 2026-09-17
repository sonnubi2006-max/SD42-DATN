import { Link } from "react-router-dom";
import { RotateCcw, ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReturnList } from "@/hooks/useReturn";
import type { ReturnStatus } from "@/api/returnApi";

const money = (n: number) => (n ?? 0).toLocaleString("vi-VN") + " đ";

const RETURN_STATUS_MAP: Record<ReturnStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Đã duyệt", color: "bg-blue-50 text-blue-700" },
  REJECTED: { label: "Từ chối", color: "bg-rose-50 text-rose-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-50 text-emerald-700" },
};

const fmtTime = (iso: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(iso));
};

export default function RecentReturns() {
  const { data: returnPage, isLoading } = useReturnList({ page: 0, size: 5, sort: "createdAt,desc" } as any);

  const returns = returnPage?.content ?? [];

  return (
    <Card className="h-full border border-gray-100 shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <RotateCcw className="size-4.5 text-orange-500" />
          Yêu cầu đổi trả mới
        </CardTitle>
        <Link to="/returns" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 group">
          Xem tất cả <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin text-gray-300" />
          </div>
        ) : returns.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <RotateCcw className="size-8 text-gray-200 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Chưa có yêu cầu nào</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {returns.map((req) => {
              const statusInfo = RETURN_STATUS_MAP[req.status] ?? {
                label: req.status,
                color: "bg-gray-100 text-gray-600",
              };
              
              return (
                <Link
                  key={req.returnId}
                  to={`/returns/${req.returnId}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-orange-50/30 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        Đơn #{req.orderCode}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                      <span className="text-orange-600/80 bg-orange-100/50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                        {req.returnType === "REFUND" ? "Hoàn tiền" : "Đổi hàng"}
                      </span>
                      <span>•</span>
                      <span>{fmtTime(req.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {req.returnType === "REFUND" && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{money(req.refundAmount)}</p>
                      </div>
                    )}
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
