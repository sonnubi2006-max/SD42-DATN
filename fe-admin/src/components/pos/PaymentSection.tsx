import { AlertCircle, CheckCircle2, Receipt, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { PaymentMethod } from "@/api/orderApi";
import { money, PAYMENT_METHODS } from "./posUtils";

interface Props {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  isDelivery: boolean;
  deliveryInvalid: boolean;
  disabled: boolean;
  onCheckout: () => void;
}

export default function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  subtotal,
  discountAmount,
  deliveryFee,
  grandTotal,
  isDelivery,
  deliveryInvalid,
  disabled,
  onCheckout,
}: Props) {
  const isFreeOrder = grandTotal <= 0;

  return (
    <section className="bg-card shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.45)]">
      <div className="px-4 pb-3 pt-3">
        <div className="mb-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Thanh toán
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Chọn phương thức khách sử dụng
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-700">
            <ShieldCheck size={13} />
            Xác nhận ở bước cuối
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const active = paymentMethod === method.value;
            return (
              <button
                key={method.value}
                type="button"
                aria-pressed={active}
                onClick={() => onPaymentMethodChange(method.value)}
                className={`relative flex min-h-14 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                  active
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-500/10"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-indigo-600 text-white" : "bg-slate-100"
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="text-[11px] font-bold leading-tight">
                  {method.label}
                </span>
                {active && (
                  <CheckCircle2
                    size={14}
                    className="absolute right-1.5 top-1.5 text-indigo-600"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-y bg-slate-50/70 px-4 py-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Tạm tính</span>
            <span className="font-medium tabular-nums">{money(subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Giảm giá</span>
            <span className="font-medium tabular-nums text-emerald-600">
              {discountAmount > 0 ? `-${money(discountAmount)}` : money(0)}
            </span>
          </div>
          {isDelivery && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span className="font-medium tabular-nums text-blue-600">
                +{money(deliveryFee)}
              </span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex items-end justify-between">
            <span className="text-sm font-bold text-slate-900">
              Khách cần trả
            </span>
            <span className="text-xl font-medium tracking-tight text-indigo-700 tabular-nums">
              {money(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        {isDelivery && deliveryInvalid && (
          <div className="mb-2 flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] font-medium text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            Hoàn tất tên, số điện thoại và địa chỉ giao hàng để tiếp tục.
          </div>
        )}
        <Button
          onClick={onCheckout}
          disabled={disabled}
          className="h-12 w-full gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:cursor-not-allowed"
        >
          <Receipt size={18} />
          {isFreeOrder ? "Hoàn tất đơn hàng" : "Xác nhận thanh toán"} ·{" "}
          {money(grandTotal)}
          <span className="ml-auto rounded bg-white/15 px-1.5 py-0.5 text-[10px]">
            F9
          </span>
        </Button>
      </div>
    </section>
  );
}
