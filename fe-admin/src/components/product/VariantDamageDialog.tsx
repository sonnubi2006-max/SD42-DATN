import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  productVariantApi,
  type ProductVariantResponse,
  type VariantDamageRecord,
} from "@/api/productVariantApi";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DamageSource = VariantDamageRecord["source"] | "ALL";

export default function VariantDamageDialog({
  variant,
}: {
  variant: ProductVariantResponse;
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 400);
  const [source, setSource] = useState<DamageSource>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "variant-damages",
      variant.variantId,
      debouncedKeyword,
      source,
      fromDate,
      toDate,
      page,
      size,
    ],
    queryFn: () =>
      productVariantApi.getDamageHistory(variant.variantId, {
        keyword: debouncedKeyword.trim() || undefined,
        source: source === "ALL" ? undefined : source,
        fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
        toDate: toDate ? `${toDate}T23:59:59` : undefined,
        page,
        size,
      }),
    enabled: open && (variant.damagedQuantity ?? 0) > 0,
  });

  const hasFilters = Boolean(keyword || source !== "ALL" || fromDate || toDate);
  const totalPages = data?.totalPages ?? 0;
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const start = Math.max(0, Math.min(page - 2, totalPages - 5));
      return start + index;
    },
  );

  const clearFilters = () => {
    setKeyword("");
    setSource("ALL");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={(variant.damagedQuantity ?? 0) === 0}
          title="Xem hóa đơn có sản phẩm hỏng"
          className="size-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
        >
          <AlertTriangle className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] min-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Lịch sử hàng hỏng · {variant.variantCode}</DialogTitle>
          <DialogDescription>
            Tổng hợp từ giao hóa đơn, kiểm nhận hàng khách trả và giao sản phẩm
            đổi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_160px_160px_auto] lg:items-end">
            <div className="space-y-1.5">
              <label
                htmlFor={`damage-keyword-${variant.variantId}`}
                className="text-xs font-semibold text-slate-600"
              >
                Tìm hóa đơn
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                  id={`damage-keyword-${variant.variantId}`}
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Nhập mã hóa đơn..."
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Nguồn ghi nhận
              </label>
              <Select
                value={source}
                onValueChange={(value: DamageSource) => {
                  setSource(value);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả nguồn</SelectItem>
                  <SelectItem value="ORDER_DELIVERY">
                    Hỏng khi giao hàng
                  </SelectItem>
                  <SelectItem value="EXCHANGE_RETURN">
                    Kiểm nhận đổi hàng
                  </SelectItem>
                  <SelectItem value="EXCHANGE_DELIVERY">
                    Hỏng khi giao hàng đổi
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Từ ngày
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                    setPage(0);
                  }}
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Đến ngày
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(event) => {
                    setToDate(event.target.value);
                    setPage(0);
                  }}
                  className="h-9 pl-9"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={!hasFilters}
              onClick={clearFilters}
              className="h-9"
            >
              <X className="size-3.5" /> Xóa lọc
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-2">
              <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
                Tổng hàng hỏng:{" "}
                {data?.totalDamagedQuantity ?? variant.damagedQuantity ?? 0}
              </span>
              {hasFilters && (
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                  Theo bộ lọc: {data?.filteredDamagedQuantity ?? 0}
                </span>
              )}
            </div>
            {isFetching && !isLoading && (
              <span className="text-slate-400">Đang cập nhật...</span>
            )}
          </div>

          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Đang tải...
            </p>
          ) : !data?.records.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Không có sản phẩm hỏng phù hợp với bộ lọc.
            </p>
          ) : (
            <div className="max-h-[45vh] overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="p-3">Hóa đơn</th>
                    <th className="p-3">Nguồn ghi nhận</th>
                    <th className="p-3 text-center">Số hỏng</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record) => (
                    <tr
                      key={`${record.source}-${record.sourceId}`}
                      className="border-t"
                    >
                      <td className="p-3  font-semibold">
                        {record.orderCode}
                      </td>
                      <td className="p-3">
                        {record.source === "EXCHANGE_RETURN"
                          ? "Kiểm nhận đổi hàng"
                          : record.source === "EXCHANGE_DELIVERY"
                            ? "Hỏng khi giao hàng đổi"
                            : "Hỏng khi giao hóa đơn"}
                      </td>
                      <td className="p-3 text-center font-bold text-red-600">
                        {record.damagedQuantity}
                      </td>
                      <td className="p-3 text-xs text-slate-500">
                        {record.recordedAt
                          ? new Date(record.recordedAt).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          title="Mở hóa đơn"
                        >
                          <Link to={`/orders/${record.orderId}`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-6 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{data?.totalElements ?? 0} bản ghi</span>
            <Select
              value={String(size)}
              onValueChange={(value) => {
                setSize(Number(value));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-20 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>/ trang</span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!data || data.first}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              title="Trang trước"
            >
              <ChevronLeft />
            </Button>
            {visiblePages.map((pageNumber) => (
              <Button
                key={pageNumber}
                type="button"
                variant={pageNumber === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber + 1}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!data || data.last}
              onClick={() => setPage((current) => current + 1)}
              title="Trang sau"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
