import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Check,
  FileText,
  Truck,
  Printer,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOrderDetail, useUpdateOrderStatus } from "@/hooks/useOrder";
import { toast } from "sonner";
import {
  orderNeedsStockReplenishment,
  orderStatusRequiresEvidence,
  type OrderStatus,
} from "@/api/orderApi";

import OrderStatusController from "@/components/order/OrderStatusController";
import OrderInfoCards from "@/components/order/OrderInfoCards";
import OrderItemsList from "@/components/order/OrderItemsList";
import OrderReturnHistory from "@/components/order/OrderReturnHistory";
import OrderTimeline from "@/components/order/OrderTimeline";
import OrderShopeeStepper from "@/components/order/OrderShopeeStepper";
import OrderEvidenceImageUpload from "@/components/order/OrderEvidenceImageUpload";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InvoicePrintModal from "@/components/pos/InvoicePrintModal";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const getApiErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null && "apiMessage" in error) {
    const apiMessage = (error as { apiMessage?: unknown }).apiMessage;
    if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage;
  }
  return "Không thể cập nhật trạng thái";
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = id ? Number(id) : null;

  const { data: order, isLoading } = useOrderDetail(orderId);
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateOrderStatus();

  const [transitionTarget, setTransitionTarget] = useState<{
    status: OrderStatus;
    note?: string;
  } | null>(null);
  const [transitionNote, setTransitionNote] = useState("");
  const [shouldPrintInvoice, setShouldPrintInvoice] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [showDamagedDialog, setShowDamagedDialog] = useState(false);
  const [damagedQtys, setDamagedQtys] = useState<Record<number, number>>({});
  const [damagedNote, setDamagedNote] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<File[]>([]);

  if (!orderId) {
    return (
      <div className="p-6 text-center text-red-500">
        Mã đơn hàng không hợp lệ.
      </div>
    );
  }

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
      <div className="p-6 text-center space-y-4">
        <p className="text-muted-foreground">
          Không tìm thấy đơn hàng #ID {orderId}
        </p>
        <Button onClick={() => navigate("/orders")}>Quay lại danh sách</Button>
      </div>
    );
  }

  const getStatusLabel = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      WAITING_PAYMENT: "Chờ thanh toán",
      DRAFT: "Chờ thanh toán tại quầy",
      PENDING: "Chờ xác nhận",
      WAITING_STOCK: "Chờ bổ sung hàng",
      CONFIRMED: "Đã xác nhận",
      PROCESSING: "Đang xử lý",
      SHIPPING: "Đang giao hàng",
      RETURNING: "Đang chuyển hoàn",
      RETURNED_TO_SHOP: "Nhận lại hàng hoàn",
      CANCELED_BY_DAMAGED: "Hủy do hỏng hàng",
      FAILED_DELIVERY: "Giao thất bại",
      COMPLETED: "Đã hoàn thành",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      WAITING_PAYMENT: "bg-amber-500 text-white border-transparent",
      DRAFT: "bg-gray-500 text-white border-transparent",
      PENDING: "bg-yellow-500 text-white border-transparent",
      WAITING_STOCK: "bg-orange-500 text-white border-transparent",
      CONFIRMED: "bg-blue-500 text-white border-transparent",
      PROCESSING: "bg-cyan-500 text-white border-transparent",
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

  const handleStatusTransition = (nextStatus: OrderStatus, note?: string) => {
    if (nextStatus === "CANCELED_BY_DAMAGED") {

      const defaults: Record<number, number> = {};
      order.items.forEach((item) => {
        defaults[item.variantId] = item.quantity;
      });
      setDamagedQtys(defaults);
      setDamagedNote(note || "Hủy đơn hàng do sản phẩm bị hỏng trong quá trình vận chuyển.");
      setEvidenceImages([]);
      setShowDamagedDialog(true);
      return;
    }
    setEvidenceImages([]);
    setTransitionTarget({ status: nextStatus, note });
    setTransitionNote(note || "");
  };

  const confirmDamagedSubmit = () => {
    if (evidenceImages.length === 0) {
      toast.error("Vui lòng thêm ít nhất một ảnh xác nhận hàng hỏng");
      return;
    }
    const damagedItems = order.items.map((item) => ({
      variantId: item.variantId,
      damagedQuantity: Math.max(0, Math.min(damagedQtys[item.variantId] ?? item.quantity, item.quantity)),
    }));
    updateStatus(
      {
        id: orderId,
        payload: {
          status: "CANCELED_BY_DAMAGED",
          note: damagedNote,
          damagedItems,
          images: evidenceImages,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã xác nhận hủy đơn do hỏng hàng và cập nhật tồn kho");
          setShowDamagedDialog(false);
          setEvidenceImages([]);
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const confirmStatusTransition = () => {
    if (!transitionTarget) return;
    const { status } = transitionTarget;
    if (orderStatusRequiresEvidence(status) && evidenceImages.length === 0) {
      toast.error("Trạng thái này bắt buộc phải có ít nhất một ảnh xác nhận");
      return;
    }
    updateStatus(
      {
        id: orderId,
        payload: { status, note: transitionNote, images: evidenceImages },
      },
      {
        onSuccess: (updatedOrder) => {
          if (updatedOrder.status !== status) {
            toast.warning(
              `Không đủ tồn kho để ${getStatusLabel(status).toLowerCase()}. Trạng thái thực tế: ${getStatusLabel(updatedOrder.status)}.`,
            );
          } else {
            toast.success(
              `Cập nhật đơn hàng thành công: ${getStatusLabel(updatedOrder.status)}`,
            );
          }
          setTransitionTarget(null);
          setTransitionNote("");
          setEvidenceImages([]);
          if (shouldPrintInvoice) {
            setShowPrintModal(true);
          }
          setShouldPrintInvoice(false);
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const isDeliveryOrder = !!(
    order.orderType === "ONLINE" ||
    order.orderType === "POS_SHIP" ||
    (order.shippingAddress &&
      order.shippingAddress !== "Mua trực tiếp tại quầy" &&
      order.shippingAddress !== "Mua trực tiếp tại cửa hàng (POS)")
  );

  const isPosShipOrder = order.orderType === "POS_SHIP";
  const needsStockReplenishment = orderNeedsStockReplenishment(order);

  const isOrderFinished = ["COMPLETED", "CANCELLED", "REFUNDED", "RETURNED_TO_SHOP", "CANCELED_BY_DAMAGED"].includes(
    order.status,
  ) && !(order.status === "RETURNED_TO_SHOP" && order.paymentStatus === "PAID");

  const baseSteps = isDeliveryOrder
    ? isPosShipOrder
      ? [
        {
          label: "Đơn chờ",
          status: "DRAFT" as OrderStatus,
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
      : order.paymentMethod === "COD"
        ? [
          {
            label: "Chờ xác nhận",
            status: "PENDING" as OrderStatus,
            icon: Clock,
          },
          ...((order.status === "WAITING_STOCK" || needsStockReplenishment)
            ? [{
                label: "Chờ bổ sung hàng",
                status: "WAITING_STOCK" as OrderStatus,
                icon: Clock,
              }]
            : []),
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
        label: "Hoàn thành",
        status: "COMPLETED" as OrderStatus,
        icon: CheckCircle,
      },
    ];
  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      {}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center flex-1 gap-3  max-sm:items-start max-sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/orders")}
            className="rounded-full h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-between flex-1 gap-2 max-sm:flex-col max-sm:items-start">
            <div className="flex items-start gap-2 max-sm:flex-col">
              <div className="grid gap-1">
                <h1 className="text-lg font-bold text-gray-900">
                  Chi tiết đơn hàng: #{order.orderCode}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Ngày đặt hàng:{" "}
                  {new Date(order.createdAt).toLocaleString("vi-VN")}
                </p>

              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant="outline" className="text-xs font-semibold">
                  {order.orderType === "POS"
                    ? "Tại quầy"
                    : order.orderType === "POS_SHIP"
                      ? "Tại quầy - Giao hàng"
                      : "Trực tuyến"}
                </Badge>
                <Badge
                  className={`text-xs px-3 py-1 font-medium rounded-full ${getStatusColor(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
            </div>
            {order.status !== "CANCELLED" && (
              <Button
                onClick={() => setShowPrintModal(true)}
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold"
              >
                <Printer size={14} />
                In hóa đơn
              </Button>
            )}
          </div>
        </div>
      </div>

      {}
      <OrderShopeeStepper order={order} baseSteps={baseSteps} />

      {}
      <OrderStatusController
        order={order}
        isUpdating={isUpdating}
        onStatusTransition={handleStatusTransition}
        baseSteps={baseSteps}
        isDeliveryOrder={isDeliveryOrder}
        isOrderFinished={isOrderFinished}
      />

      {}
      <OrderInfoCards order={order} />

      {}
      <OrderItemsList order={order} />

      <OrderReturnHistory
        returns={order.returnRequests ?? []}
        completedRefundAmount={order.completedRefundAmount ?? 0}
      />

      {}
      <div className="flex justify-end">
        <Card className="border border-gray-100 bg-gray-50/20 w-full max-w-md">
          <CardContent className="p-4 space-y-3 text-xs text-gray-600">
            {(() => {
              const originalProductTotal = order.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
              );
              const promotionDiscount = order.items.reduce((sum, item) => {
                if (item.salePrice != null && item.salePrice < item.price) {
                  return sum + (item.price - item.salePrice) * item.quantity;
                }
                return sum;
              }, 0);

              return (
                <>
            <div className="flex justify-between">
              <span>Tổng tiền hàng (Giá gốc):</span>
              <span className="font-semibold text-gray-900">
                {originalProductTotal.toLocaleString("vi-VN")}đ
              </span>
            </div>
            {promotionDiscount > 0 && (
              <div className="flex justify-between">
                <span>Giảm giá sản phẩm:</span>
                <span className="font-semibold text-emerald-600">
                  -{promotionDiscount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}
            {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span>
                {order.couponCode
                  ? `Phiếu giảm giá (${order.couponCode}):`
                  : "Giảm giá đợt khuyến mãi:"}
              </span>
              <span className="font-semibold text-red-600">
                -{order.discountAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            )}
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold text-gray-900">
                +{order.shippingFee.toLocaleString("vi-VN")}đ
              </span>
            </div>
            {(order.completedRefundAmount ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>Tiền đã hoàn cho khách:</span>
                <span className="font-semibold text-orange-700">
                  -{order.completedRefundAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>Tổng số tiền thanh toán:</span>
              <span className="text-lg text-blue-600">
                {order.totalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {}
      <OrderTimeline order={order} getStatusLabel={getStatusLabel} />

      {}
      <Dialog
        open={transitionTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionTarget(null);
            setTransitionNote("");
            setEvidenceImages([]);
            setShouldPrintInvoice(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang{" "}
              <strong className="text-gray-950 font-semibold">
                {transitionTarget
                  ? getStatusLabel(transitionTarget.status)
                  : ""}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="transition-note" className="text-xs font-semibold text-gray-700">
              Ghi chú cho trạng thái mới
            </Label>
            <Textarea
              id="transition-note"
              placeholder="Nhập ghi chú cập nhật trạng thái đơn hàng..."
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              className="text-xs focus-visible:ring-blue-500"
              rows={3}
            />
            <OrderEvidenceImageUpload
              files={evidenceImages}
              onChange={setEvidenceImages}
              required={
                transitionTarget !== null &&
                orderStatusRequiresEvidence(transitionTarget.status)
              }
              disabled={isUpdating}
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTransitionTarget(null);
                setTransitionNote("");
                setEvidenceImages([]);
                setShouldPrintInvoice(false);
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={confirmStatusTransition}
              disabled={
                isUpdating ||
                (transitionTarget !== null &&
                  orderStatusRequiresEvidence(transitionTarget.status) &&
                  evidenceImages.length === 0)
              }
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {}
      {showPrintModal && order && (
        <InvoicePrintModal
          order={order}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {}
      <Dialog
        open={showDamagedDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDamagedDialog(false);
            setEvidenceImages([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-800">
              <AlertTriangle size={16} className="text-orange-500" />
              Khai báo hàng hỏng trong đơn
            </DialogTitle>
            <DialogDescription>
              Nhập số lượng <strong>thực sự bị hỏng</strong> cho từng sản phẩm.
              Phần còn lại (nguyên vẹn) sẽ được <strong>hoàn lại tồn kho</strong> tự động.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-72 overflow-y-auto py-1 pr-1">
            {order.items.map((item) => {
              const damaged = damagedQtys[item.variantId] ?? item.quantity;
              const intact = item.quantity - Math.max(0, Math.min(damaged, item.quantity));
              return (
                <div key={item.variantId} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.color} / {item.size} · Đặt: {item.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 font-medium">Số hỏng:</label>
                      <Input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={damaged}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(Number(e.target.value), item.quantity));
                          setDamagedQtys((prev) => ({ ...prev, [item.variantId]: v }));
                        }}
                        className="h-7 w-16 text-sm text-center font-bold border-orange-200 focus-visible:ring-orange-300"
                      />
                    </div>
                    <p className={`text-xs font-semibold ${intact > 0 ? "text-emerald-600" : "text-zinc-400"}`}>
                      {intact > 0 ? `+${intact} hoàn kho` : "Không hoàn kho"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-gray-700">Ghi chú lý do hỏng hàng</label>
            <Textarea
              placeholder="Ví dụ: Hàng bị vỡ do đóng gói không đúng cách, ngập nước trong quá trình vận chuyển..."
              value={damagedNote}
              onChange={(e) => setDamagedNote(e.target.value)}
              className="text-xs"
              rows={2}
            />
          </div>

          <OrderEvidenceImageUpload
            files={evidenceImages}
            onChange={setEvidenceImages}
            required
            disabled={isUpdating}
          />

          <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDamagedDialog(false);
                setEvidenceImages([]);
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              className="bg-zinc-700 hover:bg-zinc-800 text-white font-semibold"
              onClick={confirmDamagedSubmit}
              disabled={isUpdating || evidenceImages.length === 0}
            >
              Xác nhận hủy & cập nhật kho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
