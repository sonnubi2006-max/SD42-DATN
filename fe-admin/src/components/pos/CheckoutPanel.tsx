import { useState, useEffect } from "react";
import { Receipt, CreditCard, Banknote, UserPlus, Search, BadgeCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethod } from "@/api/orderApi";
import type { PromotionResponse } from "@/api/promotionApi";
import { money } from "./posUtils";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "CASH", label: "Tien mat", icon: Banknote },
  { value: "BANK_TRANSFER", label: "Chuyen khoan", icon: CreditCard },
];

interface Props {
  orderCode?: string;
  status?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  onAttachCustomer: (name: string, phone: string) => void;
  isAttaching: boolean;
  onOpenCustomerPopup: () => void;
  appliedPromotion: PromotionResponse | null;
  onRemovePromotion: () => void;
  onOpenCouponPopup: () => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  subtotal: number;
  discountAmount: number;
  total: number;
  onCheckout: () => void;
  isCheckingOut: boolean;
  canCheckout: boolean;
}

export default function CheckoutPanel({
  orderCode, status, initialCustomerName, initialCustomerPhone,
  onAttachCustomer, isAttaching, onOpenCustomerPopup, appliedPromotion, onRemovePromotion, onOpenCouponPopup,
  paymentMethod, onPaymentMethodChange, subtotal, discountAmount, total, onCheckout, isCheckingOut, canCheckout,
}: Props) {
  const [customerName, setCustomerName] = useState(initialCustomerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone ?? "");

  useEffect(() => {
    setCustomerName(initialCustomerName ?? "");
    setCustomerPhone(initialCustomerPhone ?? "");
  }, [initialCustomerName, initialCustomerPhone]);

  const handleAttach = () => {
    onAttachCustomer(customerName, customerPhone);
  };

  return (
    <>
      <Card className="flex-shrink-0">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={14} className="text-blue-500" />
              <span className="text-sm font-semibold">{orderCode}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">{status}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="flex-shrink-0">
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500"><UserPlus size={13} /> Khach hang</div>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-blue-500" onClick={onOpenCustomerPopup}><Search size={10} /> Tim kiem</Button>
          </div>
          <div className="flex gap-2">
            <Input placeholder="SDT khach" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Ten khach" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-8 text-xs" />
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleAttach} disabled={isAttaching}>
            <UserPlus size={12} className="mr-1" /> Gan khach
          </Button>
        </CardContent>
      </Card>

      <Card className="flex-shrink-0">
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500"><Search size={13} /> Khuyến mãi</div>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-blue-500" onClick={onOpenCouponPopup}><Search size={10} /> Tìm kiếm</Button>
          </div>
          {appliedPromotion ? (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-2 py-1.5">
              <BadgeCheck size={14} className="text-green-600" />
              <div className="flex-1">
                <p className="text-xs font-medium text-green-700">{appliedPromotion.name}</p>
                <p className="text-[10px] text-green-600">
                  Giảm {appliedPromotion.discountType === "PERCENTAGE" ? `${appliedPromotion.discountValue}%` : money(appliedPromotion.discountValue)}
                  {" · "}{appliedPromotion.applyType === "ORDER" ? "Toàn đơn" : appliedPromotion.applyType === "PRODUCT" ? "Sản phẩm" : "Danh mục"}
                </p>
              </div>
              <button onClick={onRemovePromotion} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400">Chưa áp dụng khuyến mãi. Nhấn "Tìm kiếm" để chọn.</p>
          )}
        </CardContent>
      </Card>

      <Card className="flex-shrink-0">
        <CardContent className="space-y-2 p-3">
          <div className="grid grid-cols-3 gap-1">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const active = paymentMethod === m.value;
              return (
                <button key={m.value} onClick={() => onPaymentMethodChange(m.value)}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[10px] transition ${active ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  <Icon size={14} />{m.label}
                </button>
              );
            })}
          </div>
          <div className="space-y-1 border-t pt-2 text-xs">
            <div className="flex justify-between text-gray-500"><span>Tam tinh</span><span>{money(subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Giảm giá</span><span className="text-green-600">{discountAmount > 0 ? `-${money(discountAmount)}` : money(0)}</span></div>
            <div className="flex justify-between border-t pt-1 text-sm font-bold text-gray-900"><span>Tong</span><span className="text-blue-600">{money(total)}</span></div>
          </div>
          <Button onClick={onCheckout} disabled={isCheckingOut || !canCheckout} className="h-10 w-full gap-2 bg-green-600 hover:bg-green-700">
            <Receipt size={16} />{isCheckingOut ? "Dang xu ly..." : "Thanh toan"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
