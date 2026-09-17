import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OrderResponse } from "@/api/orderApi";

interface InvoicePrintModalProps {
  order: OrderResponse;
  onClose: () => void;
}

const money = (n: number) => `${Number(n).toLocaleString("vi-VN")}đ`;

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Tiền mặt",
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  VNPAY: "VNPAY",
  MOMO: "Ví MoMo",
};

export default function InvoicePrintModal({
  order,
  onClose,
}: InvoicePrintModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:static print:bg-transparent print:p-0">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl print:max-w-none print:rounded-none print:shadow-none">
        { }
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 print:hidden">
          <h2 className="text-sm font-semibold text-gray-700">
            Hóa đơn bán hàng
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        { }
        <div
          id="pos-invoice"
          className="max-h-[70vh] overflow-y-auto px-6 py-5 print:max-h-none print:overflow-visible"
        >
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-wide text-gray-900">
              STRAVO STORE
            </h1>
            <p className="text-xs text-gray-500">
              Hóa đơn bán hàng tại quầy
            </p>
          </div>

          <div className="my-4 border-t border-dashed border-gray-300" />

          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Mã hóa đơn:</span>
              <span className=" font-semibold text-gray-800">
                {order.orderCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{new Date(order.createdAt).toLocaleString("vi-VN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Khách hàng:</span>
              <span>{order.customerName}</span>
            </div>
            {order.customerPhone ? (
              <div className="flex justify-between">
                <span>Số điện thoại:</span>
                <span>{order.customerPhone}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span>Thanh toán:</span>
              <span>
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-gray-300" />

          { }
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="pb-2 text-left font-medium">Sản phẩm</th>
                <th className="pb-2 text-center font-medium">SL</th>
                <th className="pb-2 text-right font-medium">Đơn giá</th>
                <th className="pb-2 text-right font-medium">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.itemId} className="align-top">
                  <td className="py-1.5 pr-2 text-gray-800">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-[10px] text-gray-400">
                      {[item.color, item.size].filter(Boolean).join(" / ")}
                    </div>
                  </td>
                  <td className="py-1.5 text-center text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 text-right text-gray-700">
                    {item.salePrice && item.salePrice < item.price ? (
                      <div>
                        <div className="font-bold text-rose-600">{money(item.salePrice)}</div>
                        <div className="text-[10px] text-gray-400 line-through">{money(item.price)}</div>
                      </div>
                    ) : (
                      money(item.price)
                    )}
                  </td>
                  <td className="py-1.5 text-right font-medium text-gray-800">
                    {money(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="my-4 border-t border-dashed border-gray-300" />

          { }
          {(() => {
            const origTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const totalPromo = order.items.reduce((sum, item) => {
              if (item.salePrice && item.salePrice < item.price) {
                return sum + (item.price - item.salePrice) * item.quantity;
              }
              return sum;
            }, 0);

            return (
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính (Giá gốc):</span>
                  <span>{money(origTotal)}</span>
                </div>
                {totalPromo > 0 ? (
                  <div className="flex justify-between text-green-600">
                    <span>Khuyến mãi sản phẩm:</span>
                    <span>-{money(totalPromo)}</span>
                  </div>
                ) : null}
                {order.discountAmount > 0 ? (
                  <div className="flex justify-between text-green-600">
                    <span>
                      {order.couponCode
                        ? `Phiếu giảm giá (${order.couponCode}):`
                        : "Giảm giá đợt khuyến mãi:"}
                    </span>
                    <span>-{money(order.discountAmount)}</span>
                  </div>
                ) : null}
                {order.shippingFee > 0 ? (
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span>+{money(order.shippingFee)}</span>
                  </div>
                ) : null}
                <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                  <span>Tổng thanh toán:</span>
                  <span>{money(order.finalAmount || order.totalAmount)}</span>
                </div>
              </div>
            );
          })()}

          <div className="my-4 border-t border-dashed border-gray-300" />

          <p className="text-center text-xs text-gray-500">
            Cảm ơn quý khách và hẹn gặp lại!
          </p>
        </div>

        { }
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 print:hidden">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer size={16} /> In hóa đơn
          </Button>
        </div>
      </div>
    </div>
  );
}
