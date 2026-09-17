import { Search, RotateCcw, Download, ChevronDown, SlidersHorizontal, ChevronUp, X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PromotionStatus, ApplyType } from "@/api/promotionApi";
import { useState } from "react";

export type ExportScope = "selected" | "filtered" | "all";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  status: PromotionStatus | null;
  onStatusChange: (v: PromotionStatus | null) => void;
  applyType: ApplyType | null;
  onApplyTypeChange: (v: ApplyType | null) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  onReset: () => void;
  selectedCount: number;
  exporting: boolean;
  onExport: (scope: ExportScope) => void;
}

export function PromotionToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  applyType,
  onApplyTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
  selectedCount,
  exporting,
  onExport,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  const hasActiveFilters =
    status !== null ||
    applyType !== null ||
    startDate !== "" ||
    endDate !== "";

  const filterCount = [
    status !== null,
    applyType !== null,
    startDate !== "",
    endDate !== "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3 w-full">
      {}
      <div className="flex items-center justify-between gap-3 w-full flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo mã hoặc tên khuyến mãi..."
              className="h-9 pl-8 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
            className="h-9 gap-1.5 text-sm"
          >
            <SlidersHorizontal size={14} />
            Bộ lọc
            {filterCount > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-medium text-white">
                {filterCount}
              </span>
            )}
            {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Button>
        </div>

        <div className="flex items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 px-4" disabled={exporting}>
                <Download size={14} />
                {exporting ? "Đang xuất…" : "Xuất Excel"}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                disabled={selectedCount === 0}
                onClick={() => onExport("selected")}
              >
                Khuyến mãi đã chọn ({selectedCount})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("filtered")}>
                Theo bộ lọc hiện tại
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("all")}>
                Tất cả khuyến mãi
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {}
      {filtersOpen && (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Áp dụng cho
              </label>
              <Select
                value={applyType ?? "ALL"}
                onValueChange={(v) =>
                  onApplyTypeChange(v === "ALL" ? null : (v as ApplyType))
                }
              >
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder="Tất cả phạm vi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả phạm vi</SelectItem>
                  <SelectItem value="PRODUCT">Sản phẩm</SelectItem>
                  <SelectItem value="CATEGORY">Danh mục</SelectItem>
                  <SelectItem value="VARIANT">Biến thể</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Trạng thái hoạt động
              </label>
              <Select
                value={status ?? "ALL"}
                onValueChange={(v) =>
                  onStatusChange(v === "ALL" ? null : (v as PromotionStatus))
                }
              >
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="UPCOMING">Sắp diễn ra</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="ENDED">Kết thúc</SelectItem>
                  <SelectItem value="CANCELLED">Đã huỷ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Từ ngày
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="h-9 text-xs bg-white"
              />
            </div>

            {}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Đến ngày
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="h-9 text-xs bg-white"
              />
            </div>
          </div>

          {}
          {hasActiveFilters && (
            <div className="flex justify-end mt-3 pt-3 border-t border-gray-200/65">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
