import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderResponse } from "@/api/orderApi";

interface OrderItemsListProps {
  order: OrderResponse;
}

export default function OrderItemsList({ order }: OrderItemsListProps) {
  const showDamageBreakdown = order.status === "CANCELED_BY_DAMAGED";

  return (
    <Card className="border border-gray-100 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gray-50/30 py-3.5">
        <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={14} /> Danh sách sản phẩm (
          {order.items?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-100">
        {order.items?.map((item) => {
          const productPath = item.productId
            ? `/products/${item.productId}/edit`
            : null;

          return (
            <div
              key={item.itemId}
              className="p-4 flex items-center justify-between gap-4 text-xs"
            >
            <div className="flex items-center gap-3 min-w-0">
              {}
              {productPath ? (
                <Link
                  to={productPath}
                  className="size-12 rounded-lg border border-gray-100 bg-muted overflow-hidden shrink-0 flex items-center justify-center transition hover:border-primary/50 hover:shadow-sm"
                  title={`Mở sản phẩm ${item.productName}`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="size-full object-cover transition-transform hover:scale-105"
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
                {productPath ? (
                  <Link
                    to={productPath}
                    className="block truncate text-sm font-semibold text-gray-900 transition hover:text-primary hover:underline"
                    title={`Mở sản phẩm ${item.productName}`}
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.productName}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2.5 text-gray-400">
                  {item.variantCode && <span>Mã: {item.variantCode}</span>}
                  {item.color && <span>Màu: {item.color}</span>}
                  {item.size && <span>Kích cỡ: {item.size}</span>}
                  {item.salePrice && item.salePrice < item.price && (
                    <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      Khuyến mãi -{Math.round(((item.price - item.salePrice) / item.price) * 100)}%
                    </span>
                  )}
                </div>
                {showDamageBreakdown && (
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
                  <p className="font-bold text-red-600 text-sm">
                    {item.salePrice.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-xs text-gray-400 line-through">
                    {item.price.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              ) : (
                <p className="font-bold text-gray-900 text-sm">
                  {item.price.toLocaleString("vi-VN")}đ
                </p>
              )}
              <p className="text-gray-400 mt-0.5">Số lượng: x{item.quantity}</p>
              <p className="font-bold text-blue-600 mt-1">
                {item.subtotal.toLocaleString("vi-VN")}đ
              </p>
            </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
