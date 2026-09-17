import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Clock3,
  Eye,
  Inbox,
  Loader2,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { ReturnResponse, ReturnStatus, ReturnType } from "@/api/returnApi";
import { RETURN_STATUS_LABEL } from "@/api/returnApi";
import { useMyReturns } from "@/hooks/useReturn";
import { formatCurrency } from "@/utils/format";
import AccountLayout from "@/components/account/AccountLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<
  ReturnStatus,
  {
    label: string;
    badgeClass: string;
    icon: typeof Clock3;
    progress: number;
  }
> = {
  PENDING: {
    label: "Chờ cửa hàng xử lý",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
    progress: 33,
  },
  APPROVED: {
    label: "Đã duyệt · Chờ nhận hàng",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    icon: PackageCheck,
    progress: 66,
  },
  REJECTED: {
    label: "Yêu cầu bị từ chối",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    icon: CircleX,
    progress: 100,
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    progress: 100,
  },
};

const returnTypeLabel = (type: ReturnType) =>
  type === "EXCHANGE" ? "Đổi sản phẩm" : "Trả hàng · Hoàn tiền";

function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${config.badgeClass}`}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}

function ReturnDetailDialog({
  request,
  onClose,
}: {
  request: ReturnResponse | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white text-gray-900 sm:max-w-2xl">
        {request && (
          <>
            <DialogHeader className="border-b border-slate-100 pb-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge
                  variant="outline"
                  className="rounded-lg border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wider text-slate-600"
                >
                  Phiếu #{request.returnId}
                </Badge>
                <ReturnStatusBadge status={request.status} />
              </div>
              <DialogTitle className="text-lg font-medium text-slate-950">
                Chi tiết yêu cầu hoàn trả
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Tạo lúc {new Date(request.createdAt).toLocaleString("vi-VN")}
              </DialogDescription>
            </DialogHeader>

            {request.returnType === "EXCHANGE" && (
              <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="size-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-blue-900">
                        {request.exchangeFulfillmentMethod === "STORE_PICKUP"
                          ? "Đổi tại cửa hàng"
                          : "Giao sản phẩm đổi"}
                      </p>
                      <p className="text-[10px] text-blue-700">
                        {request.exchangeDelivery?.deliveryCode ??
                          "Chờ cửa hàng kiểm nhận và tạo phiếu giao"}
                      </p>
                    </div>
                  </div>
                  {request.exchangeDelivery && (
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-white text-blue-700"
                    >
                      {
                        {
                          PREPARING: "Chờ giao",
                          SHIPPING: "Đang giao",
                          DELIVERED: "Đã giao",
                          FAILED_DELIVERY: "Giao thất bại",
                          RETURNING: "Đang chuyển hoàn",
                          RETURNED_TO_SHOP: "Đã hoàn về shop",
                          CANCELLED: "Đã hủy",
                          CANCELED_BY_DAMAGED: "Hủy do hàng hỏng",
                          FAILED: "Giao thất bại",
                        }[request.exchangeDelivery.status]
                      }
                    </Badge>
                  )}
                </div>
                {request.exchangeFulfillmentMethod === "DELIVERY" && (
                  <div className="mt-3 grid gap-1 text-[11px] text-blue-800 sm:grid-cols-2">
                    <span>
                      Người nhận:{" "}
                      <strong>
                        {request.exchangeReceiverName} ·{" "}
                        {request.exchangeReceiverPhone}
                      </strong>
                    </span>
                    <span>
                      Phí giao:{" "}
                      <strong>
                        {(request.exchangeShippingFee ?? 0).toLocaleString(
                          "vi-VN",
                        )}
                        đ
                      </strong>
                    </span>
                    <span className="sm:col-span-2">
                      Địa chỉ:{" "}
                      <strong>{request.exchangeDeliveryAddress}</strong>
                    </span>
                  </div>
                )}
              </section>
            )}

            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Đơn hàng
                  </p>
                  <Link
                    to={`/orders/${request.orderId}`}
                    onClick={onClose}
                    className="mt-1 block truncate text-xs font-medium text-blue-700 hover:underline"
                  >
                    {request.orderCode}
                  </Link>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hình thức
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-800">
                    {returnTypeLabel(request.returnType)}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl bg-orange-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                    {request.returnType === "EXCHANGE"
                      ? "Giá trị hàng đổi"
                      : "Số tiền hoàn"}
                  </p>
                  <p className="mt-1 text-lg font-medium text-orange-700">
                    {formatCurrency(request.refundAmount)}
                  </p>
                </div>
              </div>

              {request.status === "REJECTED" && request.rejectReason && (
                <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">Lý do cửa hàng từ chối</p>
                    <p className="mt-1 leading-5">{request.rejectReason}</p>
                  </div>
                </div>
              )}

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Sản phẩm hoàn trả
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400">
                    {request.items.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    )}{" "}
                    sản phẩm
                  </span>
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {request.items.map((item) => (
                    <div
                      key={item.returnItemId}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-slate-900">
                          {item.productName}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {item.color || "—"} · Size {item.size || "—"} · Số
                          lượng {item.quantity}
                        </p>
                        {item.reason && (
                          <p className="mt-2 text-[11px] italic text-amber-700">
                            “{item.reason}”
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <p className="text-xs font-medium text-slate-900">
                          {formatCurrency(item.refundPrice)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Giá mua {formatCurrency(item.originalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {request.returnType === "EXCHANGE" &&
                request.exchangeItems?.length > 0 && (
                  <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <h3 className="flex items-center gap-2 text-xs font-medium text-blue-800">
                      <ArrowRightLeft className="size-4" />
                      Sản phẩm được đổi mới
                    </h3>
                    <div className="mt-3 space-y-2">
                      {request.exchangeItems.map((item) => (
                        <div
                          key={item.exchangeItemId}
                          className="flex justify-between gap-3 text-xs text-blue-800"
                        >
                          <span>
                            {item.productName} · {item.color || "—"} /{" "}
                            {item.size || "—"}
                          </span>
                          <strong>× {item.quantity}</strong>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

              {request.note && (
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Ghi chú của bạn
                  </p>
                  <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-700">
                    {request.note}
                  </p>
                </section>
              )}

              {(request.images || request.processedImages) && (
                <section>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                    Hình ảnh xác nhận
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[request.images, request.processedImages]
                      .filter(Boolean)
                      .flatMap((value) => value?.split(",") ?? [])
                      .filter(Boolean)
                      .map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="size-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:border-orange-300"
                        >
                          <img
                            src={url}
                            alt={`Ảnh hoàn trả ${index + 1}`}
                            className="size-full object-cover"
                          />
                        </a>
                      ))}
                  </div>
                </section>
              )}

              <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <ShieldCheck className="size-4 text-emerald-600" />
                Nhân viên xử lý:{" "}
                <strong className="text-slate-800">
                  {request.processedByName || "Chưa phân công"}
                </strong>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ReturnHistoryPage() {
  const [page, setPage] = useState(0);
  const [selectedReturn, setSelectedReturn] = useState<ReturnResponse | null>(
    null,
  );
  const { data, isLoading } = useMyReturns({ page, size: 8 });

  return (
    <AccountLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-orange-300">
                <RotateCcw className="size-4" />
                Lịch sử hoàn trả
              </div>
              <h1 className="text-2xl font-medium tracking-tight">
                Yêu cầu đổi hàng của bạn
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Theo dõi trạng thái, số tiền hoàn và kết quả xử lý từ cửa hàng.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tổng yêu cầu
                </p>
                <p className="mt-0.5 text-xl font-medium">
                  {data?.totalElements ?? 0}
                </p>
              </div>
              <Link to="/orders">
                <Button className="h-11 rounded-xl bg-orange-500 px-4 text-xs font-medium text-white hover:bg-orange-600">
                  Xem đơn mua
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-900">
              Danh sách yêu cầu
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Chọn một yêu cầu để xem đầy đủ thông tin xử lý
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Trang {page + 1}/{Math.max(data?.totalPages ?? 1, 1)}
          </span>
        </div>

        {isLoading ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="size-8 animate-spin text-orange-500" />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải lịch sử hoàn trả...
            </p>
          </div>
        ) : !data?.content?.length ? (
          <Card className="rounded-2xl border-2 border-dashed border-slate-200 py-14 text-center">
            <CardContent className="flex flex-col items-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="size-7" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-slate-900">
                Bạn chưa có yêu cầu hoàn trả
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Mở chi tiết một đơn hàng đã hoàn thành để bắt đầu đổi hàng hoặc
                đổi sản phẩm.
              </p>
              <Link to="/orders" className="mt-4">
                <Button size="sm" className="rounded-lg text-xs font-bold">
                  Xem đơn mua hàng
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.content.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              const StatusIcon = statusConfig.icon;
              const totalQuantity = request.items.reduce(
                (total, item) => total + item.quantity,
                0,
              );

              return (
                <article
                  key={request.returnId}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                >
                  <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.25fr_1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Phiếu #{request.returnId}
                        </span>
                        <ReturnStatusBadge status={request.status} />
                        {request.exchangeDelivery && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-blue-200 bg-blue-50 text-[10px] text-blue-700"
                          >
                            <Truck className="size-3" />
                            {
                              {
                                PREPARING: "Chờ giao đổi",
                                SHIPPING: "Đang giao đổi",
                                DELIVERED: "Đã giao đổi",
                                FAILED_DELIVERY: "Giao đổi thất bại",
                                RETURNING: "Đang chuyển hoàn",
                                RETURNED_TO_SHOP: "Đã hoàn về shop",
                                CANCELLED: "Đã hủy giao đổi",
                                CANCELED_BY_DAMAGED: "Hủy do hàng hỏng",
                                FAILED: "Giao đổi thất bại",
                              }[request.exchangeDelivery.status]
                            }
                          </Badge>
                        )}
                      </div>
                      <Link
                        to={`/orders/${request.orderId}`}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-900 hover:text-blue-700"
                      >
                        Đơn hàng {request.orderCode}
                        <ChevronRight className="size-3.5" />
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {returnTypeLabel(request.returnType)} · {totalQuantity}{" "}
                        sản phẩm
                      </p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-[10px] font-bold">
                        <span className="flex items-center gap-1.5 text-slate-500">
                          <StatusIcon className="size-3.5" />
                          {RETURN_STATUS_LABEL[request.status]}
                        </span>
                        <span className="text-slate-400">
                          {statusConfig.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${request.status === "REJECTED"
                              ? "bg-rose-500"
                              : request.status === "COMPLETED"
                                ? "bg-emerald-500"
                                : request.status === "APPROVED"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            }`}
                          style={{ width: `${statusConfig.progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400">
                        Cập nhật{" "}
                        {new Date(
                          request.updatedAt || request.createdAt,
                        ).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <div className="lg:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {request.returnType === "EXCHANGE"
                            ? "Giá trị đổi"
                            : "Tiền hoàn"}
                        </p>
                        <p className="mt-1 text-base font-medium text-orange-700">
                          {formatCurrency(request.refundAmount)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedReturn(request)}
                        className="size-9 rounded-full border-slate-200 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700"
                        aria-label={`Xem phiếu hoàn trả ${request.returnId}`}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="gap-1.5 rounded-lg text-xs font-bold"
            >
              <ArrowLeft className="size-3.5" />
              Trước
            </Button>
            <span className="text-xs font-bold text-slate-500">
              {page + 1} / {data.totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= data.totalPages - 1}
              onClick={() =>
                setPage((current) => Math.min(data.totalPages - 1, current + 1))
              }
              className="gap-1.5 rounded-lg text-xs font-bold"
            >
              Sau
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      <ReturnDetailDialog
        request={selectedReturn}
        onClose={() => setSelectedReturn(null)}
      />
    </AccountLayout>
  );
}
