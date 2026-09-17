import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderApi } from "@/api/orderApi";
import { toast } from "sonner";
import { getQuickCompareDates } from "./dashboardUtils";

interface RevenueCompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DateRange = { fromDate: string; toDate: string };
type OrderStatistics = Awaited<ReturnType<typeof orderApi.getStatistics>>;

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const apiError = error as Record<string, unknown>;
    if (typeof apiError.apiMessage === "string") return apiError.apiMessage;
    if (typeof apiError.message === "string") return apiError.message;
  }
  return "Lỗi kết nối";
};

function CompareMetricCard({
  label,
  p1Value,
  p2Value,
  format,
}: {
  label: string;
  p1Value: number;
  p2Value: number;
  format: (n: number) => string;
}) {
  const diffVal = p1Value - p2Value;
  const pct = p2Value ? (diffVal / p2Value) * 100 : 100;
  const isPositive = diffVal >= 0;

  return (
    <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-1.5">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-600 block">
        GĐ1:{" "}
        <strong className="text-blue-600 font-bold">{format(p1Value)}</strong>
      </span>
      <span className="text-sm font-semibold text-gray-600 block">
        GĐ2:{" "}
        <strong className="text-purple-600 font-bold">{format(p2Value)}</strong>
      </span>
      <div className="pt-2.5 border-t border-dashed mt-2.5">
        <span className="text-xs text-gray-400 font-bold block">
          Chênh lệch
        </span>
        <span
          className={`text-sm font-medium block mt-0.5 ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {isPositive ? "+" : ""}
          {format(diffVal)} ({isPositive ? "+" : ""}
          {pct.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

export default function RevenueCompareDialog({
  open,
  onOpenChange,
}: RevenueCompareDialogProps) {
  const [period1, setPeriod1] = useState<DateRange>(() => {
    const dates = getQuickCompareDates("thisweek-lastweek");
    return { fromDate: dates.p1From, toDate: dates.p1To };
  });
  const [period2, setPeriod2] = useState<DateRange>(() => {
    const dates = getQuickCompareDates("thisweek-lastweek");
    return { fromDate: dates.p2From, toDate: dates.p2To };
  });
  const [compareResult, setCompareResult] = useState<{
    p1: OrderStatistics;
    p2: OrderStatistics;
  } | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleQuickSelect = (
    type: "today-yesterday" | "thisweek-lastweek" | "thismonth-lastmonth",
  ) => {
    const dates = getQuickCompareDates(type);
    setPeriod1({ fromDate: dates.p1From, toDate: dates.p1To });
    setPeriod2({ fromDate: dates.p2From, toDate: dates.p2To });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !period1.fromDate ||
      !period1.toDate ||
      !period2.fromDate ||
      !period2.toDate
    ) {
      toast.error("Vui lòng nhập đầy đủ các khoảng thời gian cần so sánh");
      return;
    }

    setIsComparing(true);
    try {
      const [res1, res2] = await Promise.all([
        orderApi.getStatistics({
          fromDate: `${period1.fromDate}T00:00:00`,
          toDate: `${period1.toDate}T23:59:59`,
        }),
        orderApi.getStatistics({
          fromDate: `${period2.fromDate}T00:00:00`,
          toDate: `${period2.toDate}T23:59:59`,
        }),
      ]);
      setCompareResult({ p1: res1, p2: res2 });
      toast.success("So sánh dữ liệu thành công!");
    } catch (error: unknown) {
      toast.error("Không thể lấy dữ liệu so sánh: " + getErrorMessage(error));
    } finally {
      setIsComparing(false);
    }
  };

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) setCompareResult(null);
  };

  const moneyFmt = (n: number) => `${(n ?? 0).toLocaleString("vi-VN")} đ`;
  const ordersFmt = (n: number) => `${n} đơn`;
  const itemsFmt = (n: number) => `${n} chiếc`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] bg-white rounded-2xl shadow-xl border border-gray-150 p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
            📊 So sánh kết quả kinh doanh
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 font-medium">
            Lựa chọn và đối chiếu số liệu doanh thu giữa hai khoảng thời gian
            khác nhau.
          </DialogDescription>
        </DialogHeader>

        {}
        <div className="flex flex-wrap gap-2.5 mb-2 mt-1.5">
          {(
            [
              "today-yesterday",
              "thisweek-lastweek",
              "thismonth-lastmonth",
            ] as const
          ).map((type) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect(type)}
              className="text-xs font-bold text-gray-600 border-gray-255 rounded-lg py-1.5 px-3.5 cursor-pointer"
            >
              {type === "today-yesterday"
                ? "Hôm nay vs Hôm qua"
                : type === "thisweek-lastweek"
                  ? "Tuần này vs Tuần trước"
                  : "Tháng này vs Tháng trước"}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {}
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-3.5">
              <span className="text-sm font-bold text-blue-600 uppercase tracking-wider block">
                Giai đoạn 1 (Chính)
              </span>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={period1.fromDate}
                    onChange={(e) =>
                      setPeriod1({ ...period1, fromDate: e.target.value })
                    }
                    className="bg-white border-gray-200 h-10 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={period1.toDate}
                    onChange={(e) =>
                      setPeriod1({ ...period1, toDate: e.target.value })
                    }
                    className="bg-white border-gray-200 h-10 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {}
            <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 space-y-3.5">
              <span className="text-sm font-bold text-purple-600 uppercase tracking-wider block">
                Giai đoạn 2 (Đối chiếu)
              </span>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={period2.fromDate}
                    onChange={(e) =>
                      setPeriod2({ ...period2, fromDate: e.target.value })
                    }
                    className="bg-white border-gray-200 h-10 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={period2.toDate}
                    onChange={(e) =>
                      setPeriod2({ ...period2, toDate: e.target.value })
                    }
                    className="bg-white border-gray-200 h-10 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              className="text-sm font-bold h-10 px-4 border-gray-200 cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              type="submit"
              disabled={isComparing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-10 px-5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {isComparing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang tính toán...
                </>
              ) : (
                "Thực hiện so sánh"
              )}
            </Button>
          </div>
        </form>

        {}
        {compareResult && (
          <div className="mt-6 border-t pt-4 space-y-4">
            <span className="text-sm font-medium text-gray-900 uppercase block tracking-wider">
              📊 Kết quả đối chiếu chi tiết
            </span>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              <CompareMetricCard
                label="Doanh thu"
                p1Value={compareResult.p1?.totalRevenue ?? 0}
                p2Value={compareResult.p2?.totalRevenue ?? 0}
                format={moneyFmt}
              />
              <CompareMetricCard
                label="Tiền mặt"
                p1Value={compareResult.p1?.cashRevenue ?? 0}
                p2Value={compareResult.p2?.cashRevenue ?? 0}
                format={moneyFmt}
              />
              <CompareMetricCard
                label="Chuyển khoản"
                p1Value={compareResult.p1?.transferRevenue ?? 0}
                p2Value={compareResult.p2?.transferRevenue ?? 0}
                format={moneyFmt}
              />
              <CompareMetricCard
                label="Đơn đổi trả hoàn tất"
                p1Value={compareResult.p1?.completedReturnCount ?? 0}
                p2Value={compareResult.p2?.completedReturnCount ?? 0}
                format={ordersFmt}
              />
              <CompareMetricCard
                label="Đơn hàng"
                p1Value={compareResult.p1?.totalOrders ?? 0}
                p2Value={compareResult.p2?.totalOrders ?? 0}
                format={ordersFmt}
              />
              <CompareMetricCard
                label="Sản phẩm bán"
                p1Value={compareResult.p1?.totalItemsSold ?? 0}
                p2Value={compareResult.p2?.totalItemsSold ?? 0}
                format={itemsFmt}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
