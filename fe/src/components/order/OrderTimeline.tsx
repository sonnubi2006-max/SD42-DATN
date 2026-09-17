import { Calendar, FileText, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type OrderResponse, ORDER_STATUS_LABEL } from "@/api/orderApi";

interface OrderTimelineProps {
  order: OrderResponse;
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  return (
    <Card className="border border-gray-100">
      <CardHeader className="border-b border-gray-100 py-3.5">
        <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={14} /> Nhật ký hoạt động đơn hàng (Lịch trình)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative border-l border-gray-100 pl-4 ml-2.5 space-y-5">
          {(() => {
            const sortedLogs = order.transactionLogs
              ? order.transactionLogs
                .filter((log) => log.currentStatus !== "WAITING_STOCK")
                .sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
              : [];

            if (sortedLogs.length > 0) {
              return sortedLogs.map((log) => (
                <div key={log.logId} className="relative text-xs">
                  { }
                  <span className="absolute -left-[22px] top-0.5 bg-blue-50 border border-blue-500 w-3 h-3 rounded-full flex items-center justify-center">
                    <span className="bg-blue-500 w-1.5 h-1.5 rounded-full" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800">
                        {log.action || "Cập nhật trạng thái"}
                      </span>
                      <span className="text-[10px] text-gray-400  flex items-center gap-0.5">
                        <Calendar size={10} />{" "}
                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                      {log.previousStatus && log.previousStatus !== log.currentStatus && (
                        <>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 bg-gray-50 text-gray-500 border-gray-200"
                          >
                            {ORDER_STATUS_LABEL[log.previousStatus] || log.previousStatus}
                          </Badge>
                          <ArrowRight size={10} className="text-gray-300" />
                        </>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 bg-blue-50 text-blue-600 border-blue-200"
                      >
                        {ORDER_STATUS_LABEL[log.currentStatus] || log.currentStatus}
                      </Badge>
                    </div>

                    {log.note && (
                      <div className="bg-gray-50 border border-gray-100 rounded p-2 text-gray-600 mt-1">
                        <span className="font-semibold text-gray-700">Ghi chú:</span>{" "}
                        {log.note}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 font-medium mt-1">
                      Thực hiện bởi:{" "}
                      <span className="text-gray-600">{log.createdBy || "Hệ thống"}</span>
                    </p>
                  </div>
                </div>
              ));
            } else {
              return <div className="text-xs text-gray-400">Không có dữ liệu lịch sử xử lý.</div>;
            }
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
