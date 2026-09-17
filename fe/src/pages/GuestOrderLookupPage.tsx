import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  PackageSearch,
  Phone,
  Search,
  Truck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import orderApi, {
  ORDER_STATUS_LABEL,
  type OrderResponse,
  type OrderStatus,
} from "@/api/orderApi";
import paymentApi, { saveGuestPaymentAccess } from "@/api/paymentApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import OrderInfoCards from "@/components/order/OrderInfoCards";
import OrderItemsList from "@/components/order/OrderItemsList";
import OrderReturnHistory from "@/components/order/OrderReturnHistory";
import OrderShopeeStepper from "@/components/order/OrderShopeeStepper";
import OrderTimeline from "@/components/order/OrderTimeline";
import OrderTotalsSummary from "@/components/order/OrderTotalsSummary";

const STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT: "bg-gray-500 text-white border-transparent",
  WAITING_PAYMENT: "bg-amber-500 text-white border-transparent",
  PENDING: "bg-yellow-500 text-white border-transparent",
  WAITING_STOCK: "bg-yellow-500 text-white border-transparent",
  CONFIRMED: "bg-blue-500 text-white border-transparent",
  SHIPPING: "bg-indigo-500 text-white border-transparent",
  RETURNING: "bg-purple-500 text-white border-transparent",
  RETURNED_TO_SHOP: "bg-emerald-500 text-white border-transparent",
  CANCELED_BY_DAMAGED: "bg-zinc-500 text-white border-transparent",
  FAILED_DELIVERY: "bg-rose-500 text-white border-transparent",
  COMPLETED: "bg-emerald-500 text-white border-transparent",
  CANCELLED: "bg-red-500 text-white border-transparent",
  REFUNDED: "bg-orange-500 text-white border-transparent",
};

const GUEST_ORDER_STEPS = [
  { label: "Chờ xác nhận", status: "PENDING" as OrderStatus, icon: Clock },
  {
    label: "Đã xác nhận",
    status: "CONFIRMED" as OrderStatus,
    icon: CheckCircle,
  },
  { label: "Đang giao hàng", status: "SHIPPING" as OrderStatus, icon: Truck },
  { label: "Hoàn thành", status: "COMPLETED" as OrderStatus, icon: Check },
];

export default function GuestOrderLookupPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialLookup = (location.state ?? {}) as {
    orderCode?: string;
    phone?: string;
  };
  const [orderCode, setOrderCode] = useState(initialLookup.orderCode ?? "");
  const [phone, setPhone] = useState(initialLookup.phone ?? "");
  const [order, setOrder] = useState<OrderResponse | null>(null);

  const lookup = useMutation({
    mutationFn: orderApi.lookupGuest,
    onSuccess: (result) => {
      setOrder(result);
      toast.success("Đã tìm thấy đơn hàng");
    },
    onError: (error: { apiMessage?: string }) => {
      setOrder(null);
      toast.error(
        error.apiMessage ??
          "Không tìm thấy đơn hàng phù hợp với thông tin đã nhập",
      );
    },
  });

  const startPayment = useMutation({
    mutationFn: paymentApi.initGuest,
    onSuccess: (result, access) => {
      saveGuestPaymentAccess(access);
      navigate(`/payment/vnpay/${access.orderId}`, {
        state: {
          paymentUrl: result.paymentUrl,
          expireAt: result.expireAt,
          orderCode: access.orderCode,
          guestPhone: access.phone,
        },
      });
    },
    onError: (error: { apiMessage?: string }) => {
      toast.error(
        error.apiMessage ?? "Không thể khởi tạo giao dịch thanh toán VNPay",
      );
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = orderCode.trim().toUpperCase();
    const normalizedPhone = phone.trim().replace(/[\s.-]/g, "");

    if (!normalizedCode) {
      toast.error("Vui lòng nhập mã đơn hàng");
      return;
    }
    if (!/^(0|\+84)[0-9]{9,10}$/.test(normalizedPhone)) {
      toast.error("Số điện thoại người đặt không đúng định dạng");
      return;
    }

    lookup.mutate({ orderCode: normalizedCode, phone: normalizedPhone });
  };

  const handleOnlinePayment = () => {
    if (!order) return;
    const access = {
      orderId: order.orderId,
      orderCode: order.orderCode,
      phone: (order.guestPhone || phone).trim().replace(/[\s.-]/g, ""),
    };
    saveGuestPaymentAccess(access);
    startPayment.mutate(access);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <section className="overflow-hidden rounded-[28px] bg-slate-950 px-6 py-7 text-white sm:px-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-orange-300">
            <PackageSearch className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-orange-300">
              Dành cho khách vãng lai
            </p>
            <h1 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">
              Tra cứu đơn hàng
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Nhập mã đơn hàng và số điện thoại người đặt để xem trạng thái giao
              hàng. Thông tin phải khớp với lúc đặt hàng.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form
            onSubmit={handleSubmit}
            className="grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="lookup-order-code"
                className="text-sm font-medium"
              >
                Mã đơn hàng
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lookup-order-code"
                  value={orderCode}
                  onChange={(event) => setOrderCode(event.target.value)}
                  placeholder="Ví dụ: ORD-ABC123"
                  autoComplete="off"
                  maxLength={50}
                  className="pl-9 uppercase"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lookup-phone" className="text-sm font-medium">
                Số điện thoại người đặt
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lookup-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0912345678"
                  maxLength={15}
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={lookup.isPending}
              className="md:px-6"
            >
              {lookup.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <PackageSearch className="mr-2 size-4" />
              )}
              Tra cứu
            </Button>
          </form>
        </CardContent>
      </Card>

      {order && (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kết quả tra cứu
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900">
                Chi tiết đơn hàng: #{order.orderCode}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Ngày đặt:{" "}
                {new Date(
                  order.createdAt || order.orderDate || "",
                ).toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {order.orderStatus === "WAITING_PAYMENT" &&
                order.paymentMethod === "VNPAY" && (
                  <Button
                    type="button"
                    onClick={handleOnlinePayment}
                    disabled={startPayment.isPending}
                    className="gap-2"
                  >
                    {startPayment.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4" />
                    )}
                    Thanh toán VNPay
                  </Button>
                )}
              <Badge
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLOR[order.orderStatus]}`}
              >
                {ORDER_STATUS_LABEL[order.orderStatus] || order.orderStatus}
              </Badge>
            </div>
          </div>

          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
                <UserRound className="size-4" /> Người đặt hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-3">
              <span>
                <strong>Họ tên:</strong> {order.guestName || "—"}
              </span>
              <span>
                <strong>Điện thoại:</strong> {order.guestPhone || "—"}
              </span>
              <span>
                <strong>Email:</strong> {order.guestEmail || "—"}
              </span>
            </CardContent>
          </Card>

          <OrderShopeeStepper order={order} baseSteps={GUEST_ORDER_STEPS} />
          <OrderInfoCards order={order} />
          <OrderItemsList order={order} readOnly />
          <OrderReturnHistory
            returns={order.returnRequests ?? []}
            completedRefundAmount={order.completedRefundAmount ?? 0}
          />
          <OrderTotalsSummary order={order} />
          <OrderTimeline order={order} />
        </div>
      )}
    </div>
  );
}
