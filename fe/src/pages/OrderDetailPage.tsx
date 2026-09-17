import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Clock,
  Truck,
  CheckCircle,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCancelOrder, useOrder, ORDER_KEYS } from "@/hooks/useOrder";
import { type OrderStatus, ORDER_STATUS_LABEL } from "@/api/orderApi";
import paymentApi from "@/api/paymentApi";

import OrderShopeeStepper from "@/components/order/OrderShopeeStepper";
import OrderInfoCards from "@/components/order/OrderInfoCards";
import OrderItemsList from "@/components/order/OrderItemsList";
import OrderReturnHistory from "@/components/order/OrderReturnHistory";
import OrderTimeline from "@/components/order/OrderTimeline";
import OrderTotalsSummary from "@/components/order/OrderTotalsSummary";

const CANCELLABLE: OrderStatus[] = [
  "PENDING",
  "WAITING_STOCK",
  "WAITING_PAYMENT",
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useOrder(orderId);
  const { mutate: cancel, isPending: cancelling } = useCancelOrder();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { mutate: payNow, isPending: paying } = useMutation({
    mutationFn: () => paymentApi.init(orderId),
    onSuccess: (res) => {
      if (res.paymentUrl) {
        navigate(`/payment/vnpay/${orderId}`, {
          state: {
            paymentUrl: res.paymentUrl,
            expireAt: res.expireAt,
            orderCode: res.orderCode,
          },
        });
      }
    },
    onError: (err: { apiMessage?: string }) =>
      toast.error(err.apiMessage ?? "Không thể khởi tạo thanh toán"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">
          Đang tải thông tin đơn hàng...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto py-32">
        <p className="text-muted-foreground">Không tìm thấy đơn hàng.</p>
        <Link to="/orders">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const canCancel = CANCELLABLE.includes(order.orderStatus);
  const canPay =
    order.orderStatus === "WAITING_PAYMENT" && order.paymentMethod === "VNPAY";
  const remainingReturnQuantity = order.orderDetails.reduce(
    (total, detail) =>
      total +
      (detail.remainingReturnQuantity ??
        Math.max(0, detail.quantity - (detail.returnedQuantity ?? 0))),
    0,
  );
  const canReturn =
    order.canReturn ??
    (order.orderStatus === "COMPLETED" && remainingReturnQuantity > 0);

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABEL[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      WAITING_PAYMENT: "bg-amber-500 text-white border-transparent",
      PENDING: "bg-yellow-500 text-white border-transparent",
      WAITING_STOCK: "bg-yellow-500 text-white border-transparent",
      DRAFT: "bg-gray-500 text-white border-transparent",
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
    return map[status] || "bg-gray-500 text-white";
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cancel(
      { orderId, reason: cancelReason },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          setCancelReason("");
          queryClient.invalidateQueries({
            queryKey: ORDER_KEYS.detail(orderId),
          });
        },
      },
    );
  };

  const isDeliveryOrder =
    order.orderType === "ONLINE" ||
    order.orderType === "POS_SHIP" ||
    (order.receiverAddress &&
      order.receiverAddress !== "Mua trực tiếp tại quầy" &&
      order.receiverAddress !== "Mua trực tiếp tại cửa hàng (POS)");

  const isPosShipOrder = order.orderType === "POS_SHIP";

  const baseSteps = isDeliveryOrder
    ? isPosShipOrder
      ? [
        { label: "Đơn chờ", status: "DRAFT" as OrderStatus, icon: Clock },
        {
          label: "Đã xác nhận",
          status: "CONFIRMED" as OrderStatus,
          icon: CheckCircle,
        },
        {
          label: "Đang giao hàng",
          status: "SHIPPING" as OrderStatus,
          icon: Truck,
        },
        {
          label: "Hoàn thành",
          status: "COMPLETED" as OrderStatus,
          icon: Check,
        },
      ]
      : order.paymentMethod === "COD"
        ? [
          {
            label: "Chờ xác nhận",
            status: "PENDING" as OrderStatus,
            icon: Clock,
          },
          {
            label: "Đã xác nhận",
            status: "CONFIRMED" as OrderStatus,
            icon: CheckCircle,
          },
          {
            label: "Đang giao hàng",
            status: "SHIPPING" as OrderStatus,
            icon: Truck,
          },
          {
            label: "Hoàn thành",
            status: "COMPLETED" as OrderStatus,
            icon: Check,
          },
        ]
        : [
          {
            label: "Chờ thanh toán",
            status: "WAITING_PAYMENT" as OrderStatus,
            icon: Clock,
          },
          {
            label: "Đã xác nhận",
            status: "CONFIRMED" as OrderStatus,
            icon: CheckCircle,
          },
          {
            label: "Đang giao hàng",
            status: "SHIPPING" as OrderStatus,
            icon: Truck,
          },
          {
            label: "Hoàn thành",
            status: "COMPLETED" as OrderStatus,
            icon: Check,
          },
        ]
    : [
      {
        label: "Tạo đơn chờ",
        status: "DRAFT" as OrderStatus,
        icon: FileText,
      },
      {
        label: "Chờ thanh toán",
        status: "WAITING_PAYMENT" as OrderStatus,
        icon: Clock,
      },
      {
        label: "Hoàn thành",
        status: "COMPLETED" as OrderStatus,
        icon: CheckCircle,
      },
    ];

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6 py-8">
      { }
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/orders">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">
                Chi tiết đơn hàng: #{order.orderCode}
              </h1>
              <Badge
                variant="outline"
                className="text-xs uppercase font-semibold"
              >
                {order.orderType === "POS"
                  ? "Tại quầy"
                  : order.orderType === "POS_SHIP"
                    ? "Tại quầy - Giao hàng"
                    : "Trực tuyến"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ngày đặt hàng:{" "}
              {new Date(
                order.createdAt || order.orderDate || "",
              ).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.orderStatus === "COMPLETED" &&
            canReturn &&
            order.returnDeadline && (
              <span className="text-xs font-medium text-amber-600">
                Hạn trả:{" "}
                {new Date(order.returnDeadline).toLocaleString("vi-VN")}
              </span>
            )}
          {canPay && (
            <Button
              onClick={() => payNow()}
              disabled={paying}
              size="sm"
              className="h-8 text-xs font-semibold"
            >
              {paying && <Loader2 className="mr-2 size-4 animate-spin" />}
              Thanh toán VNPay
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              disabled={cancelling}
              onClick={() => setShowCancelDialog(true)}
            >
              Huỷ đơn
            </Button>
          )}
          {canReturn && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => navigate(`/orders/${order.orderId}/return`)}
            >
              Đổi hàng lỗi
            </Button>
          )}
          {order.orderStatus === "COMPLETED" && !canReturn && (
            <span className="text-xs font-medium text-amber-600">
              {remainingReturnQuantity <= 0
                ? "Đã yêu cầu đổi hết"
                : "Đã hết hạn đổi hàng 7 ngày"}
            </span>
          )}
          <Badge
            className={`text-xs px-3 py-1 font-medium rounded-full ${getStatusColor(order.orderStatus)}`}
          >
            {getStatusLabel(order.orderStatus)}
          </Badge>
        </div>
      </div>

      { }
      <OrderShopeeStepper order={order} baseSteps={baseSteps} />

      { }
      <OrderInfoCards order={order} />

      { }
      <OrderItemsList order={order} />

      <OrderReturnHistory
        returns={order.returnRequests ?? []}
        completedRefundAmount={order.completedRefundAmount ?? 0}
      />

      { }
      <OrderTotalsSummary order={order} />

      { }
      <OrderTimeline order={order} />

      { }
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCancelSubmit}>
            <DialogHeader>
              <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn hủy đơn hàng #{order.orderCode} không? Vui
                lòng cho biết lý do hủy đơn (không bắt buộc).
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy đơn..."
                className="w-full min-h-[80px] p-2 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white text-gray-900"
              />
            </div>

            <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                }}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={cancelling}
              >
                {cancelling && <Loader2 className="mr-2 size-3 animate-spin" />}
                Xác nhận hủy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
