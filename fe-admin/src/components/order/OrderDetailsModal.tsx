import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "@tanstack/react-form";
import {
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  Truck,
  Check,
  AlertTriangle,
  FileText,
  ShoppingBag,
  ArrowRight,
  Tag,
} from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useOrderDetail, useUpdateOrderStatus } from "@/hooks/useOrder";
import { toast } from "sonner";
import {
  orderNeedsStockReplenishment,
  type OrderStatus,
  type PaymentMethod,
} from "@/api/orderApi";
import OrderHeader from "./OrderHeader";
import CustomerInfo from "./CustomerInfo";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import InvoicePrintModal from "../pos/InvoicePrintModal";

interface OrderDetailsModalProps {
  orderId: number | null;
  onClose: () => void;
}

export default function OrderDetailsModal({
  orderId,
  onClose,
}: OrderDetailsModalProps) {
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
  const [showCancelForm, setShowCancelForm] = useState(false);

  const isDeliveryOrder = order
    ? order.orderType === "ONLINE" ||
      order.orderType === "POS_SHIP" ||
      (order.shippingAddress &&
        order.shippingAddress !== "Mua trực tiếp tại quầy" &&
        order.shippingAddress !== "Mua trực tiếp tại cửa hàng (POS)")
    : false;
  const needsStockReplenishment = order
    ? orderNeedsStockReplenishment(order)
    : false;

  const getPaymentLabel = (payment: PaymentMethod) => {
    const map: Record<PaymentMethod, string> = {
      CASH: "Tiền mặt",
      BANK_TRANSFER: "Chuyển khoản",
      COD: "Thanh toán khi nhận hàng",
      MOMO: "Momo",
      VNPAY: "VNPay",
    };
    return map[payment] || payment;
  };

  const getStatusLabel = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      DRAFT: "Đơn chờ tại quầy",
      WAITING_PAYMENT: "Chờ thanh toán",
      PENDING: "Chờ xác nhận",
      WAITING_STOCK: "Chờ bổ sung hàng",
      CONFIRMED: "Đã xác nhận",
      PROCESSING: "Đang xử lý",
      SHIPPING: "Đang giao hàng",
      RETURNING: "Đang hoàn hàng",
      RETURNED_TO_SHOP: "Đã hoàn về cửa hàng",
      CANCELED_BY_DAMAGED: "Hủy do hàng hư hỏng",
      FAILED_DELIVERY: "Giao hàng thất bại",
      COMPLETED: "Đã hoàn thành",
      CANCELLED: "Đã hủy",
      REFUNDED: "Đã hoàn tiền",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      DRAFT: "bg-gray-50 text-gray-700 border-gray-200",
      WAITING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      WAITING_STOCK: "bg-orange-50 text-orange-700 border-orange-200",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
      PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200",
      SHIPPING: "bg-indigo-50 text-indigo-700 border-indigo-200",
      RETURNING: "bg-purple-50 text-purple-700 border-purple-200",
      RETURNED_TO_SHOP: "bg-teal-50 text-teal-700 border-teal-200",
      CANCELED_BY_DAMAGED: "bg-rose-50 text-rose-700 border-rose-200",
      FAILED_DELIVERY: "bg-red-50 text-red-700 border-red-200",
      COMPLETED: "bg-green-50 text-green-700 border-green-200",
      CANCELLED: "bg-red-50 text-red-700 border-red-200",
      REFUNDED: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return map[status] || "bg-gray-50 text-gray-700";
  };

  const handleStatusTransition = (nextStatus: OrderStatus, note?: string) => {
    setTransitionTarget({ status: nextStatus, note });
    setTransitionNote(note || "");
  };

  const confirmStatusTransition = () => {
    if (!transitionTarget || orderId === null) return;
    const { status } = transitionTarget;
    updateStatus(
      {
        id: orderId,
        payload: { status, note: transitionNote },
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
          if (shouldPrintInvoice) {
            setShowPrintModal(true);
          }
          setShouldPrintInvoice(false);
        },
        onError: (err: unknown) => {
          const apiError = err as { apiMessage?: string } | null;
          toast.error(apiError?.apiMessage ?? "Không thể cập nhật trạng thái");
        },
      },
    );
  };

  const cancelForm = useForm({
    defaultValues: {
      reason: "",
    },
    onSubmit: async ({ value }) => {
      handleStatusTransition(
        "CANCELLED",
        `Đơn hàng bị hủy. Lý do: ${value.reason}`,
      );
    },
  });

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
      <div className="bg-white w-full max-w-3xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {}
        {order && (
          <OrderHeader
            order={order}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            onClose={onClose}
            onPrint={() => setShowPrintModal(true)}
          />
        )}

        {}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">
                Đang tải thông tin đơn hàng...
              </p>
            </div>
          ) : !order ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              Không tìm thấy đơn hàng
            </p>
          ) : (
            <>
              {}

              <CustomerInfo order={order} />
              {}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={13} /> Danh sách sản phẩm (
                  {order.items.length})
                </h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {order.items.map((item) => (
                    <div
                      key={item.itemId}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {}
                        {item.productId ? (
                          <Link
                            to={`/products/${item.productId}`}
                            className="size-12 rounded-lg border border-gray-100 bg-muted overflow-hidden shrink-0 flex items-center justify-center transition hover:border-primary/50 hover:shadow-sm"
                            title={`Mở sản phẩm ${item.productName}`}
                          >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <ShoppingBag className="size-5 text-gray-300" />
                          )}
                          </Link>
                        ) : (
                          <div className="size-12 rounded-lg border border-gray-100 bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="size-full object-cover"
                              />
                            ) : (
                              <ShoppingBag className="size-5 text-gray-300" />
                            )}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          {item.productId ? (
                            <Link
                              to={`/products/${item.productId}`}
                              className="block truncate text-sm font-medium text-gray-900 transition hover:text-primary hover:underline"
                              title={`Mở sản phẩm ${item.productName}`}
                            >
                              {item.productName}
                            </Link>
                          ) : (
                            <p className="truncate text-sm font-medium text-gray-900">
                              {item.productName}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2.5 text-gray-500">
                            <span className="text-xs">Màu: {item.color}</span>
                            <span className="text-xs">Kích cỡ: {item.size}</span>
                            {item.salePrice && item.salePrice < item.price && (
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                Khuyến mãi -
                                {Math.round(
                                  ((item.price - item.salePrice) / item.price) *
                                    100,
                                )}
                                %
                              </span>
                            )}
                          </div>
                          {order.status === "CANCELED_BY_DAMAGED" && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                                Hàng hỏng: {item.damagedQuantity}
                              </span>
                              <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                Hàng nguyên vẹn: {item.undamagedQuantity}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {item.salePrice && item.salePrice < item.price ? (
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-red-600">
                              {item.salePrice.toLocaleString("vi-VN")}đ
                            </p>
                            <p className="text-xs text-gray-400 line-through">
                              {item.price.toLocaleString("vi-VN")}đ
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-gray-900">
                            {item.price.toLocaleString("vi-VN")}đ
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          Số lượng: x{item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-blue-600 mt-1">
                          {item.subtotal.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {}
              {(() => {
                const originalProductTotal = order.items.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                );
                const totalPromotionDiscount = order.items.reduce(
                  (sum, item) => {
                    if (item.salePrice && item.salePrice < item.price) {
                      return (
                        sum + (item.price - item.salePrice) * item.quantity
                      );
                    }
                    return sum;
                  },
                  0,
                );

                return (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} /> Thanh toán & Chi phí
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Tiền hàng (Giá gốc):</span>
                        <span>
                          {originalProductTotal.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      {totalPromotionDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Giảm giá sản phẩm:</span>
                          <span>
                            -{totalPromotionDiscount.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      )}
                      {order.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>
                            {order.couponCode
                              ? `Phiếu giảm giá (${order.couponCode}):`
                              : "Giảm giá đợt khuyến mãi:"}
                          </span>
                          <span>
                            -{order.discountAmount.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-500">
                        <span>Phí vận chuyển:</span>
                        <span>
                          +{order.shippingFee.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                        <span>Tổng số tiền thanh toán:</span>
                        <span className="text-blue-600">
                          {order.totalAmount.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">
                    Phương thức thanh toán:
                  </span>
                  <span className="font-semibold text-gray-700">
                    {getPaymentLabel(order.paymentMethod)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">
                    Trạng thái thanh toán:
                  </span>
                  <span
                    className={`font-semibold ${
                      order.paymentStatus === "PAID"
                        ? "text-green-600"
                        : order.paymentStatus === "REFUNDED"
                          ? "text-orange-600"
                          : "text-red-500"
                    }`}
                  >
                    {order.paymentStatus === "PAID"
                      ? "Đã thanh toán"
                      : order.paymentStatus === "REFUNDED"
                        ? "Đã hoàn tiền"
                        : "Chờ thanh toán"}
                  </span>
                </div>
                {order.couponCode && (
                  <div>
                    <span className="text-gray-400 block mb-0.5">
                      Mã giảm giá:
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                      <Tag size={10} />
                      {order.couponCode}
                    </span>
                  </div>
                )}
              </div>

              {}
              <div className="space-y-3.5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={13} /> Nhật ký lịch trình đơn hàng
                </h3>
                <div className="relative border-l border-gray-100 pl-4 ml-2.5 space-y-4">
                  {order.timeline.map((event) => (
                    <div key={event.timelineId} className="relative">
                      {}
                      <span className="absolute -left-[22.5px] top-1 bg-blue-100 border border-blue-500 w-3.5 h-3.5 rounded-full flex items-center justify-center">
                        <Check size={8} className="text-blue-600" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-800">
                            {event.description.split(" - ")[0] ||
                              getStatusLabel(event.status)}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Calendar size={10} />{" "}
                            {new Date(event.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-1">
                          {event.previousStatus &&
                            event.previousStatus !== event.status && (
                              <>
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">
                                  {getStatusLabel(event.previousStatus)}
                                </span>
                                <ArrowRight
                                  size={10}
                                  className="text-gray-300"
                                />
                              </>
                            )}
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-200">
                            {getStatusLabel(event.status)}
                          </span>
                        </div>

                        {event.description.includes(" - ") && (
                          <p className="text-xs text-gray-600 mt-1.5 bg-gray-50 border border-gray-100 rounded p-2">
                            <span className="font-semibold text-gray-700">
                              Ghi chú:
                            </span>{" "}
                            {event.description.substring(
                              event.description.indexOf(" - ") + 3,
                            )}
                          </p>
                        )}
                        {!event.description.includes(" - ") &&
                          event.description !==
                            getStatusLabel(event.status) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {event.description}
                            </p>
                          )}

                        <p className="text-[10px] text-gray-400 mt-1">
                          Thực hiện bởi:{" "}
                          <span className="text-gray-600 font-medium">
                            {event.createdBy}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {}
              {order.note && (
                <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-3">
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Lưu ý từ khách:</span>{" "}
                    {order.note}
                  </p>
                </div>
              )}

              {}
              {showCancelForm && (
                <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> Xác nhận hủy đơn hàng
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      cancelForm.handleSubmit();
                    }}
                    className="space-y-3"
                  >
                    <cancelForm.Field
                      name="reason"
                      validators={{
                        onChange: ({ value }) =>
                          !value || value.length < 5
                            ? "Lý do hủy đơn hàng phải chứa tối thiểu 5 ký tự."
                            : undefined,
                      }}
                      children={(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-xs font-medium text-red-700"
                          >
                            Nhập lý do hủy đơn{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="VD: Khách hàng yêu cầu đổi mẫu, Gọi không liên lạc được..."
                            className="bg-white border-red-200 focus-visible:ring-red-300 text-xs mt-1"
                            rows={3}
                          />
                          {field.state.meta.errors && (
                            <p className="text-xs text-destructive mt-1">
                              {field.state.meta.errors.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={isUpdating}
                      >
                        Xác nhận Hủy Đơn
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelForm(false)}
                      >
                        Bỏ qua
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {}
        {order && !isLoading && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
            <div>
              {((order.orderType === "ONLINE" &&
                ["PENDING", "WAITING_STOCK", "CONFIRMED", "WAITING_PAYMENT"].includes(order.status)) ||
                ((order.orderType === "POS" ||
                  order.orderType === "POS_SHIP") &&
                  ["DRAFT", "WAITING_PAYMENT"].includes(order.status))) && (
                <Button
                  onClick={() => setShowCancelForm(true)}
                  variant="destructive"
                  disabled={isUpdating || showCancelForm}
                >
                  Hủy đơn hàng
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onClose} variant="outline">
                Đóng
              </Button>

              {isDeliveryOrder && order.status === "PENDING" && (
                <>
                  {needsStockReplenishment && (
                    <Button
                      onClick={() =>
                        handleStatusTransition(
                          "WAITING_STOCK",
                          "Đơn hàng không đủ tồn kho và cần chờ bổ sung hàng.",
                        )
                      }
                      disabled={isUpdating}
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Clock className="mr-1.5 h-4 w-4" /> Chờ bổ sung hàng
                    </Button>
                  )}
                  <Button
                    onClick={() =>
                      handleStatusTransition(
                        "CONFIRMED",
                        "Đã xác nhận đơn thanh toán khi nhận hàng và trừ tồn kho.",
                      )
                    }
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Xác nhận đơn hàng
                  </Button>
                </>
              )}

              {isDeliveryOrder && order.status === "WAITING_STOCK" && (
                <Button
                  onClick={() =>
                    handleStatusTransition(
                      "CONFIRMED",
                      "Hàng đã được bổ sung; xác nhận đơn và trừ tồn kho.",
                    )
                  }
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Xác nhận khi đã có hàng
                </Button>
              )}

              {}
              {!isDeliveryOrder &&
                (order.orderType === "POS" || order.orderType === "POS_SHIP") &&
                ["DRAFT", "WAITING_PAYMENT"].includes(order.status) && (
                  <Button
                    onClick={() =>
                      handleStatusTransition(
                        "COMPLETED",
                        "Hoàn tất thanh toán và nhận hàng tại quầy.",
                      )
                    }
                    disabled={isUpdating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Hoàn thành đơn
                  </Button>
                )}

              {}
              {isDeliveryOrder &&
                (order.orderType === "POS" || order.orderType === "POS_SHIP") &&
                ["DRAFT", "WAITING_PAYMENT"].includes(order.status) && (
                  <Button
                    onClick={() =>
                      handleStatusTransition(
                        "CONFIRMED",
                        "Đã thanh toán tại quầy. Chuyển xác nhận đóng gói giao hàng.",
                      )
                    }
                    disabled={isUpdating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" /> Xác nhận & Giao
                    hàng
                  </Button>
                )}

              {}
              {isDeliveryOrder && order.status === "CONFIRMED" && (
                <Button
                  onClick={() =>
                    handleStatusTransition(
                      "SHIPPING",
                      "Đã bàn giao đơn hàng cho đơn vị vận chuyển.",
                    )
                  }
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Truck className="mr-1.5 h-4 w-4" /> Giao hàng
                </Button>
              )}

              {isDeliveryOrder && order.status === "SHIPPING" && (
                <Button
                  onClick={() =>
                    handleStatusTransition(
                      "COMPLETED",
                      "Giao hàng thành công đến tay khách hàng.",
                    )
                  }
                  disabled={isUpdating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Xác nhận hoàn thành
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {}
      <Dialog
        open={transitionTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionTarget(null);
            setTransitionNote("");
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
            <Label
              htmlFor="modal-transition-note"
              className="text-xs font-semibold text-gray-700"
            >
              Ghi chú cho trạng thái mới
            </Label>
            <Textarea
              id="modal-transition-note"
              placeholder="Nhập ghi chú cập nhật trạng thái đơn hàng..."
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              className="text-xs focus-visible:ring-blue-500"
              rows={3}
            />
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTransitionTarget(null);
                setTransitionNote("");
                setShouldPrintInvoice(false);
              }}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={confirmStatusTransition}
              disabled={isUpdating}
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
    </div>
  );
}
