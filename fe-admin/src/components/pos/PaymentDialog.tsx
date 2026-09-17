import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  QrCode,
  Banknote,
  Truck,
  Loader2,
  RotateCcw,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { PaymentMethod } from "@/api/orderApi";
import { money, PAYMENT_METHODS, formatNumberWithCommas, parseNumberFromCommas } from "./posUtils";
import {
  buildVietQrUrl,
  isPosBankConfigured,
  normalizeVietQrAddInfo,
} from "@/config/posPayment";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  grandTotal: number;
  orderCode: string;
  isDelivery: boolean;
  receiverName: string;
  customerName: string;
  isPending: boolean;
  onConfirm: () => void;
}

const QUICK_CASH = [50000, 100000, 200000, 500000];

export default function PaymentDialog({
  open,
  onOpenChange,
  paymentMethod,
  subtotal,
  discountAmount,
  deliveryFee,
  grandTotal,
  orderCode,
  isDelivery,
  receiverName,
  customerName,
  isPending,
  onConfirm,
}: Props) {
  const isFreeOrder = grandTotal <= 0;
  const isCash = paymentMethod === "CASH";
  const isBankTransfer = paymentMethod === "BANK_TRANSFER";
  const [received, setReceived] = useState<string>("");

  const [qrRemaining, setQrRemaining] = useState(15 * 60);

  useEffect(() => {
    if (!open || !isBankTransfer || !isPosBankConfigured) return;

    const resetTimer = window.setTimeout(() => setQrRemaining(15 * 60), 0);
    const timer = setInterval(() => {
      setQrRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      window.clearTimeout(resetTimer);
      clearInterval(timer);
    };
  }, [open, isBankTransfer]);

  const qrExpired = qrRemaining <= 0;

  useEffect(() => {
    if (!open) return;

    const resetReceived = window.setTimeout(() => setReceived(""), 0);
    return () => window.clearTimeout(resetReceived);
  }, [open, grandTotal]);

  const receivedNum = Number(received) || 0;
  const change = Math.max(0, receivedNum - grandTotal);
  const cashShort = isCash && receivedNum > 0 && receivedNum < grandTotal;
  const canConfirm =
    !isPending &&
    (isCash
      ? isFreeOrder || receivedNum >= grandTotal
      : isBankTransfer && isPosBankConfigured && !qrExpired);

  const methodLabel =
    PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ??
    paymentMethod;

  const qrAddInfo = useMemo(
    () => normalizeVietQrAddInfo(orderCode),
    [orderCode],
  );

  const qrUrl = useMemo(
    () =>
      isBankTransfer && isPosBankConfigured
        ? buildVietQrUrl({ amount: grandTotal, addInfo: qrAddInfo })
        : "",
    [grandTotal, isBankTransfer, qrAddInfo],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCash ? (
              <Banknote size={16} />
            ) : (
              <QrCode size={16} />
            )}
            Thanh toán · {methodLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          { }
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            <Row label="Tạm tính" value={money(subtotal)} />
            {discountAmount > 0 && (
              <Row
                label="Giảm giá"
                value={`-${money(discountAmount)}`}
                className="text-emerald-600"
              />
            )}
            {isDelivery && deliveryFee > 0 && (
              <Row
                label="Phí vận chuyển"
                value={`+${money(deliveryFee)}`}
                className="text-blue-600"
              />
            )}
            <Separator className="my-1" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Tổng cộng</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {money(grandTotal)}
              </span>
            </div>
          </div>

          {isDelivery && (
            <div className="flex items-center gap-1.5 text-[11px] text-blue-600">
              <Truck size={12} />
              Giao hàng đến: {receiverName || customerName || "—"}
            </div>
          )}

          { }
          {isCash && isFreeOrder ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-700">
              <BadgeCheck className="size-10" />
              <p className="text-sm font-bold">Đơn hàng không cần thanh toán</p>
              <p className="text-xs">
                Tổng tiền là 0đ nên không cần nhập tiền khách đưa.
              </p>
            </div>
          ) : isCash ? (
            <div className="space-y-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Khách đưa
                  </Label>
                  {receivedNum > 0 && (
                    <span className="text-xs font-bold text-emerald-600 tabular-nums">
                      {money(receivedNum)}
                    </span>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatNumberWithCommas(received)}
                    onChange={(e) => setReceived(parseNumberFromCommas(e.target.value))}
                    placeholder="Nhập số tiền khách đưa..."
                    className="h-10 text-base font-bold tabular-nums pr-8"
                    autoFocus
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                    đ
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_CASH.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setReceived(String(amt))}
                    className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors tabular-nums"
                  >
                    {money(amt)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setReceived(String(grandTotal))}
                  className="rounded-md border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  Đủ tiền
                </button>
              </div>
              <div
                className={`flex justify-between rounded-lg px-3 py-2 text-sm font-semibold ${cashShort
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                  }`}
              >
                <span>{cashShort ? "Còn thiếu" : "Tiền thối"}</span>
                <span className="tabular-nums">
                  {cashShort
                    ? money(grandTotal - receivedNum)
                    : money(change)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-white p-4 shadow-sm">
              <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${qrExpired ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                <Clock size={13} className="animate-pulse" />
                <span>
                  {qrExpired
                    ? "Mã QR đã hết hạn thanh toán"
                    : `Hết hạn sau: ${Math.floor(qrRemaining / 60)
                      .toString()
                      .padStart(2, "0")}:${(qrRemaining % 60)
                        .toString()
                        .padStart(2, "0")}`}
                </span>
              </div>

              {!isPosBankConfigured ? (
                <div className="flex flex-col items-center gap-2 py-7 text-center">
                  <AlertTriangle className="size-9 text-amber-500" />
                  <p className="text-sm font-bold text-amber-800">
                    Chưa cấu hình tài khoản VietQR thật
                  </p>
                  <p className="max-w-xs text-[11px] leading-5 text-muted-foreground">
                    Cấu hình VITE_VIETQR_BANK_ID, VITE_VIETQR_ACCOUNT_NO và
                    VITE_VIETQR_ACCOUNT_NAME trước khi nhận chuyển khoản tại quầy.
                  </p>
                </div>
              ) : qrExpired ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-xs text-red-600 font-semibold">
                    Thời gian hiển thị mã QR đã hết hạn!
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => setQrRemaining(15 * 60)}
                    className="text-xs font-semibold gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 cursor-pointer"
                  >
                    <RotateCcw size={13} /> Tạo lại mã QR (15 phút)
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground text-center">
                    {isFreeOrder
                      ? "VietQR không cố định số tiền thanh toán"
                      : "Quét VietQR để chuyển khoản đúng tài khoản, số tiền và nội dung"}
                  </p>
                  <img
                    src={qrUrl}
                    alt="QR thanh toán"
                    className="h-48 w-48 object-contain"
                    loading="eager"
                  />
                  <div className="text-center">
                    <p className="text-[11px] text-muted-foreground">
                      Nội dung: <span className=" font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{qrAddInfo}</span>
                    </p>
                    <p className="text-base font-bold text-blue-600 tabular-nums mt-0.5">
                      {isFreeOrder ? "Không kèm số tiền" : money(grandTotal)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {isPending && <Loader2 size={15} className="animate-spin" />}
            {isPending
              ? "Đang xử lý..."
              : isFreeOrder
                ? "Hoàn tất đơn hàng"
                : isCash
                  ? "Hoàn tất"
                  : "Đã nhận chuyển khoản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex justify-between text-xs ${className}`}>
      <span className={className ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
