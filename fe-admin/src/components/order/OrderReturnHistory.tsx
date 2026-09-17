import { ArrowRightLeft, RotateCcw, Truck, ShoppingBag } from "lucide-react";
import type {
  ExchangeDeliveryStatus,
  ReturnResponse,
  ReturnStatus,
} from "@/api/returnApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface OrderReturnHistoryProps {
  returns: ReturnResponse[];
  completedRefundAmount: number;
}

const money = (value: number) => `${(value ?? 0).toLocaleString("vi-VN")}đ`;

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  PENDING: "Chờ xử lý",
  APPROVED: "Đã duyệt, chờ nhận hàng",
  REJECTED: "Đã từ chối",
  COMPLETED: "Đã kiểm nhận hàng trả",
};

const RETURN_STATUS_STYLES: Record<ReturnStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-blue-200 bg-blue-50 text-blue-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const DELIVERY_STATUS_LABELS: Record<ExchangeDeliveryStatus, string> = {
  PREPARING: "Chờ giao hàng đổi",
  SHIPPING: "Đang giao hàng đổi",
  DELIVERED: "Đã giao hàng đổi",
  FAILED_DELIVERY: "Giao hàng đổi thất bại",
  RETURNING: "Đang hoàn hàng đổi về cửa hàng",
  RETURNED_TO_SHOP: "Đã hoàn hàng đổi về cửa hàng",
  CANCELLED: "Đã hủy giao hàng đổi",
  CANCELED_BY_DAMAGED: "Hủy do hàng đổi bị hư hỏng",
  FAILED: "Giao hàng đổi thất bại",
};

const DELIVERY_STATUS_STYLES: Record<ExchangeDeliveryStatus, string> = {
  PREPARING: "border-amber-200 bg-amber-50 text-amber-700",
  SHIPPING: "border-blue-200 bg-blue-50 text-blue-700",
  DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED_DELIVERY: "border-red-200 bg-red-50 text-red-700",
  RETURNING: "border-purple-200 bg-purple-50 text-purple-700",
  RETURNED_TO_SHOP: "border-slate-300 bg-slate-100 text-slate-700",
  CANCELLED: "border-slate-300 bg-slate-100 text-slate-700",
  CANCELED_BY_DAMAGED: "border-red-200 bg-red-50 text-red-700",
  FAILED: "border-red-200 bg-red-50 text-red-700",
};

const getDeliveryDescription = (status: ExchangeDeliveryStatus) => {
  const descriptions: Record<ExchangeDeliveryStatus, string> = {
    PREPARING: "Sản phẩm đổi đã được xuất kho và đang chờ bàn giao vận chuyển.",
    SHIPPING: "Sản phẩm đổi đang trên đường giao đến khách hàng.",
    DELIVERED: "Khách hàng đã nhận sản phẩm đổi.",
    FAILED_DELIVERY: "Lần giao sản phẩm đổi không thành công.",
    RETURNING: "Sản phẩm đổi đang được chuyển hoàn về cửa hàng.",
    RETURNED_TO_SHOP: "Cửa hàng đã nhận lại sản phẩm đổi bị chuyển hoàn.",
    CANCELLED: "Phiếu giao sản phẩm đổi đã bị hủy.",
    CANCELED_BY_DAMAGED: "Phiếu giao bị hủy do sản phẩm đổi hư hỏng.",
    FAILED: "Quá trình giao sản phẩm đổi gặp lỗi.",
  };
  return descriptions[status];
};

export default function OrderReturnHistory({
  returns,
  completedRefundAmount,
}: OrderReturnHistoryProps) {
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
                {returns.length} lần hoàn/đổi đã được ghi nhận
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="text-gray-500">Tổng tiền đã hoàn</p>
            <p className="font-bold text-orange-700">
              {money(completedRefundAmount)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {returns.map((returnRequest) => (
            <div
              key={returnRequest.returnId}
              className="rounded-lg border border-orange-100 bg-white p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
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
                  <span className="text-xs font-semibold text-gray-700">
                    Phiếu #{returnRequest.returnId}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge
                    variant="outline"
                    className={RETURN_STATUS_STYLES[returnRequest.status]}
                  >
                    {RETURN_STATUS_LABELS[returnRequest.status]}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Cập nhật:{" "}
                    {new Date(
                      returnRequest.updatedAt || returnRequest.createdAt,
                    ).toLocaleString("vi-VN")}
                  </span>
                  <Link to={`/returns/${returnRequest.returnId}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs ml-2">
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                {returnRequest.items.map((item) => {
                  const damaged = item.damagedQuantity ?? 0;
                  const productPath = item.productId
                    ? `/products/${item.productId}/edit`
                    : null;

                  return (
                    <div
                      key={item.returnItemId}
                      className="flex flex-wrap justify-between gap-4 text-xs mt-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {productPath ? (
                          <Link to={productPath} className="size-10 rounded-md border bg-muted overflow-hidden shrink-0 flex items-center justify-center transition hover:border-primary/50 hover:shadow-sm" title={`Mở sản phẩm ${item.productName}`}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="size-full object-cover transition-transform hover:scale-105" />
                            ) : (
                              <ShoppingBag className="size-4 text-gray-300" />
                            )}
                          </Link>
                        ) : (
                          <div className="size-10 rounded-md border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.productName} className="size-full object-cover" />
                            ) : (
                              <ShoppingBag className="size-4 text-gray-300" />
                            )}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          {productPath ? (
                            <Link to={productPath} className="font-semibold text-gray-800 truncate transition hover:text-primary hover:underline" title={`Mở sản phẩm ${item.productName}`}>
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
              </div>

              {returnRequest.returnType === "EXCHANGE" &&
                returnRequest.exchangeItems?.length > 0 && (
                  <div className="rounded-md bg-blue-50 p-3 text-xs">
                    <div className="mb-2 flex items-center gap-1.5 font-semibold text-blue-700">
                      <ArrowRightLeft className="size-3.5" />
                      Sản phẩm đổi mới
                    </div>
                    {returnRequest.exchangeItems.map((item) => {
                      const productPath = item.productId
                        ? `/products/${item.productId}/edit`
                        : null;

                      return (
                        <div key={item.exchangeItemId} className="flex items-center gap-3 mt-2">
                          {productPath ? (
                            <Link to={productPath} className="size-10 rounded-md border border-blue-200 bg-white overflow-hidden shrink-0 flex items-center justify-center transition hover:border-blue-400 hover:shadow-sm" title={`Mở sản phẩm ${item.productName}`}>
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
                              <Link to={productPath} className="font-medium truncate text-blue-900 transition hover:text-blue-700 hover:underline block" title={`Mở sản phẩm ${item.productName}`}>
                                {item.productName} × {item.quantity}
                              </Link>
                            ) : (
                              <p className="font-medium truncate text-blue-900">{item.productName} × {item.quantity}</p>
                            )}
                            <p className="text-blue-700/70">
                              {item.variantCode && <span>Mã: {item.variantCode} · </span>}
                              {item.color || "—"} / {item.size || "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-3 border-t border-blue-100 pt-3">
                      {returnRequest.exchangeDelivery ? (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                DELIVERY_STATUS_STYLES[
                                returnRequest.exchangeDelivery.status
                                ]
                              }
                            >
                              {
                                DELIVERY_STATUS_LABELS[
                                returnRequest.exchangeDelivery.status
                                ]
                              }
                            </Badge>
                            <span className=" text-[11px] text-blue-700">
                              {returnRequest.exchangeDelivery.deliveryCode}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-blue-800">
                            {getDeliveryDescription(
                              returnRequest.exchangeDelivery.status,
                            )}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700">
                          Chưa tạo phiếu giao sản phẩm đổi.
                        </p>
                      )}
                    </div>
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
                    Đã hoàn: {money(returnRequest.refundAmount)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
