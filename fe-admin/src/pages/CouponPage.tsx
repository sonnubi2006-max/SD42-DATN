import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useCouponList, useSetCouponStatus } from "@/hooks/useCoupon";
import { couponApi } from "@/api/couponApi";
import dayjs from "dayjs";
import type {
  CouponResponse,
  CouponStatus,
  CouponType,
  DiscountType,
} from "@/api/couponApi";
import { useDebounce } from "@/hooks/useDebounce";
import { exportCouponsToExcel } from "@/utils/exportCouponExcel";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CouponToolbar } from "@/components/coupon/CouponToolbar";
import type { ExportScope } from "@/components/coupon/CouponToolbar";
import { CouponTable } from "@/components/coupon/CouponTable";
import ConfirmModal from "@/components/ConfirmModal";
import Pagination from "@/components/Pagination";

export default function CouponPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const keyword = params.get("keyword") ?? "";
  const status = (params.get("status") as CouponStatus | null) ?? null;
  const type = (params.get("type") as CouponType | null) ?? null;
  const discountType =
    (params.get("discountType") as DiscountType | null) ?? null;
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";
  const page = Number(params.get("page") ?? 0);
  const size = Number(params.get("size") ?? 10);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  }

  const [searchInput, setSearchInput] = useState(keyword);
  const debouncedSearch = useDebounce(searchInput, 600);
  useEffect(() => {
    if (debouncedSearch !== keyword) {
      updateParams({ keyword: debouncedSearch || null, page: null });
    }

  }, [debouncedSearch]);

  const { data, isLoading } = useCouponList({
    keyword: keyword || undefined,
    status: status ?? undefined,
    type: type ?? undefined,
    discountType: discountType ?? undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    size,
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const rowCache = useRef<Map<number, CouponResponse>>(new Map());
  useEffect(() => {
    data?.content.forEach((c) => rowCache.current.set(c.couponId, c));
  }, [data]);

  const toggleOne = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = (ids: number[], checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });

  const { mutate: setStatus } = useSetCouponStatus();

  const handleToggleStatus = (row: CouponResponse) => {
    const getActualStatus = (r: CouponResponse): CouponStatus => {
      if (r.status === "INACTIVE") return "INACTIVE";

      const now = dayjs();
      const start = r.startDate ? dayjs(r.startDate) : null;
      const end = r.endDate ? dayjs(r.endDate) : null;

      if (end && now.isAfter(end)) return "EXPIRED";
      if (r.totalQuantity != null && r.remainingQuantity != null && r.remainingQuantity <= 0) {
        return "EXPIRED";
      }
      if (start && now.isBefore(start)) return "UPCOMING";
      return "ACTIVE";
    };

    const actualStatus = getActualStatus(row);
    const nextStatus: CouponStatus =
      actualStatus === "ACTIVE" || actualStatus === "UPCOMING"
        ? "INACTIVE"
        : "ACTIVE";

    setStatus(
      { id: row.couponId, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(
            nextStatus === "ACTIVE"
              ? "Đã kích hoạt mã giảm giá"
              : "Đã vô hiệu hoá mã giảm giá"
          );
        },
        onError: (err: any) =>
          toast.error(err?.apiMessage ?? "Thao tác thất bại"),
      }
    );
  };

  const handleReset = () => {
    setSearchInput("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async (scope: ExportScope) => {
    try {
      setExporting(true);
      let rows: CouponResponse[] = [];

      if (scope === "selected") {
        rows = [...selectedIds]
          .map((id) => rowCache.current.get(id))
          .filter((c): c is CouponResponse => Boolean(c));
        if (rows.length === 0) {
          toast.error("Chưa chọn mã giảm giá nào");
          return;
        }
      } else if (scope === "filtered") {
        const res = await couponApi.getList({
          keyword: keyword || undefined,
          status: status ?? undefined,
          type: type ?? undefined,
          discountType: discountType ?? undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: 0,
          size: size || 1000,
        });
        rows = res.content;
      } else {
        const res = await couponApi.getList({ page: 0, size: 100000 });
        rows = res.content;
      }

      exportCouponsToExcel(rows);
      toast.success(`Đã xuất ${rows.length} mã giảm giá`);
    } catch (err: any) {
      toast.error(err?.apiMessage ?? "Xuất Excel thất bại");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mã giảm giá</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý phiếu giảm giá công khai và cá nhân
          </p>
        </div>
        <Link to="/coupons/create">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" /> Thêm mã giảm giá
          </Button>
        </Link>
      </div>

      <CouponToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        onStatusChange={(v) => updateParams({ status: v, page: null })}
        type={type}
        onTypeChange={(v) => updateParams({ type: v, page: null })}
        discountType={discountType}
        onDiscountTypeChange={(v) =>
          updateParams({ discountType: v, page: null })
        }
        startDate={startDate}
        onStartDateChange={(v) =>
          updateParams({
            startDate: v || null,
            page: null,
          })
        }
        endDate={endDate}
        onEndDateChange={(v) =>
          updateParams({ endDate: v || null, page: null })
        }
        onReset={handleReset}
        selectedCount={selectedIds.size}
        exporting={exporting}
        onExport={handleExport}
      />

      <Card>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/5 border-b border-primary/10">
            <span className="text-xs text-primary font-medium">
              Đã chọn {selectedIds.size} mã giảm giá
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              Bỏ chọn
            </button>
          </div>
        )}
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-medium">
            Danh sách mã giảm giá
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 min-h-40">
          <CouponTable
            data={data?.content ?? []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onTogglePage={togglePage}
            onEdit={(row) => navigate(`/coupons/${row.couponId}`)}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
        <CardFooter className="py-4 border-t">
          <Pagination
            currentPage={data?.number ?? 1}
            totalPages={data?.totalPages ?? 1}
            totalElements={data?.totalElements ?? 0}
            first={data?.first ?? false}
            last={data?.last ?? false}
            onPageChange={(v) => updateParams({ page: v.toString() })}
            onChangeSize={(v) =>
              updateParams({ size: v.toString(), page: null })
            }
          />
        </CardFooter>
      </Card>

      {}

    </div>
  );
}
