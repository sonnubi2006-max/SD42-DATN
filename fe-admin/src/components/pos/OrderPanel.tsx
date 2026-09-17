import { useState, useEffect, useMemo } from "react";
import { Minus, Plus, ShoppingCart, Trash2, Receipt, CreditCard, Banknote, UserPlus, Search, BadgeCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import type { PaymentMethod } from "@/api/orderApi";
import type { PromotionResponse } from "@/api/promotionApi";
import type { CustomerResponse } from "@/api/customerApi";
import type { PosDraftItem } from "@/api/posApi";
import { money } from "./posUtils";
import CustomerPopup from "./CustomerPopup";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: "CASH", label: "Tien mat", icon: Banknote },
  { value: "BANK_TRANSFER", label: "Chuyen khoan", icon: CreditCard },
];

interface Props {
  orderCode?: string;
  status?: string;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  cart: PosDraftItem[];
  appliedPromotion: PromotionResponse | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  isAttaching: boolean;
  isCheckingOut: boolean;
  onAttachCustomer: (name: string, phone: string) => void;
  onUpdateQuantity: (detailId: number, qty: number) => void;
  onRemoveItem: (detailId: number) => void;
  onRemovePromotion: () => void;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onCheckout: () => void;
}

export default function OrderPanel({
  orderCode, status, initialCustomerName, initialCustomerPhone,
  cart, appliedPromotion, paymentMethod, subtotal, total,
  isAttaching, isCheckingOut,
  onAttachCustomer, onUpdateQuantity, onRemoveItem, onRemovePromotion, onPaymentMethodChange, onCheckout,
}: Props) {
  const [customerName, setCustomerName] = useState(initialCustomerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone ?? "");
  const [customerPopupOpen, setCustomerPopupOpen] = useState(false);
  const [couponPopupOpen, setCouponPopupOpen] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");
  const debouncedCouponSearch = useDebounce(couponSearch, 400);

  useEffect(() => { setCustomerName(initialCustomerName ?? ""); setCustomerPhone(initialCustomerPhone ?? ""); }, [initialCustomerName, initialCustomerPhone]);

  const discountAmount = useMemo(() => {
    if (!appliedPromotion) return 0;
    let d = appliedPromotion.discountType === "PERCENTAGE" ? (subtotal * appliedPromotion.discountValue) / 100 : appliedPromotion.discountValue;
    if (appliedPromotion.maxDiscountAmount) d = Math.min(d, appliedPromotion.maxDiscountAmount);
    return Math.min(Math.round(d), subtotal);
  }, [appliedPromotion, subtotal]);

  const handlePickCustomer = (customer: CustomerResponse) => {
    setCustomerName(customer.fullName || customer.email || "");
    setCustomerPhone(customer.phone || "");
    setCustomerPopupOpen(false);
  };

  return (
    <>
      {}
      <Card className="flex-shrink-0">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Receipt size={14} className="text-blue-500" /><span className="text-sm font-semibold">{orderCode}</span></div>
            <Badge variant="outline" className="text-[10px]">{status}</Badge>
          </div>
        </CardContent>
      </Card>

      {}
      <Card className="flex-shrink-0">
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500"><UserPlus size={13} /> Khach hang</div>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-blue-500" onClick={() => setCustomerPopupOpen(true)}><Search size={10} /> Tim kiem</Button>
          </div>
          <div className="flex gap-2">
            <Input placeholder="SDT khach" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Ten khach" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-8 text-xs" />
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onAttachCustomer(customerName, customerPhone)} disabled={isAttaching}>
            <UserPlus size={12} className="mr-1" /> Gan khach
          </Button>
        </CardContent>
      </Card>

      {}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-600"><ShoppingCart size={13} /> Gio ({cart.length})</div>
          {cart.length > 0 && <button onClick={() => cart.forEach((i) => onRemoveItem(i.itemId))} className="text-[10px] text-gray-400 hover:text-red-500">Xoa tat ca</button>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">Chua co san pham</div>
          ) : (
            <div className="space-y-1">
              {cart.map((item) => (
                <div key={item.itemId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-800">{item.productName}</p>
                    <p className="text-[10px] text-gray-400">{[item.color, item.size].filter(Boolean).join(" / ")} {money(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1)} className="rounded border p-0.5 hover:bg-gray-100"><Minus size={10} /></button>
                    <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1)} className="rounded border p-0.5 hover:bg-gray-100"><Plus size={10} /></button>
                  </div>
                  <span className="w-16 text-right text-xs font-semibold">{money(item.subtotal)}</span>
                  <button onClick={() => onRemoveItem(item.itemId)} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {}
      <Card className="flex-shrink-0">
        <CardContent className="space-y-2 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs font-medium text-gray-500"><Search size={13} /> Khuyến mãi</div>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] text-blue-500" disabled><Search size={10} /> Tìm kiếm</Button>
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

      {}
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
          <Button onClick={onCheckout} disabled={isCheckingOut || cart.length === 0} className="h-10 w-full gap-2 bg-green-600 hover:bg-green-700">
            <Receipt size={16} />{isCheckingOut ? "Dang xu ly..." : "Thanh toan"}
          </Button>
        </CardContent>
      </Card>

      <CustomerPopup open={customerPopupOpen} onOpenChange={setCustomerPopupOpen} onPickCustomer={handlePickCustomer} />
    </>
  );
}
