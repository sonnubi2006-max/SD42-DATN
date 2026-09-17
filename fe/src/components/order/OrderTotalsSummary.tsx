import { Card, CardContent } from "@/components/ui/card";
import type { OrderResponse } from "@/api/orderApi";
import { formatCurrency } from "@/utils/format";

interface OrderTotalsSummaryProps {
  order: OrderResponse;
}

export default function OrderTotalsSummary({ order }: OrderTotalsSummaryProps) {
  const originalTotal =
    order.orderDetails?.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ) ?? order.totalAmount;
  const productPromotion =
    order.orderDetails?.reduce((sum, item) => {
      if (item.salePrice && item.salePrice < item.price) {
        return sum + (item.price - item.salePrice) * item.quantity;
      }
      return sum;
    }, 0) ?? 0;

  return (
    <div className="flex justify-end">
      <Card className="w-full max-w-md border border-gray-100 bg-gray-50/20">
        <CardContent className="space-y-3 p-4 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Tổng tiền hàng (Giá gốc):</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(originalTotal)}
            </span>
          </div>
          {productPromotion > 0 && (
            <div className="flex justify-between">
              <span>Giảm giá sản phẩm:</span>
              <span className="font-semibold text-emerald-600">
                -{formatCurrency(productPromotion)}
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
                -{formatCurrency(order.discountAmount)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span className="font-semibold text-gray-900">
              +{formatCurrency(order.shippingFee)}
            </span>
          </div>
          {(order.completedRefundAmount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span>Tiền cửa hàng đã hoàn:</span>
              <span className="font-semibold text-orange-700">
                -{formatCurrency(order.completedRefundAmount ?? 0)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm font-bold text-gray-900">
            <span>Tổng số tiền thanh toán:</span>
            <span className="text-lg text-blue-600">
              {formatCurrency(order.finalAmount || order.totalAmount)}
            </span>
          </div>
          {(order.completedRefundAmount ?? 0) > 0 && (
            <div className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Giá trị hàng sau hoàn:</span>
              <span className="text-lg text-emerald-700">
                {formatCurrency(order.netRevenue ?? 0)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
