import { ArrowRightLeft, RotateCcw, Truck, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReturnResponse } from "@/api/returnApi";
import { formatCurrency } from "@/utils/format";
import ExchangeDeliveryDetailsModal from "./ExchangeDeliveryDetailsModal";

interface OrderReturnHistoryProps {
  returns: ReturnResponse[];
  completedRefundAmount: number;
}

export default function OrderReturnHistory({
  returns,
  completedRefundAmount,
}: OrderReturnHistoryProps) {
  const [selectedReturn, setSelectedReturn] = useState<ReturnResponse | null>(null);

  if (!returns?.length) return null;

  return (
    <Card className="border-orange-100 bg-orange-50/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="size-5 text-orange-600" />
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Thông tin đổi hàng
              </h2>
              <p className="text-xs text-gray-500">
                {returns.length} phiếu đã được cửa hàng xử lý hoàn tất
              </p>
            </div>
          </div>
          {completedRefundAmount > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Tổng tiền đã hoàn</p>
              <p className="font-bold text-orange-700">
                {formatCurrency(completedRefundAmount)}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {returns.map((returnRequest) => (
            <div
              key={returnRequest.returnId}
              className="rounded-lg border border-orange-100 bg-white p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={
                    returnRequest.returnType === "REFUND"
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }
                >
                  {returnRequest.returnType === "REFUND"
                    ? "Trả hàng / hoàn tiền"
                    : "Đổi hàng"}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(
                      returnRequest.updatedAt || returnRequest.createdAt,
                    ).toLocaleString("vi-VN")}
                  </span>
                  {returnRequest.exchangeDelivery ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs ml-2"
                      onClick={() => setSelectedReturn(returnRequest)}
                    >
                      Chi tiết
                    </Button>
                  ) : (
                    <Link to="/returns">
                      <Button variant="outline" size="sm" className="h-7 text-xs ml-2">
                        Chi tiết
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {returnRequest.items.map((item) => {
                const damaged = item.damagedQuantity ?? 0;
                const productPath = item.productCode && item.productSlug
                  ? `/products/${encodeURIComponent(item.productCode)}/${encodeURIComponent(item.productSlug)}`
                  : null;

                return (
                  <div
                    key={item.returnItemId}
                    className="flex flex-wrap justify-between gap-4 text-xs mt-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {productPath ? (
                        <Link to={productPath} className="size-12 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center transition hover:border-primary/50 hover:shadow-sm" title={`Xem sản phẩm ${item.productName}`}>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="size-full object-cover transition-transform hover:scale-105" />
                          ) : (
                            <ShoppingBag className="size-5 text-gray-300" />
                          )}
                        </Link>
                      ) : (
                        <div className="size-12 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
                          ) : (
                            <ShoppingBag className="size-5 text-gray-300" />
                          )}
                        </div>
                      )}
                      <div className="space-y-1 min-w-0">
                        {productPath ? (
                          <Link to={productPath} className="font-semibold text-gray-800 truncate transition hover:text-primary hover:underline" title={`Xem sản phẩm ${item.productName}`}>
                            {item.productName}
                          </Link>
                        ) : (
                          <p className="font-semibold text-gray-800 truncate">{item.productName}</p>
                        )}
                        <p className="text-gray-500">
                          {item.sku && <span>Mã: {item.sku} · </span>}
                          {item.color || "—"} / {item.size || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium text-gray-800 self-center shrink-0">
                      Trả {item.quantity} · Hỏng {damaged} · Tốt{" "}
                      {Math.max(0, item.quantity - damaged)}
                    </div>
                  </div>
                );
              })}

              {returnRequest.returnType === "EXCHANGE" &&
                returnRequest.exchangeItems?.length > 0 && (
                  <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-800 mt-3">
                    <p className="mb-2 flex items-center gap-1.5 font-semibold">
                      <ArrowRightLeft className="size-3.5" />
                      Sản phẩm đổi mới
                    </p>
                    {returnRequest.exchangeItems.map((item) => {
                      const productPath = item.productCode && item.productSlug
                        ? `/products/${encodeURIComponent(item.productCode)}/${encodeURIComponent(item.productSlug)}`
                        : null;

                      return (
                        <div key={item.exchangeItemId} className="flex items-center gap-3 mt-2">
                          {productPath ? (
                            <Link to={productPath} className="size-10 rounded-md border border-blue-200 bg-white overflow-hidden shrink-0 flex items-center justify-center transition hover:border-blue-400 hover:shadow-sm" title={`Xem sản phẩm ${item.productName}`}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="size-full object-cover transition-transform hover:scale-105" />
                              ) : (
                                <ShoppingBag className="size-4 text-blue-300" />
                              )}
                            </Link>
                          ) : (
                            <div className="size-10 rounded-md border border-blue-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
                              ) : (
                                <ShoppingBag className="size-4 text-blue-300" />
                              )}
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0">
                            {productPath ? (
                              <Link to={productPath} className="font-medium truncate transition hover:text-blue-700 hover:underline block" title={`Xem sản phẩm ${item.productName}`}>
                                {item.productName} × {item.quantity}
                              </Link>
                            ) : (
                              <p className="font-medium truncate">{item.productName} × {item.quantity}</p>
                            )}
                            <p className="text-blue-600/70">
                              {item.variantCode && <span>Mã: {item.variantCode} · </span>}
                              {item.color || "—"} / {item.size || "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {returnRequest.exchangeDelivery && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                  <span className="flex items-center gap-1.5 font-semibold"><Truck className="size-3.5" /> Giao hàng đổi · {returnRequest.exchangeDelivery.deliveryCode}</span>
                  <span>{{ PREPARING: "Chờ giao", SHIPPING: "Đang giao", DELIVERED: "Đã giao", FAILED_DELIVERY: "Giao thất bại", RETURNING: "Đang chuyển hoàn", RETURNED_TO_SHOP: "Đã hoàn về shop", CANCELLED: "Đã hủy", CANCELED_BY_DAMAGED: "Hủy do hàng hỏng", FAILED: "Giao thất bại" }[returnRequest.exchangeDelivery.status]}</span>
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-2 border-t pt-2 text-xs">
                <span className="text-gray-500">
                  Nhân viên xử lý:{" "}
                  <strong className="text-gray-700">
                    {returnRequest.processedByName || "Hệ thống"}
                  </strong>
                </span>
                {returnRequest.returnType === "REFUND" && (
                  <span className="font-bold text-orange-700">
                    Đã hoàn: {formatCurrency(returnRequest.refundAmount)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <ExchangeDeliveryDetailsModal 
        open={!!selectedReturn} 
        onOpenChange={(open) => !open && setSelectedReturn(null)}
        returnRequest={selectedReturn}
      />
    </Card>
  );
}
