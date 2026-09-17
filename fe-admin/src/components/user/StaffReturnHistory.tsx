import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, Package, ChevronRight, Search, X, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useReturnList } from "@/hooks/useReturn";
import type { ReturnStatus } from "@/api/returnApi";

interface Props {
  staffId: number;
}

const RETURN_STATUS_MAP: Record<ReturnStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Đã chấp nhận", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Từ chối", color: "bg-rose-100 text-rose-700" },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700" },
};

const money = (n: number) => (n ?? 0).toLocaleString("vi-VN") + " đ";

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
};

const PAGE_SIZE = 10;

export default function StaffReturnHistory({ staffId }: Props) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: returnPage, isLoading } = useReturnList({
    fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
    toDate: toDate ? `${toDate}T23:59:59` : undefined,
    page: 0,
    size: 1000,
  });

  const allRequests = returnPage?.content ?? [];
  const returnRequests = allRequests.filter(req => {
    if (req.processedById !== staffId) return false;
    if (!debouncedSearch) return true;
    const lowerSearch = debouncedSearch.toLowerCase();
    return req.orderCode?.toLowerCase().includes(lowerSearch) || req.returnId.toString().includes(lowerSearch);
  });

  const totalElements = returnRequests.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);
  const isFirst = page === 0;
  const isLast = page >= Math.max(totalPages - 1, 0);
  const startItem = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const endItem = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const currentRequests = returnRequests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, fromDate, toDate]);

  return (
    <Card>
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <RotateCcw className="size-4 text-orange-500" />
              Lịch sử đổi hàng
            </CardTitle>
            <CardDescription className="mt-1">
              Danh sách các yêu cầu đổi trả mà nhân viên này đã xử lý
            </CardDescription>
          </div>
          {!isLoading && returnRequests.length > 0 && (
            <span className="text-xs text-muted-foreground font-semibold bg-muted px-2.5 py-1 rounded-full">
              {returnRequests.length} yêu cầu
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Bộ lọc */}
        <div className="flex flex-col sm:flex-row gap-3 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã đơn hàng đổi trả..."
              className="pl-9 h-9 text-xs bg-white border-gray-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Từ</span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 w-[130px] text-xs bg-white border-gray-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Đến</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 w-[130px] text-xs bg-white border-gray-200"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, n) => (
              <div key={n} className="flex items-center gap-4 p-3.5 border rounded-xl animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : returnRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="p-3 rounded-full bg-muted/50">
              <Package className="size-7 text-muted-foreground opacity-60" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              Không có dữ liệu
            </p>
            <p className="text-xs text-muted-foreground/70">
              Nhân viên này chưa xử lý yêu cầu đổi trả nào khớp với bộ lọc
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentRequests.map((req) => {
              const statusInfo = RETURN_STATUS_MAP[req.status] ?? {
                label: req.status,
                color: "bg-gray-100 text-gray-600",
              };
              return (
                <Link
                  key={req.returnId}
                  to={`/returns/${req.returnId}`}
                  className="group flex items-center gap-3.5 p-3.5 border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-150"
                >
                  <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <RotateCcw className="size-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-800 group-hover:text-orange-700 transition-colors">
                        Đơn #{req.orderCode}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-muted rounded-md text-muted-foreground">
                        {req.returnType === "REFUND" ? "Trả hàng hoàn tiền" : "Đổi hàng"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                      <span>{fmtDate(req.createdAt)}</span>
                      {req.returnType === "REFUND" && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="font-bold text-gray-700">
                            Hoàn {money(req.refundAmount)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <ChevronRight className="size-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        { }
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            { }
            <span className="text-xs text-gray-500 font-medium">
              Hiển thị{" "}
              <span className="font-bold text-gray-700">
                {startItem}–{endItem}
              </span>{" "}
              /{" "}
              <span className="font-bold text-gray-700">
                {totalElements}
              </span>{" "}
              yêu cầu
            </span>

            { }
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={isFirst}
                className="h-8 w-8 p-0 rounded-lg border-gray-200 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>

              { }
              {Array.from({ length: totalPages }).map((_, i) => {
                const isActive = i === page;

                const showPage =
                  i === 0 ||
                  i === totalPages - 1 ||
                  Math.abs(i - page) <= 1;

                if (!showPage) {
                  const prevShown =
                    i === 1 ||
                    i === totalPages - 2 ||
                    Math.abs(i - 1 - page) <= 1;
                  if (!prevShown) return null;
                  return (
                    <span
                      key={i}
                      className="text-xs text-gray-400 px-1 select-none"
                    >
                      …
                    </span>
                  );
                }

                return (
                  <Button
                    key={i}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(i)}
                    className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${isActive
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        : "border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                  >
                    {i + 1}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={isLast}
                className="h-8 w-8 p-0 rounded-lg border-gray-200 disabled:opacity-40"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
