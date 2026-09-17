import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  ChevronRight,
  Inbox,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ReturnResponse, ReturnStatus, ReturnType } from "@/api/returnApi";
import { useReturnList } from "@/hooks/useReturn";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CreateReturnModal from "@/components/return/CreateReturnModal";

type StatusFilter = ReturnStatus | "ALL";

const STATUS_CONFIG: Record<
  ReturnStatus,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  PENDING: {
    label: "Chờ xử lý",
    shortLabel: "Chờ xử lý",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
  },
  APPROVED: {
    label: "Đã duyệt · Chờ nhận hàng",
    shortLabel: "Đã duyệt",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    dotClass: "bg-blue-500",
  },
  REJECTED: {
    label: "Đã từ chối",
    shortLabel: "Từ chối",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    shortLabel: "Hoàn thành",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  },
};

const getStringParam = (
  searchParams: URLSearchParams,
  key: string,
  fallback = "",
) => searchParams.get(key) ?? fallback;

const getNumberParam = (
  searchParams: URLSearchParams,
  key: string,
  fallback: number,
) => {
  const value = Number(searchParams.get(key));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const money = (value: number) => `${(value ?? 0).toLocaleString("vi-VN")}đ`;

const getReturnTypeLabel = (type: ReturnType) =>
  type === "EXCHANGE" ? "Đổi hàng" : "Hoàn tiền";

function StatusBadge({ status }: { status: ReturnStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${config.badgeClass}`}
    >
      <span className={`size-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </Badge>
  );
}

function ReturnMobileCard({
  request,
  sequenceNumber,
  onOpen,
}: {
  request: ReturnResponse;
  sequenceNumber: number;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            STT {sequenceNumber}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            Phiếu hoàn trả #{request.returnId}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
          {(request.customerName?.trim()?.[0] || "K").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-800">
            {request.customerName}
          </p>
          <p className="text-xs text-slate-500">{request.customerPhone}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
        <div>
          <p className="text-slate-400">Hình thức</p>
          <p className="mt-0.5 font-bold text-slate-700">
            {getReturnTypeLabel(request.returnType)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-400">
            {request.returnType === "EXCHANGE" ? "Giá trị đổi" : "Tiền hoàn"}
          </p>
          <p className="mt-0.5 font-medium text-orange-700">
            {money(request.refundAmount)}
          </p>
        </div>
        <div className="col-span-2 border-t border-slate-200 pt-3">
          <p className="text-slate-400">Nhân viên xử lý</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-700">
            <UserRound className="size-3.5 text-slate-400" />
            {request.processedByName || "Chưa xử lý"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
        <span>{new Date(request.createdAt).toLocaleString("vi-VN")}</span>
        <span className="flex items-center gap-1 font-bold text-slate-600">
          Xem chi tiết <ArrowRight className="size-3" />
        </span>
      </div>
    </button>
  );
}

export default function ReturnPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlKeyword = getStringParam(searchParams, "keyword");
  const urlStatus =
    (searchParams.get("status") as StatusFilter | null) ?? "ALL";
  const urlFromDate = getStringParam(searchParams, "fromDate");
  const urlToDate = getStringParam(searchParams, "toDate");
  const urlPage = getNumberParam(searchParams, "page", 0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState(urlKeyword);
  const debouncedSearch = useDebounce(search, 500);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (!value || value === "ALL") next.delete(key);
        else next.set(key, value);
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    if (debouncedSearch !== urlKeyword) {
      updateParams({ keyword: debouncedSearch || null, page: null });
    }
  }, [debouncedSearch, updateParams, urlKeyword]);

  const queryParams = {
    status: urlStatus === "ALL" ? undefined : urlStatus,
    keyword: urlKeyword || undefined,
    fromDate: urlFromDate ? `${urlFromDate}T00:00:00` : undefined,
    toDate: urlToDate ? `${urlToDate}T23:59:59` : undefined,
    page: urlPage,
    size: 10,
    sort: "createdAt,desc",
  };

  const {
    data: returnPage,
    isLoading,
    isFetching,
  } = useReturnList(queryParams);
  const { data: pendingPage } = useReturnList({
    status: "PENDING",
    page: 0,
    size: 1,
  });
  const { data: approvedPage } = useReturnList({
    status: "APPROVED",
    page: 0,
    size: 1,
  });
  const { data: rejectedPage } = useReturnList({
    status: "REJECTED",
    page: 0,
    size: 1,
  });
  const { data: completedPage } = useReturnList({
    status: "COMPLETED",
    page: 0,
    size: 1,
  });

  const statusTotals: Record<ReturnStatus, number> = {
    PENDING: pendingPage?.totalElements ?? 0,
    APPROVED: approvedPage?.totalElements ?? 0,
    REJECTED: rejectedPage?.totalElements ?? 0,
    COMPLETED: completedPage?.totalElements ?? 0,
  };
  const allCount = Object.values(statusTotals).reduce(
    (total, value) => total + value,
    0,
  );
  const hasFilters = Boolean(urlKeyword || urlFromDate || urlToDate);

  const selectStatus = (status: StatusFilter) =>
    updateParams({ status, page: null });

  const resetFilters = () => {
    setSearch("");
    updateParams({
      keyword: null,
      fromDate: null,
      toDate: null,
      page: null,
    });
  };

  return (
    <div className="pb-8">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 bg-white px-4 pt-4 sm:px-6">
          <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Quản lý đổi hàng lỗi
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Kiểm nhận sản phẩm lỗi và chuẩn bị sản phẩm thay thế cho khách.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="h-10 gap-2 rounded-xl bg-blue-500 px-4 text-xs font-medium text-white hover:bg-blue-600"
            >
              <Plus className="size-4" />
              Tạo yêu cầu đổi hàng
            </Button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {(
              ["ALL", "PENDING", "APPROVED", "COMPLETED", "REJECTED"] as const
            ).map((status) => {
              const active = urlStatus === status;
              const count = status === "ALL" ? allCount : statusTotals[status];
              return (
                <button
                  type="button"
                  key={status}
                  onClick={() => selectStatus(status)}
                  className={`relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-xs font-bold transition ${
                    active
                      ? "text-slate-950"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {status === "ALL"
                    ? "Tất cả"
                    : STATUS_CONFIG[status].shortLabel}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Mã đơn, khách hàng hoặc số điện thoại"
                  className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-xs shadow-none"
                />
                {isFetching && !isLoading && (
                  <RefreshCw className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
                <CalendarDays className="size-4 shrink-0 text-slate-400" />
                <Input
                  type="date"
                  aria-label="Từ ngày"
                  value={urlFromDate}
                  onChange={(event) =>
                    updateParams({
                      fromDate: event.target.value || null,
                      page: null,
                    })
                  }
                  className="h-9 min-w-0 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                />
                <span className="text-xs font-semibold text-slate-300">→</span>
                <Input
                  type="date"
                  aria-label="Đến ngày"
                  value={urlToDate}
                  onChange={(event) =>
                    updateParams({
                      toDate: event.target.value || null,
                      page: null,
                    })
                  }
                  className="h-9 min-w-0 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 xl:justify-end">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <ListFilter className="size-3.5" />
                {returnPage?.totalElements ?? 0} kết quả
              </span>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-9 gap-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <RefreshCw className="size-3.5" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3">
              <div className="size-9 animate-spin rounded-full border-3 border-slate-200 border-t-orange-500" />
              <p className="text-xs font-semibold text-slate-500">
                Đang tải yêu cầu hoàn trả...
              </p>
            </div>
          ) : !returnPage?.content?.length ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox className="size-7" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-slate-800">
                Chưa có yêu cầu phù hợp
              </h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Thử thay đổi trạng thái, khoảng ngày hoặc từ khóa tìm kiếm để
                xem các yêu cầu khác.
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg text-xs font-bold"
                >
                  Đặt lại bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1120px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-left">
                      <th className="w-16 px-4 py-3 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        STT
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Mã hoàn trả
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Khách hàng
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Hình thức
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Nhân viên xử lý
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Giá trị
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                        Trạng thái
                      </th>
                      <th className="w-14 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returnPage.content.map((request, index) => (
                      <tr
                        key={request.returnId}
                        onClick={() => navigate(`/returns/${request.returnId}`)}
                        className="group cursor-pointer bg-white transition hover:bg-orange-50/30"
                      >
                        <td className="px-4 py-4 text-center text-xs font-bold text-slate-400">
                          {urlPage * queryParams.size + index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-slate-900">
                            Phiếu #{request.returnId}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                              {(
                                request.customerName?.trim()?.[0] || "K"
                              ).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-48 truncate text-xs font-bold text-slate-800">
                                {request.customerName}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {request.customerPhone}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={`gap-1.5 rounded-lg text-[10px] font-bold ${
                              request.returnType === "EXCHANGE"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-orange-200 bg-orange-50 text-orange-700"
                            }`}
                          >
                            {request.returnType === "EXCHANGE" ? (
                              <ArrowRightLeft className="size-3" />
                            ) : (
                              <WalletCards className="size-3" />
                            )}
                            {getReturnTypeLabel(request.returnType)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <UserRound className="size-3.5" />
                            </div>
                            <span
                              className={`max-w-40 truncate text-xs font-bold ${
                                request.processedByName
                                  ? "text-slate-700"
                                  : "text-slate-400"
                              }`}
                            >
                              {request.processedByName || "Chưa xử lý"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-medium text-slate-900">
                            {money(request.refundAmount)}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {request.returnType === "EXCHANGE"
                              ? "Giá trị hàng đổi"
                              : "Tiền hoàn dự kiến"}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-[11px] leading-5 text-slate-500">
                          <p>
                            {new Date(request.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                          <p>
                            {new Date(request.createdAt).toLocaleTimeString(
                              "vi-VN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex size-8 items-center justify-center rounded-full text-slate-300 transition group-hover:bg-white group-hover:text-orange-600 group-hover:shadow-sm">
                            <ChevronRight className="size-4" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 bg-slate-50/50 p-4 md:hidden">
                {returnPage.content.map((request, index) => (
                  <ReturnMobileCard
                    key={request.returnId}
                    request={request}
                    sequenceNumber={urlPage * queryParams.size + index + 1}
                    onOpen={() => navigate(`/returns/${request.returnId}`)}
                  />
                ))}
              </div>
            </>
          )}

          {returnPage && returnPage.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs font-semibold text-slate-500">
                Trang {urlPage + 1}/{returnPage.totalPages} ·{" "}
                {returnPage.totalElements.toLocaleString("vi-VN")} yêu cầu
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={urlPage === 0}
                  onClick={() =>
                    updateParams({
                      page: String(Math.max(0, urlPage - 1)),
                    })
                  }
                  className="h-9 flex-1 gap-1.5 rounded-lg text-xs font-bold sm:flex-none"
                >
                  <ArrowLeft className="size-3.5" />
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={urlPage >= returnPage.totalPages - 1}
                  onClick={() =>
                    updateParams({
                      page: String(
                        Math.min(returnPage.totalPages - 1, urlPage + 1),
                      ),
                    })
                  }
                  className="h-9 flex-1 gap-1.5 rounded-lg text-xs font-bold sm:flex-none"
                >
                  Trang sau
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateReturnModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
