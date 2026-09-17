import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  usePromotionList,
  useTogglePromotionStatus,
} from "@/hooks/usePromotion";
import { promotionApi } from "@/api/promotionApi";
import type { PromotionResponse, PromotionStatus, ApplyType } from "@/api/promotionApi";
import { useDebounce } from "@/hooks/useDebounce";
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
import { PromotionToolbar } from "@/components/promotion/PromotionToolbar";
import type { ExportScope } from "@/components/promotion/PromotionToolbar";
import { PromotionTable } from "@/components/promotion/PromotionTable";
import Pagination from "@/components/Pagination";

export default function PromotionPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const keyword = params.get("keyword") ?? "";
  const status = (params.get("status") as PromotionStatus | null) ?? null;
  const applyType = (params.get("applyType") as ApplyType | null) ?? null;
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

  const { data, isLoading } = usePromotionList({
    keyword: keyword || undefined,
    status: status ?? undefined,
    applyType: applyType ?? undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    size,
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const rowCache = useRef<Map<number, PromotionResponse>>(new Map());
  useEffect(() => {
    data?.content.forEach((p) => rowCache.current.set(p.promotionId, p));
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

  const { mutate: toggleStatus } = useTogglePromotionStatus();

  const handleToggleStatus = (row: PromotionResponse) => {
    if (row.status === "ENDED") {
      toast.error("Chương trình đã kết thúc, không thể đổi trạng thái");
      return;
    }
    toggleStatus(row.promotionId, {
      onSuccess: () => {
        toast.success("Đã thay đổi trạng thái chương trình");
      },
      onError: (err: any) =>
        toast.error(err?.apiMessage ?? "Thao tác thất bại"),
    });
  };

  const handleReset = () => {
    setSearchInput("");
    setParams(new URLSearchParams(), { replace: true });
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async (scope: ExportScope) => {
    try {
      setExporting(true);
      let rows: PromotionResponse[] = [];

      if (scope === "selected") {
        rows = [...selectedIds]
          .map((id) => rowCache.current.get(id))
          .filter((p): p is PromotionResponse => Boolean(p));
        if (rows.length === 0) {
          toast.error("Chưa chọn chương trình nào");
          return;
        }
      } else if (scope === "filtered") {
        const res = await promotionApi.getList({
          keyword: keyword || undefined,
          status: status ?? undefined,
          applyType: applyType ?? undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: 0,
          size: size || 1000,
        });
        rows = res.content;
      } else {
        const res = await promotionApi.getList({ page: 0, size: 100000 });
        rows = res.content;
      }

      const header = "STT,Ten,Ap dung,Giam gia,Giam toi da,Bat dau,Ket thuc,Trang thai\n";
      const csvRows = rows.map((r, i) => {
        const discount = r.discountType === "PERCENTAGE"
          ? `${r.discountValue}%`
          : `${r.discountValue}`;
        const maxDiscount = r.maxDiscountAmount != null ? `${r.maxDiscountAmount}` : "";
        const start = r.startDate ? r.startDate.slice(0, 10) : "";
        const end = r.endDate ? r.endDate.slice(0, 10) : "";
        return `${i + 1},"${r.name}",${r.applyType},${discount},${maxDiscount},${start},${end},${r.status}`;
      });
      const csv = header + csvRows.join("\n");

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `promotions_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Đã xuất ${rows.length} chương trình`);
    } catch (err: any) {
      toast.error(err?.apiMessage ?? "Xuất CSV thất bại");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Khuyến mãi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý chương trình giảm giá theo sản phẩm, danh mục hoặc toàn đơn hàng
          </p>
        </div>
        <Link to="/promotions/create">
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" /> Thêm khuyến mãi
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            Tìm kiếm khuyến mãi
            <PromotionToolbar
              search={searchInput}
              onSearchChange={setSearchInput}
              status={status}
              onStatusChange={(v) => updateParams({ status: v, page: null })}
              applyType={applyType}
              onApplyTypeChange={(v) => updateParams({ applyType: v, page: null })}
              startDate={startDate}
              onStartDateChange={(v) => updateParams({ startDate: v, page: null })}
              endDate={endDate}
              onEndDateChange={(v) => updateParams({ endDate: v, page: null })}
              onReset={handleReset}
              selectedCount={selectedIds.size}
              exporting={exporting}
              onExport={handleExport}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 min-h-40">
          <PromotionTable
            data={data?.content ?? []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onTogglePage={togglePage}
            onEdit={(row) => navigate(`/promotions/${row.promotionId}`)}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
        <CardFooter>
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
    </div>
  );
}
