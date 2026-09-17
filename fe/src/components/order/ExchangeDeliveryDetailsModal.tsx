import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PackageCheck, Truck, User, MapPin, FileText, Package, CheckCircle2, Clock, Check, AlertCircle } from "lucide-react";
import type { ReturnResponse } from "@/api/returnApi";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

interface ExchangeDeliveryDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnRequest: ReturnResponse | null;
}

export default function ExchangeDeliveryDetailsModal({
  open,
  onOpenChange,
  returnRequest,
}: ExchangeDeliveryDetailsModalProps) {
  if (!returnRequest || !returnRequest.exchangeDelivery) return null;

  const delivery = returnRequest.exchangeDelivery;
  
  const steps = [
    { key: "PREPARING", label: "Chờ giao", desc: "Chuẩn bị hàng" },
    { key: "SHIPPING", label: "Đang giao", desc: "Đã xuất kho" },
    { key: "DELIVERED", label: "Đã giao", desc: "Thành công" },
  ];
  
  const currentStatus = delivery.status;
  
  // Determine if there's a failure status
  const isFailed = ["FAILED_DELIVERY", "RETURNING", "RETURNED_TO_SHOP", "CANCELLED", "CANCELED_BY_DAMAGED", "FAILED"].includes(currentStatus);

  const getStepStatus = (index: number) => {
    if (isFailed) return "failed";
    const statusMap: Record<string, number> = { PREPARING: 0, SHIPPING: 1, DELIVERED: 2 };
    const currentIndex = statusMap[currentStatus] ?? 0;
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "active";
    return "upcoming";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <PackageCheck className="size-5 text-blue-500" />
            <span>
              Phiếu Giao Đổi: <span className="text-blue-600">{delivery.deliveryCode}</span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1 text-xs">
            Xem thông tin chi tiết và quá trình xử lý đơn giao đổi hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timeline Stepper */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 flex justify-between relative overflow-hidden">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 -mt-3 bg-slate-200 z-0 px-12" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 -mt-3 bg-blue-500 z-0 transition-all duration-500 ease-in-out" style={{
                width: isFailed ? '0%' : (getStepStatus(2) === "completed" || getStepStatus(2) === "active" ? '100%' : getStepStatus(1) === "completed" || getStepStatus(1) === "active" ? '50%' : '0%'),
                clipPath: "inset(0 3rem 0 3rem)"
            }} />
            
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 px-2 min-w-[100px]">
                  <div className={cn(
                    "size-10 rounded-full flex items-center justify-center border-4 border-slate-50 shadow-sm transition-all duration-300",
                    status === "completed" ? "bg-blue-600 text-white" :
                    status === "active" ? "bg-blue-500 text-white ring-4 ring-blue-100" :
                    status === "failed" ? "bg-rose-500 text-white" :
                    "bg-slate-200 text-slate-400"
                  )}>
                    {status === "completed" ? <Check className="size-5" /> :
                     index === 0 ? <Clock className="size-5" /> : 
                     index === 1 ? <Truck className="size-5" /> : <CheckCircle2 className="size-5" />}
                  </div>
                  <div className="text-center">
                    <p className={cn("text-xs font-bold", status === "upcoming" ? "text-slate-400" : "text-blue-700")}>{step.label}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {isFailed && (
             <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs flex items-center gap-2">
                <AlertCircle className="size-4 text-rose-600" />
                <span className="font-semibold text-rose-800">
                   Trạng thái hiện tại: {
                       currentStatus === "FAILED_DELIVERY" ? "Giao thất bại" :
                       currentStatus === "RETURNING" ? "Đang hoàn về shop" :
                       currentStatus === "RETURNED_TO_SHOP" ? "Đã hoàn về shop" :
                       currentStatus === "CANCELLED" ? "Đã hủy" :
                       currentStatus === "CANCELED_BY_DAMAGED" ? "Hủy do hàng hỏng" : "Lỗi giao hàng"
                   }
                </span>
             </div>
          )}

          {/* Delivery & Customer info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order/Customer Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center border-b border-slate-200/70 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="size-3.5 text-blue-500" /> Thông tin đơn hàng
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Mã đơn gốc:</span>
                  <span className="font-bold text-slate-800">#{returnRequest.orderCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Khách hàng:</span>
                  <span className="font-semibold text-slate-700">
                    {returnRequest.exchangeReceiverName || returnRequest.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Yêu cầu đổi hàng:</span>
                  <span className="font-bold text-blue-600">Phiếu #{returnRequest.returnId}</span>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Truck className="size-3.5 text-indigo-500" /> Giao nhận & Phí vận chuyển
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-1.5">
                  <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="leading-relaxed min-w-0 flex-1">
                    <span className="text-slate-500 font-medium block text-[11px]">Địa chỉ giao hàng:</span>
                    <span className="font-semibold text-slate-800 break-words">
                      {returnRequest.exchangeDeliveryAddress || "Chưa có địa chỉ"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-200/70 pt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Phí giao đổi:</span>
                    <span className="font-bold text-slate-900">
                      {returnRequest.exchangeShippingFee !== null && returnRequest.exchangeShippingFee > 0
                        ? formatCurrency(returnRequest.exchangeShippingFee)
                        : "Miễn phí"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          {returnRequest.note && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs flex items-start gap-2">
              <FileText className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-900">Ghi chú yêu cầu đổi: </span>
                <span className="text-amber-800">{returnRequest.note}</span>
              </div>
            </div>
          )}

          {/* Products */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package className="size-3.5 text-blue-500" /> Sản phẩm đổi mới ({returnRequest.exchangeItems?.length || 0})
            </h3>
            <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
              {returnRequest.exchangeItems?.map((item) => (
                <div key={item.exchangeItemId} className="flex justify-between items-center bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="size-10 rounded object-cover border" />
                    ) : (
                      <div className="size-10 rounded border bg-slate-100 flex items-center justify-center">
                        <Package className="size-5 text-slate-300" />
                      </div>
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate" title={item.productName}>
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Màu: <span className="text-slate-600">{item.color}</span> · Size: <span className="text-slate-600">{item.size}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                      SL: {item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
