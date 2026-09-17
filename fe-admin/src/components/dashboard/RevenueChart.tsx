import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useOrderStatistics } from "@/hooks/useOrder";

interface RevenueChartProps {
  onOpenCompare: () => void;
  onRangeChange?: (params: { fromDate: string; toDate: string }) => void;
}

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMoney = (value: number) =>
  `${(value ?? 0).toLocaleString("vi-VN")} đ`;
type RangeType = "TODAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";

const getPresetRange = (type: Exclude<RangeType, "CUSTOM">, today: Date) => {
  const start = new Date(today);
  if (type === "WEEK") {
    const day = today.getDay();
    start.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
  } else if (type === "MONTH") {
    start.setDate(1);
  } else if (type === "QUARTER") {
    start.setMonth(Math.floor(today.getMonth() / 3) * 3, 1);
  } else if (type === "YEAR") {
    start.setMonth(0, 1);
  }
  return { fromDate: toDateInput(start), toDate: toDateInput(today) };
};

export default function RevenueChart({
  onOpenCompare,
  onRangeChange,
}: RevenueChartProps) {
  const today = useMemo(() => new Date(), []);
  const firstDayOfMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const [fromDate, setFromDate] = useState(toDateInput(firstDayOfMonth));
  const [toDate, setToDate] = useState(toDateInput(today));
  const [rangeType, setRangeType] = useState<RangeType>("MONTH");
  const [appliedRange, setAppliedRange] = useState({
    fromDate: toDateInput(firstDayOfMonth),
    toDate: toDateInput(today),
  });

  const params = useMemo(
    () => ({
      fromDate: `${appliedRange.fromDate}T00:00:00`,
      toDate: `${appliedRange.toDate}T23:59:59`,
    }),
    [appliedRange],
  );

  useEffect(() => {
    onRangeChange?.(params);
  }, [onRangeChange, params]);

  const { data: stats, isLoading } = useOrderStatistics(params);
  const chartData = stats?.dailyRevenue ?? [];
  const hasRevenue = chartData.some((item) => item.revenue !== 0);

  const handleSearch = () => {
    if (!fromDate || !toDate || fromDate > toDate) return;
    setAppliedRange({ fromDate, toDate });
  };

  const handleRangeTypeChange = (type: RangeType) => {
    setRangeType(type);
    if (type === "CUSTOM") return;
    const range = getPresetRange(type, today);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setAppliedRange(range);
  };

  return (
    <Card className="h-full rounded-xl border border-slate-200 bg-white shadow-none">
      <CardHeader className="space-y-4 border-b border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Biểu đồ doanh thu
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Theo dõi doanh thu theo phương thức thanh toán
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCompare}
            className="h-9 text-xs"
          >
            So sánh
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="revenue-range" className="text-xs text-slate-600">
              Thời gian
            </Label>
            <select
              id="revenue-range"
              value={rangeType}
              onChange={(event) =>
                handleRangeTypeChange(event.target.value as RangeType)
              }
              className="h-9 min-w-[140px] rounded-md border border-input bg-transparent px-3 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="TODAY">Hôm nay</option>
              <option value="WEEK">Tuần này</option>
              <option value="MONTH">Tháng này</option>
              <option value="QUARTER">Quý này</option>
              <option value="YEAR">Năm nay</option>
              <option value="CUSTOM">Khoảng tùy chọn</option>
            </select>
          </div>
          {rangeType === "CUSTOM" && (
            <>
              <div className="grid gap-1.5">
                <Label
                  htmlFor="revenue-from"
                  className="text-xs text-slate-600"
                >
                  Từ ngày
                </Label>
                <Input
                  id="revenue-from"
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="h-9 w-[155px] text-xs"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="revenue-to" className="text-xs text-slate-600">
                  Đến ngày
                </Label>
                <Input
                  id="revenue-to"
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  max={toDateInput(today)}
                  onChange={(event) => setToDate(event.target.value)}
                  className="h-9 w-[155px] text-xs"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSearch}
                disabled={!fromDate || !toDate || fromDate > toDate}
                className="h-9 gap-1.5 px-4 text-xs"
              >
                <Search className="size-3.5" />
                Tìm kiếm
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Tổng doanh thu</p>
              <p className="mt-1 text-xl font-extrabold text-blue-700">
                {formatMoney(stats?.totalRevenue ?? 0)}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-xs text-slate-500">Tiền mặt</p>
              <p className="mt-1 text-base font-extrabold text-emerald-700">
                {formatMoney(stats?.cashRevenue ?? 0)}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-xs text-slate-500">Chuyển khoản</p>
              <p className="mt-1 text-base font-extrabold text-violet-700">
                {formatMoney(stats?.transferRevenue ?? 0)}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-xs text-slate-500">Đơn đổi trả</p>
              <p className="mt-1 text-base font-extrabold text-violet-700">
                {stats?.completedReturnCount ?? 0}/{stats?.returnedCount ?? 0}{" "}
                hoàn tất
              </p>
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays className="size-3.5" />
            {appliedRange.fromDate.split("-").reverse().join("/")} –{" "}
            {appliedRange.toDate.split("-").reverse().join("/")}
          </p>
        </div>

        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : !hasRevenue ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-500">
              Không có doanh thu trong khoảng thời gian này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={58}
                  fontSize={10}
                  tickFormatter={(value) =>
                    value >= 1_000_000
                      ? `${value / 1_000_000}tr`
                      : `${value / 1_000}k`
                  }
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatMoney(Number(value)),
                    name,
                  ]}
                  labelFormatter={(label) => `Ngày ${label}`}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                  activeDot={{
                    r: 5,
                    fill: "#1d4ed8",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cashRevenue"
                  name="Tiền mặt"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#047857",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="transferRevenue"
                  name="Chuyển khoản"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#6d28d9",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
