import { useState } from "react";
import {
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  orderNeedsStockReplenishment,
  type OrderResponse,
  type OrderStatus,
} from "@/api/orderApi";

interface OrderFlowStep {
  status: OrderStatus;
  label: string;
}

interface OrderStatusControllerProps {
  order: OrderResponse;
  isUpdating: boolean;
  onStatusTransition: (nextStatus: OrderStatus, note?: string) => void;
  baseSteps: OrderFlowStep[];
  isDeliveryOrder: boolean;
  isOrderFinished: boolean;
}

export default function OrderStatusController({
  order,
  isUpdating,
  onStatusTransition,
  baseSteps,
  isDeliveryOrder,
  isOrderFinished,
}: OrderStatusControllerProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [failedDialogOpen, setFailedDialogOpen] = useState(false);
  const [failedReason, setFailedReason] = useState("");
  const [redeliverDialogOpen, setRedeliverDialogOpen] = useState(false);
  const [redeliverReason, setRedeliverReason] = useState("");
  const [damagedDialogOpen, setDamagedDialogOpen] = useState(false);
  const [damagedReason, setDamagedReason] = useState("");
  const [returningDialogOpen, setReturningDialogOpen] = useState(false);
  const [returningReason, setReturningReason] = useState("");
  const [failedDeliveryProblemDialogOpen, setFailedDeliveryProblemDialogOpen] =
    useState(false);
  const [failedDeliveryProblemReason, setFailedDeliveryProblemReason] =
    useState("");
  const canCancel = [
    "PENDING",
    "WAITING_STOCK",
    "CONFIRMED",
    "WAITING_PAYMENT",
    "DRAFT",
  ].includes(order.status);
  const needsStockReplenishment = orderNeedsStockReplenishment(order);

  const handleCancelOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy đơn");
      return;
    }
    onStatusTransition("CANCELLED", `Đơn hàng bị hủy. Lý do: ${cancelReason}`);
    setShowCancelForm(false);
    setCancelReason("");
  };

  if (isOrderFinished) {
    return (
      <div className="h-full border border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-gray-400 gap-1.5 bg-gray-50/10">
        <CheckCircle size={20} className="text-gray-400" />
        <p className="text-xs font-semibold">
          Quy trình xử lý đơn hàng đã hoàn tất
        </p>
        <p className="text-[10px]">
          Không thể thay đổi trạng thái của đơn hàng đã đóng.
        </p>
      </div>
    );
  }

  return (
    <Card className="border border-blue-100 bg-blue-50/10">
      <CardHeader className="py-3 border-b border-blue-50 bg-blue-50/20">
        <CardTitle className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
          <Clock size={14} /> Cập nhật trạng thái đơn hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <p className="text-xs text-gray-500">
          Đơn hàng này chưa hoàn thành. Nhân viên quản trị có thể thay đổi trạng
          thái theo quy trình:
        </p>

        {}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 py-1 flex-wrap">
          {baseSteps
            .filter((s) => s.status !== "CANCELLED" && s.status !== "REFUNDED")
            .map((step, idx) => {
              const isActive = order.status === step.status;
              return (
                <div key={step.status} className="flex items-center gap-2">
                  {idx > 0 && <ArrowRight size={12} className="opacity-40" />}
                  <span
                    className={
                      isActive
                        ? "text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md"
                        : "opacity-40"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          {isDeliveryOrder && order.status === "PENDING" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() =>
                  onStatusTransition(
                    "CONFIRMED",
                    "Đã xác nhận đơn thanh toán khi nhận hàng và trừ tồn kho.",
                  )
                }
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Xác nhận đơn hàng
              </Button>
              {needsStockReplenishment && (
                <Button
                  onClick={() =>
                    onStatusTransition(
                      "WAITING_STOCK",
                      "Đơn hàng không đủ tồn kho và cần chờ bổ sung hàng.",
                    )
                  }
                  disabled={isUpdating}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold text-xs h-8"
                >
                  <Clock className="mr-1.5 h-3.5 w-3.5" /> Chờ bổ sung hàng
                </Button>
              )}
            </div>
          )}

          {isDeliveryOrder && order.status === "WAITING_STOCK" && (
            <Button
              onClick={() =>
                onStatusTransition(
                  "CONFIRMED",
                  "Hàng đã được bổ sung; xác nhận đơn và trừ tồn kho.",
                )
              }
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8"
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Xác nhận khi đã có
              hàng
            </Button>
          )}

          {}
          {!isDeliveryOrder &&
            order.orderType === "POS" &&
            order.status === "DRAFT" && (
              <Button
                onClick={() =>
                  onStatusTransition(
                    "WAITING_PAYMENT",
                    "Đã chốt sản phẩm, chuyển sang chờ thanh toán tại quầy.",
                  )
                }
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Chốt đơn & thanh
                toán
              </Button>
            )}

          {!isDeliveryOrder &&
            order.orderType === "POS" &&
            order.status === "WAITING_PAYMENT" && (
              <Button
                onClick={() =>
                  onStatusTransition(
                    "COMPLETED",
                    "Đã nhận đủ thanh toán và giao hàng tại quầy.",
                  )
                }
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Xác nhận thanh
                toán & hoàn thành
              </Button>
            )}

          {}
          {isDeliveryOrder &&
            order.orderType === "POS_SHIP" &&
            order.status === "WAITING_PAYMENT" && (
              <Button
                onClick={() =>
                  onStatusTransition(
                    "CONFIRMED",
                    "Đã thanh toán tại quầy. Chuyển xác nhận đóng gói giao hàng.",
                  )
                }
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Xác nhận thanh
                toán & Giao hàng
              </Button>
            )}

          {}
          {isDeliveryOrder && order.status === "CONFIRMED" && (
            <Button
              onClick={() =>
                onStatusTransition(
                  "SHIPPING",
                  "Đã bàn giao cho đối tác giao nhận hàng.",
                )
              }
              disabled={isUpdating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8"
            >
              <Truck className="mr-1.5 h-3.5 w-3.5" /> Giao hàng
            </Button>
          )}

          {isDeliveryOrder && order.status === "SHIPPING" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() =>
                  onStatusTransition(
                    "COMPLETED",
                    "Giao hàng thành công đến tay khách hàng.",
                  )
                }
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
              >
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Xác nhận giao
                hàng thành công
              </Button>
              <Button
                onClick={() => {
                  setFailedReason("");
                  setFailedDialogOpen(true);
                }}
                disabled={isUpdating}
                variant="outline"
                className="border-rose-250 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs h-8"
              >
                Giao thất bại / Sự cố
              </Button>
            </div>
          )}

          {isDeliveryOrder && order.status === "FAILED_DELIVERY" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => {
                  setRedeliverReason("");
                  setRedeliverDialogOpen(true);
                }}
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
              >
                Giao lại hàng
              </Button>
              <Button
                onClick={() => {
                  setFailedDeliveryProblemReason("");
                  setFailedDeliveryProblemDialogOpen(true);
                }}
                disabled={isUpdating}
                variant="outline"
                className="border-rose-250 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs h-8"
              >
                Sự cố giao hàng / Hủy đơn
              </Button>
            </div>
          )}

          {isDeliveryOrder && order.status === "RETURNING" && (
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() =>
                  onStatusTransition(
                    "RETURNED_TO_SHOP",
                    "Đã nhận lại hàng chuyển hoàn về shop thành công (tồn kho tăng lại).",
                  )
                }
                disabled={isUpdating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8"
              >
                Nhận hàng hoàn về shop
              </Button>
              <Button
                onClick={() => {
                  setDamagedReason("");
                  setDamagedDialogOpen(true);
                }}
                disabled={isUpdating}
                variant="outline"
                className="border-rose-250 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-xs h-8"
              >
                Hủy do hỏng hàng hoàn
              </Button>
            </div>
          )}

          {}
          {order.status === "RETURNED_TO_SHOP" &&
            order.paymentStatus === "PAID" && (
              <div className="flex gap-2 flex-wrap items-start">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Khách hàng đã thanh toán trước. Vui lòng xác nhận hoàn
                    tiền sau khi hoàn tất quy trình.
                  </p>
                  <Button
                    onClick={() =>
                      onStatusTransition(
                        "REFUNDED",
                        "Đã hoàn tiền cho khách hàng sau khi nhận lại hàng hoàn thành công.",
                      )
                    }
                    disabled={isUpdating}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs h-8 gap-1.5 w-fit"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Xác nhận đã hoàn tiền
                  </Button>
                </div>
              </div>
            )}

          {canCancel && (
            <Button
              onClick={() => setShowCancelForm(!showCancelForm)}
              variant="destructive"
              disabled={isUpdating}
              className="font-semibold text-xs h-8"
            >
              Hủy đơn hàng
            </Button>
          )}
        </div>

        {}
        {showCancelForm && (
          <form
            onSubmit={handleCancelOrderSubmit}
            className="space-y-3 pt-3 border-t border-blue-50"
          >
            <div className="space-y-1">
              <Label
                htmlFor="reason"
                className="text-xs font-bold text-red-700"
              >
                Nhập lý do hủy đơn hàng{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Ví dụ: Gọi khách hàng không liên lạc được, khách yêu cầu thay đổi thông tin..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="bg-white border-red-200 focus-visible:ring-red-300 text-xs mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                disabled={isUpdating}
                className="text-xs font-semibold"
              >
                Xác nhận Hủy Đơn
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowCancelForm(false)}
                className="text-xs font-semibold"
              >
                Bỏ qua
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <Dialog open={failedDialogOpen} onOpenChange={setFailedDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-lg rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-800 uppercase tracking-tight flex items-center gap-1.5">
              Cập nhật sự cố giao nhận đơn hàng
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="failedReason"
                className="text-xs font-bold text-gray-600"
              >
                Lý do / Ghi chú (Không bắt buộc)
              </Label>
              <Textarea
                id="failedReason"
                placeholder="Nhập lý do cụ thể..."
                value={failedReason}
                onChange={(e) => setFailedReason(e.target.value)}
                className="min-h-[80px] text-xs focus:ring-1 bg-white text-gray-900 border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "FAILED_DELIVERY",
                    failedReason.trim()
                      ? `Giao hàng thất bại. Lý do: ${failedReason}`
                      : "Shipper báo cáo giao hàng thất bại, chờ giao lại.",
                  );
                  setFailedDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 justify-center px-4"
              >
                Chờ giao lại
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "RETURNING",
                    failedReason.trim()
                      ? `Đang chuyển hoàn. Lý do: ${failedReason}`
                      : "Hủy giao hàng, đang chuyển hoàn về shop.",
                  );
                  setFailedDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-9 justify-center px-4"
              >
                Đang chuyển hoàn
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "CANCELED_BY_DAMAGED",
                    failedReason.trim()
                      ? `Hủy do hỏng hàng. Lý do: ${failedReason}`
                      : "Hủy đơn hàng do sản phẩm bị hỏng trong quá trình vận chuyển.",
                  );
                  setFailedDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 justify-center px-4"
              >
                Hủy do hỏng hàng
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFailedDialogOpen(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-semibold text-xs h-9 justify-center px-4"
              >
                Đóng / Bỏ qua
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={redeliverDialogOpen} onOpenChange={setRedeliverDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-lg rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-800 uppercase tracking-tight">
              Xác nhận giao lại đơn hàng
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="redeliverReason"
                className="text-xs font-bold text-gray-600"
              >
                Ghi chú giao lại (Không bắt buộc)
              </Label>
              <Textarea
                id="redeliverReason"
                placeholder="Nhập ghi chú giao lại (ví dụ: giao lại ca chiều, hẹn lại shipper...)..."
                value={redeliverReason}
                onChange={(e) => setRedeliverReason(e.target.value)}
                className="min-h-[80px] text-xs focus:ring-1 bg-white text-gray-900 border-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRedeliverDialogOpen(false)}
                className="text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "SHIPPING",
                    redeliverReason.trim()
                      ? `Giao lại hàng. Ghi chú: ${redeliverReason}`
                      : "Yêu cầu giao lại đơn hàng lần tiếp theo.",
                  );
                  setRedeliverDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                Giao lại hàng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={damagedDialogOpen} onOpenChange={setDamagedDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-lg rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-850 uppercase tracking-tight">
              Hủy đơn hàng do hỏng sản phẩm
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="damagedReason"
                className="text-xs font-bold text-gray-600"
              >
                Lý do cụ thể (Không bắt buộc)
              </Label>
              <Textarea
                id="damagedReason"
                placeholder="Nhập tình trạng hỏng hóc cụ thể (ví dụ: sản phẩm rách, vỡ do shipper...)..."
                value={damagedReason}
                onChange={(e) => setDamagedReason(e.target.value)}
                className="min-h-[80px] text-xs focus:ring-1 bg-white text-gray-900 border-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDamagedDialogOpen(false)}
                className="text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "CANCELED_BY_DAMAGED",
                    damagedReason.trim()
                      ? `Hủy do hỏng hàng. Lý do: ${damagedReason}`
                      : "Hủy đơn hàng do sản phẩm bị hỏng trong quá trình vận chuyển.",
                  );
                  setDamagedDialogOpen(false);
                }}
                disabled={isUpdating}
                className="font-semibold text-xs"
              >
                Xác nhận Hủy do hỏng hàng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={returningDialogOpen} onOpenChange={setReturningDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-none shadow-lg rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-850 uppercase tracking-tight">
              Chuyển hoàn đơn hàng về Shop
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="returningReason"
                className="text-xs font-bold text-gray-600"
              >
                Ghi chú chuyển hoàn (Không bắt buộc)
              </Label>
              <Textarea
                id="returningReason"
                placeholder="Nhập lý do chuyển hoàn (ví dụ: khách từ chối nhận hàng, hoàn do quá hạn lưu kho...)..."
                value={returningReason}
                onChange={(e) => setReturningReason(e.target.value)}
                className="min-h-[80px] text-xs focus:ring-1 bg-white text-gray-900 border-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReturningDialogOpen(false)}
                className="text-xs font-semibold"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "RETURNING",
                    returningReason.trim()
                      ? `Đang chuyển hoàn. Lý do: ${returningReason}`
                      : "Khách không nhận hàng, chuyển hoàn về shop.",
                  );
                  setReturningDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
              >
                Xác nhận chuyển hoàn
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={failedDeliveryProblemDialogOpen}
        onOpenChange={setFailedDeliveryProblemDialogOpen}
      >
        <DialogContent className="sm:max-w-md bg-white border-none shadow-lg rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-800 uppercase tracking-tight">
              Báo cáo sự cố / Hủy đơn hàng (Giao thất bại)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="failedProblemReason"
                className="text-xs font-bold text-gray-600"
              >
                Lý do / Ghi chú (Không bắt buộc)
              </Label>
              <Textarea
                id="failedProblemReason"
                placeholder="Nhập lý do sự cố hoặc lý do hủy đơn cụ thể..."
                value={failedDeliveryProblemReason}
                onChange={(e) => setFailedDeliveryProblemReason(e.target.value)}
                className="min-h-[80px] text-xs focus:ring-1 bg-white text-gray-900 border-gray-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "RETURNING",
                    failedDeliveryProblemReason.trim()
                      ? `Đang chuyển hoàn. Lý do: ${failedDeliveryProblemReason}`
                      : "Khách không nhận hàng, chuyển hoàn về shop.",
                  );
                  setFailedDeliveryProblemDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs h-9 justify-center px-4"
              >
                Chuyển hoàn về shop
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onStatusTransition(
                    "CANCELED_BY_DAMAGED",
                    failedDeliveryProblemReason.trim()
                      ? `Hủy do hỏng hàng. Lý do: ${failedDeliveryProblemReason}`
                      : "Hủy đơn hàng do sản phẩm bị hỏng trong quá trình vận chuyển.",
                  );
                  setFailedDeliveryProblemDialogOpen(false);
                }}
                disabled={isUpdating}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs h-9 justify-center px-4"
              >
                Hủy do hỏng hàng
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFailedDeliveryProblemDialogOpen(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-semibold text-xs h-9 justify-center px-4"
              >
                Đóng / Bỏ qua
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
