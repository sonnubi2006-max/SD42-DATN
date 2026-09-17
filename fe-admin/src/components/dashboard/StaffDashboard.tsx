import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  PackageCheck,
  ReceiptText,
  RotateCcw,
  ShoppingBag,
  Store,
  Truck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useOrderList } from "@/hooks/useOrder";
import { useReturnList } from "@/hooks/useReturn";
import { getRangeParams } from "@/components/dashboard/dashboardUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OrderResponse, OrderStatus } from "@/api/orderApi";
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

type Period = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

const PERIOD_LABEL: Record<Period, string> = {
  TODAY: "Hôm nay",
  WEEK: "Tuần này",
  MONTH: "Tháng này",
  CUSTOM: "Tùy chọn",
};

const dateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const STATUS: Record<OrderStatus, { label: string; color: string }> = {
  DRAFT: { label: "Đơn nháp", color: "bg-slate-400" },
  WAITING_PAYMENT: { label: "Chờ thanh toán", color: "bg-amber-500" },
  PENDING: { label: "Chờ xử lý", color: "bg-amber-500" },
  WAITING_STOCK: { label: "Chờ bổ sung hàng", color: "bg-orange-500" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-500" },
  PROCESSING: { label: "Đang xử lý", color: "bg-cyan-500" },
  SHIPPING: { label: "Đang giao", color: "bg-indigo-500" },
  RETURNING: { label: "Đang hoàn", color: "bg-orange-500" },
  RETURNED_TO_SHOP: { label: "Đã hoàn kho", color: "bg-orange-600" },
  CANCELED_BY_DAMAGED: { label: "Hủy do hỏng", color: "bg-rose-600" },
  FAILED_DELIVERY: { label: "Giao thất bại", color: "bg-rose-400" },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-500" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-500" },
  REFUNDED: { label: "Đã hoàn tiền", color: "bg-purple-500" },
};

const money = (value: number) =>
  `${Math.round(value || 0).toLocaleString("vi-VN")} đ`;
const dateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

function orderValue(order: OrderResponse) {
  return order.netRevenue ?? order.finalAmount ?? order.totalAmount ?? 0;
}

function salesValue(order: OrderResponse) {
  if ((order.subtotal ?? 0) > 0) {
    return Math.max(0, order.subtotal - (order.discountAmount ?? 0));
  }
  return Math.max(
    0,
    (order.finalAmount ?? order.totalAmount ?? 0) - (order.shippingFee ?? 0),
  );
}

export default function StaffDashboard({
  staffId,
  staffName,
}: {
  staffId: number;
  staffName: string;
}) {
  const [period, setPeriod] = useState<Period>("TODAY");
  const today = useMemo(() => dateInputValue(new Date()), []);
  const monthStart = useMemo(
    () =>
      dateInputValue(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      ),
    [],
  );
  const [customFrom, setCustomFrom] = useState(monthStart);
  const [customTo, setCustomTo] = useState(today);
  const [appliedCustom, setAppliedCustom] = useState({
    from: monthStart,
    to: today,
  });
  const range = useMemo(() => {
    if (period !== "CUSTOM") return getRangeParams(period);
    return {
      fromDate: `${appliedCustom.from}T00:00:00`,
      toDate: `${appliedCustom.to}T23:59:59`,
    };
  }, [period, appliedCustom]);
  const { data, isLoading } = useOrderList({
    staffId,
    ...range,
    page: 0,
    size: 1000,
  });
  const { data: revenueData, isLoading: revenueLoading } = useOrderList({
    staffId,
    ...range,
    dateBasis: "COMPLETED",
    page: 0,
    size: 1000,
  });
  const { data: returnPage, isLoading: returnsLoading } = useReturnList({
    ...range,
    page: 0,
    size: 1000,
    sort: "updatedAt,desc",
  });

  const orders = useMemo(() => data?.content ?? [], [data?.content]);
  const revenueOrders = useMemo(
    () => revenueData?.content ?? [],
    [revenueData?.content],
  );
  const dashboardLoading = isLoading || revenueLoading;
  const handledReturns = useMemo(
    () =>
      (returnPage?.content ?? []).filter(
        (request) => request.processedById === staffId,
      ),
    [returnPage?.content, staffId],
  );
  const completed = revenueOrders.filter(
    (order) => order.status === "COMPLETED",
  );
  const salesOrders = revenueOrders.filter((order) =>
    ["COMPLETED", "CANCELED_BY_DAMAGED"].includes(order.status),
  );
  const cancelled = orders.filter((order) =>
    ["CANCELLED", "CANCELED_BY_DAMAGED"].includes(order.status),
  );
  const grossSales = salesOrders.reduce(
    (sum, order) => sum + salesValue(order),
    0,
  );
  const itemsSold = salesOrders.reduce(
    (sum, order) => sum + (order.totalItems ?? 0),
    0,
  );
  const completionRate = orders.length
    ? (completed.length / orders.length) * 100
    : 0;
  const averageOrder = salesOrders.length ? grossSales / salesOrders.length : 0;
  const refundRequests = handledReturns.filter(
    (request) => request.returnType === "REFUND",
  );
  const exchangeRequests = handledReturns.filter(
    (request) => request.returnType === "EXCHANGE",
  );
  const completedReturns = handledReturns.filter(
    (request) => request.status === "COMPLETED",
  );
  const rejectedReturns = handledReturns.filter(
    (request) => request.status === "REJECTED",
  );
  const pendingReturns = handledReturns.filter(
    (request) => request.status === "PENDING",
  );

  const statusRows = Object.entries(STATUS)
    .map(([status, config]) => ({
      status: status as OrderStatus,
      ...config,
      count: orders.filter((order) => order.status === status).length,
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const posCount = orders.filter((order) => order.orderType === "POS").length;
  const posShipCount = orders.filter(
    (order) => order.orderType === "POS_SHIP",
  ).length;
  const onlineCount = orders.filter(
    (order) => order.orderType === "ONLINE",
  ).length;
  const recent = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  const chartData = useMemo(() => {
    const start = new Date(range.fromDate);
    const end = new Date(range.toDate);
    const days: Array<{
      date: string;
      revenue: number;
      returns: number;
      orders: number;
    }> = [];
    const byDay = new Map<string, OrderResponse[]>();
    revenueOrders.forEach((order) => {
      const key = dateInputValue(
        new Date(order.completedAt ?? order.updatedAt),
      );
      byDay.set(key, [...(byDay.get(key) ?? []), order]);
    });
    for (
      const cursor = new Date(start);
      cursor <= end;
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const key = dateInputValue(cursor);
      const dailyOrders = byDay.get(key) ?? [];
      const dailyReturns = handledReturns.filter(
        (request) => dateInputValue(new Date(request.updatedAt)) === key,
      ).length;
      const dailySales = dailyOrders
        .filter((order) =>
          ["COMPLETED", "CANCELED_BY_DAMAGED"].includes(order.status),
        )
        .reduce((sum, order) => sum + salesValue(order), 0);
      days.push({
        date: new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }).format(cursor),
        orders: dailyOrders.length,
        revenue: dailySales,
        returns: dailyReturns,
      });
    }
    return days;
  }, [revenueOrders, handledReturns, range.fromDate, range.toDate]);

  const kpis = [
    {
      label: "Doanh thu bán hàng",
      value: money(grossSales),
      note: `${salesOrders.length} đơn ghi nhận doanh thu`,
      icon: Banknote,
      tone: "emerald",
    },
    {
      label: "Đơn đổi trả",
      value: handledReturns.length.toLocaleString("vi-VN"),
      note: `${completedReturns.length} phiếu đã hoàn tất`,
      icon: RotateCcw,
      tone: "rose",
    },
    {
      label: "Đơn phụ trách",
      value: orders.length.toLocaleString("vi-VN"),
      note: `${cancelled.length} đơn bị hủy`,
      icon: ReceiptText,
      tone: "blue",
    },
    {
      label: "Sản phẩm đã bán",
      value: itemsSold.toLocaleString("vi-VN"),
      note: `TB ${money(averageOrder)}/đơn`,
      icon: PackageCheck,
      tone: "violet",
    },
    {
      label: "Tỷ lệ hoàn thành",
      value: `${completionRate.toFixed(1)}%`,
      note: `${completed.length}/${orders.length} đơn`,
      icon: CircleGauge,
      tone: "amber",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-3">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 sm:flex-row sm:items-end">
        <div>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-indigo-700">
            Hiệu suất cá nhân
          </span>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">
            Xin chào, {staffName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi các đơn hàng do bạn tạo hoặc phụ trách.
          </p>
        </div>
        <div className="flex flex-wrap rounded-xl border bg-muted/40 p-1">
          {(["TODAY", "WEEK", "MONTH"] as Period[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant="ghost"
              onClick={() => setPeriod(key)}
              className={cn(
                "h-8 rounded-lg text-xs",
                period === key && "bg-background shadow-sm",
              )}
            >
              {PERIOD_LABEL[key]}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPeriod("CUSTOM")}
            className={cn(
              "h-8 rounded-lg text-xs",
              period === "CUSTOM" && "bg-background shadow-sm",
            )}
          >
            <CalendarDays className="mr-1 size-3.5" />
            Tùy chọn
          </Button>
        </div>
      </div>

      {period === "CUSTOM" && (
        <Card className="border-indigo-100 bg-indigo-50/30">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-semibold">
                Từ ngày
                <Input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </label>
              <label className="space-y-1.5 text-xs font-semibold">
                Đến ngày
                <Input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={today}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </label>
            </div>
            <Button
              disabled={!customFrom || !customTo || customFrom > customTo}
              onClick={() =>
                setAppliedCustom({ from: customFrom, to: customTo })
              }
            >
              Áp dụng khoảng thời gian
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(({ label, value, note, icon: Icon, tone }) => (
          <Card key={label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-medium">
                    {dashboardLoading ? "—" : value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dashboardLoading ? "Đang tải dữ liệu..." : note}
                  </p>
                </div>
                <div
                  className={cn("rounded-xl p-2.5", {
                    "bg-emerald-50 text-emerald-600": tone === "emerald",
                    "bg-blue-50 text-blue-600": tone === "blue",
                    "bg-violet-50 text-violet-600": tone === "violet",
                    "bg-amber-50 text-amber-600": tone === "amber",
                    "bg-rose-50 text-rose-600": tone === "rose",
                  })}
                >
                  <Icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-5 text-indigo-600" />
            Biểu đồ hiệu suất theo ngày
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Doanh thu, số đơn bán và yêu cầu đổi trả theo ngày.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            {dashboardLoading ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
                Đang tải biểu đồ...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 15, right: 12, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    minTickGap={22}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tickLine={false}
                    axisLine={false}
                    width={58}
                    fontSize={10}
                    tickFormatter={(value) =>
                      value >= 1_000_000
                        ? `${(value / 1_000_000).toFixed(1)}tr`
                        : value >= 1_000
                          ? `${Math.round(value / 1_000)}k`
                          : String(value)
                    }
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                    fontSize={10}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "Số đơn" || name === "Đơn đổi trả"
                        ? `${value} đơn`
                        : money(Number(value)),
                      name,
                    ]}
                    labelFormatter={(label) => `Ngày ${label}`}
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#e5e7eb",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Line
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu bán hàng"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="returns"
                    name="Đơn đổi trả"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    name="Số đơn"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="size-5 text-orange-600" />
              Đổi trả do bạn xử lý
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Tính theo nhân viên xử lý và khoảng thời gian đang chọn.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/returns">
              Quản lý đổi trả <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Đã tiếp nhận",
                value: handledReturns.length,
                detail: "yêu cầu",
                icon: RotateCcw,
                color: "text-blue-600 bg-blue-50",
              },
              {
                label: "Hoàn tiền",
                value: refundRequests.length,
                detail: "yêu cầu",
                icon: Banknote,
                color: "text-rose-600 bg-rose-50",
              },
              {
                label: "Đổi sản phẩm",
                value: exchangeRequests.length,
                detail: "yêu cầu",
                icon: ArrowLeftRight,
                color: "text-violet-600 bg-violet-50",
              },
              {
                label: "Hoàn tất / từ chối",
                value: `${completedReturns.length} / ${rejectedReturns.length}`,
                detail: "yêu cầu",
                icon: CheckCircle2,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                label: "Chờ xử lý",
                value: pendingReturns.length,
                detail: "yêu cầu",
                icon: ReceiptText,
                color: "text-orange-600 bg-orange-50",
              },
            ].map(({ label, value, detail, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border p-4">
                <div className={cn("mb-3 inline-flex rounded-lg p-2", color)}>
                  <Icon className="size-4" />
                </div>
                <p className="text-xs font-semibold text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-xl font-medium">
                  {returnsLoading ? "—" : value}
                </p>
                <p className="text-[11px] text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>

          {handledReturns.length > 0 && (
            <div className="mt-5 border-t pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Xử lý gần đây
              </p>
              <div className="grid gap-2 lg:grid-cols-2">
                {handledReturns.slice(0, 4).map((request) => (
                  <Link
                    key={request.returnId}
                    to="/returns"
                    className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        request.returnType === "REFUND"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-violet-50 text-violet-600",
                      )}
                    >
                      {request.returnType === "REFUND" ? (
                        <Banknote className="size-4" />
                      ) : (
                        <ArrowLeftRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        #{request.orderCode} · {request.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {request.returnType === "REFUND"
                          ? "Hoàn tiền"
                          : "Đổi sản phẩm"}{" "}
                        · {dateTime(request.updatedAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">
                        {request.status === "COMPLETED"
                          ? "Hoàn tất"
                          : request.status === "APPROVED"
                            ? "Đã duyệt"
                            : request.status === "REJECTED"
                              ? "Từ chối"
                              : "Chờ xử lý"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tình trạng công việc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Chưa có đơn hàng trong kỳ này.
              </p>
            ) : (
              statusRows.map((row) => {
                const percent = orders.length
                  ? (row.count / orders.length) * 100
                  : 0;
                return (
                  <div key={row.status} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{row.label}</span>
                      <span>
                        {row.count} đơn · {percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", row.color)}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
            <div className="grid grid-cols-3 gap-2 border-t pt-4 text-center text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <Store className="mx-auto mb-1 size-4" />
                <b>{posCount}</b>
                <br />
                Tại quầy
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <Truck className="mx-auto mb-1 size-4" />
                <b>{posShipCount}</b>
                <br />
                Tại quầy có giao hàng
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <ShoppingBag className="mx-auto mb-1 size-4" />
                <b>{onlineCount}</b>
                <br />
                Trực tuyến
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Đơn gần đây</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">
                Xem tất cả <ChevronRight className="ml-1 size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Chưa có giao dịch trong kỳ này.
              </p>
            ) : (
              <div className="divide-y">
                {recent.map((order) => {
                  const status = STATUS[order.status];
                  return (
                    <Link
                      key={order.orderId}
                      to={`/orders/${order.orderId}`}
                      className="flex items-center gap-3 py-3 hover:bg-muted/30"
                    >
                      <div
                        className={cn(
                          "rounded-full p-2",
                          order.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-600"
                            : order.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-blue-50 text-blue-600",
                        )}
                      >
                        {order.status === "COMPLETED" ? (
                          <CheckCircle2 className="size-4" />
                        ) : order.status === "CANCELLED" ? (
                          <XCircle className="size-4" />
                        ) : (
                          <ReceiptText className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          #{order.orderCode} ·{" "}
                          {order.customerName || "Khách lẻ"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dateTime(order.createdAt)} · {order.totalItems ?? 0}{" "}
                          sản phẩm
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {money(orderValue(order))}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {status?.label ?? order.status}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Button asChild variant="outline" className="h-12 justify-between">
          <Link to="/pos">
            <span className="flex items-center">
              <Store className="mr-2 size-4" />
              Mở bán hàng tại quầy
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-between">
          <Link to="/orders">
            <span className="flex items-center">
              <ReceiptText className="mr-2 size-4" />
              Quản lý hóa đơn
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-between">
          <Link to="/customers">
            <span className="flex items-center">
              <ShoppingBag className="mr-2 size-4" />
              Tra cứu khách hàng
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-between">
          <Link to="/returns">
            <span className="flex items-center">
              <RotateCcw className="mr-2 size-4" />
              Xử lý đổi trả
            </span>
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
