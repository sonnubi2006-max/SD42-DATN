import { Link } from "react-router-dom";
import { ShoppingBag, ImageOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { OrderResponse } from "@/api/orderApi";
import { formatCurrency, resolveImageUrl } from "@/utils/format";

interface OrderItemsListProps {
  order: OrderResponse;
  readOnly?: boolean;
}

export default function OrderItemsList({ order, readOnly = false }: OrderItemsListProps) {
  const completed = order.orderStatus === "COMPLETED";
  const showDamageBreakdown = order.orderStatus === "CANCELED_BY_DAMAGED";

  return (
    <Card className="border border-gray-100 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gray-50/30 py-3.5">
        <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag size={14} /> Danh sách sản phẩm ({order.orderDetails?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-gray-100">
        {order.orderDetails?.map((item) => {
          const img = resolveImageUrl(item.imageUrl);
          const productPath =
            item.productCode && item.productSlug
              ? `/products/${encodeURIComponent(item.productCode)}/${encodeURIComponent(item.productSlug)}`
              : null;
          const returnedQuantity = item.returnedQuantity ?? 0;
          const remainingReturnQuantity =
            item.remainingReturnQuantity ??
            Math.max(0, item.quantity - returnedQuantity);
          return (
            <div
              key={item.orderDetailId}
              className="p-4 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {}
                {productPath ? (
                  <Link
                    to={productPath}
                    className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center transition hover:border-primary/50 hover:shadow-sm"
                    title={`Xem sản phẩm ${item.productName}`}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={item.productName}
                        className="size-full object-cover transition-transform hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                  {img ? (
                    <img
                      src={img}
                      alt={item.productName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                  </div>
                )}

                {}
                <div className="space-y-1 min-w-0">
                  {productPath ? (
                    <Link
                      to={productPath}
                      className="block truncate text-sm font-semibold text-gray-900 transition hover:text-primary hover:underline"
                      title={`Xem sản phẩm ${item.productName}`}
                    >
                      {item.productName}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.productName}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-400">
                    {item.variantCode && <span>Mã: {item.variantCode}</span>}
                    {item.color && <span>Màu: {item.color}</span>}
                    {item.size && <span>Kích cỡ: {item.size}</span>}
                    {item.salePrice && item.salePrice < item.price && (
                      <span className="inline-block bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-red-100">
                        Khuyến mãi -{Math.round(((item.price - item.salePrice) / item.price) * 100)}%
                      </span>
                    )}
                  </div>
                  {!readOnly && completed && item.variantId && (
                    item.isReviewed ? (
                      <span className="text-xs text-emerald-600 font-medium block mt-1">
                        Đã đánh giá
                      </span>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                        asChild
                      >
                        <Link to={`/reviews?orderDetailId=${item.orderDetailId}&productName=${encodeURIComponent(item.productName)}`}>
                          Viết đánh giá
                        </Link>
                      </Button>
                    )
                  )}
                  {showDamageBreakdown && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                        Hàng hỏng: {item.damagedQuantity ?? 0}
                      </span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Hàng nguyên vẹn:{" "}
                        {item.undamagedQuantity ??
                          Math.max(0, item.quantity - (item.damagedQuantity ?? 0))}
                      </span>
                    </div>
                  )}
                  {order.orderStatus === "COMPLETED" && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Đã yêu cầu trả: {returnedQuantity}
                      </span>
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Còn có thể trả: {remainingReturnQuantity}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {}
              <div className="text-right shrink-0">
                {item.salePrice && item.salePrice < item.price ? (
                  <div className="space-y-0.5">
                    <p className="font-bold text-red-600 text-sm">
                      {formatCurrency(item.salePrice)}
                    </p>
                    <p className="text-xs text-gray-400 line-through">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                ) : (
                  <p className="font-bold text-gray-900 text-sm">
                    {formatCurrency(item.price)}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">Số lượng: x{item.quantity}</p>
                <p className="font-bold text-blue-600 mt-1">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
