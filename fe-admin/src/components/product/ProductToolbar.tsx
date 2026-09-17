import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Plus,
  SlidersHorizontal,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import type { ProductStatus } from "@/api/productApi";
import { SearchableSelect, type ItemsSearchable } from "../SearchableSelect";
import type { Category } from "@/api/categoryApi";
import type { Brand } from "@/api/brandApi";
import { Slider } from "../ui/slider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface ProductToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: ProductStatus | "";
  onStatusChange: (v: ProductStatus | "") => void;
  direction: "asc" | "desc";
  onDirectionChange: (v: "asc" | "desc") => void;
  categoryId: number | null;
  onCagegoryChange: (id: number | null) => void;
  brandId: number | null;
  onBrandChange: (id: number | null) => void;
  minPrice: number | null;
  maxPrice: number | null;
  categories: Category[];
  onPriceChange: (min: number | null, max: number | null) => void;
  brands: Brand[];
  onCreate: () => void;
  onResetFilters: () => void;
  onExport: (type: "selected" | "filtered" | "all") => void;
  hasSelection: boolean;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Đang bán" },
  { value: "INACTIVE", label: "Tạm dừng" },
  { value: "OUT_OF_STOCK", label: "Hết hàng" },
];

const DIRECTION_OPTIONS: { value: string; label: string }[] = [
  { value: "desc", label: "Mới nhất" },
  { value: "asc", label: "Cũ nhất" },
];

const PRICE_MIN = 0;
const PRICE_MAX = 10_000_000;
const PRICE_STEP = 50_000;

function formatPrice(v: number) {
  return v.toLocaleString("vi-VN") + "đ";
}

export function SearchBar({
  search,
  onSearchChange,
  onCreate,
  filterCount,
  filtersOpen,
  onToggleFilters,
  onExport,
  hasSelection,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
  filterCount: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onExport: (type: "selected" | "filtered" | "all") => void;
  hasSelection: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã, tên sản phẩm..."
            className="h-9 pl-3 pr-8 text-sm"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
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
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 px-4">
              <Download size={14} /> Xuất Excel
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40">
            <DropdownMenuItem
              onClick={() => onExport("selected")}
              disabled={!hasSelection}
            >
              Sản phẩm đã chọn
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("filtered")}>
              Theo bộ lọc hiện tại
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("all")}>
              Tất cả sản phẩm
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          onClick={onCreate}
          size="lg"
          className="gap-1.5 h-9 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus size={15} /> Thêm sản phẩm
        </Button>
      </div>
    </div>
  );
}

export function FilterPanel({
  status,
  onStatusChange,
  direction,
  onDirectionChange,
  categoryId,
  onCagegoryChange,
  brandId,
  onBrandChange,
  priceRange,
  onPriceRangeChange,
  categories,
  brands,
  hasActiveFilters,
  onResetFilters,
  minLimit,
  maxLimit,
}: {
  status: ProductStatus | "";
  onStatusChange: (v: ProductStatus | "") => void;
  direction: "asc" | "desc";
  onDirectionChange: (v: "asc" | "desc") => void;
  categoryId: number | null;
  onCagegoryChange: (id: number | null) => void;
  brandId: number | null;
  onBrandChange: (id: number | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (v: [number, number]) => void;
  categories: Category[];
  brands: Brand[];
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  minLimit: number;
  maxLimit: number;
}) {
  const categoryList = useMemo(
    () =>
      categories.map<ItemsSearchable>((i) => ({
        id: i.categoryId,
        name: i.categoryName,
      })),
    [categories],
  );

  const brandList = useMemo(
    () =>
      brands.map<ItemsSearchable>((i) => ({
        id: i.brandId,
        name: i.brandName,
      })),
    [brands],
  );

  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <div className="flex items-center gap-2 flex-wrap">
        {}
        <Select
          value={status || "all"}
          onValueChange={(v) =>
            onStatusChange(v === "all" ? "" : (v as ProductStatus))
          }
        >
          <SelectTrigger className="w-40 h-8 p-4 text-xs">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {}
        <SearchableSelect
          items={categoryList}
          value={categoryId}
          onChangeSelect={onCagegoryChange}
          search=""
          title="Danh mục"
        />

        {}
        <SearchableSelect
          items={brandList}
          value={brandId}
          onChangeSelect={onBrandChange}
          search=""
          title="Thương hiệu"
        />

        {}
        <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs bg-white"
            >
              <SlidersHorizontal size={13} />
              Khoảng giá
              {(priceRange[0] !== minLimit || priceRange[1] !== maxLimit) && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{formatPrice(priceRange[0])}</span>
                <span className="text-gray-300">—</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>

              <Slider
                value={priceRange}
                onValueChange={(v) => onPriceRangeChange(v as [number, number])}
                min={minLimit}
                max={maxLimit}
                step={PRICE_STEP}
              />

              <div className="flex justify-between text-[10px] text-gray-400">
                <span>{formatPrice(minLimit)}</span>
                <span>{formatPrice(maxLimit)}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {}
        <Select
          value={direction}
          onValueChange={(v) => onDirectionChange(v as "asc" | "desc")}
        >
          <SelectTrigger className="w-36 h-8 p-4 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="lg"
            onClick={onResetFilters}
            className="h-9 gap-1 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50"
          >
            <RotateCcw size={12} /> Xoá bộ lọc
          </Button>
        )}
      </div>
    </div>
  );
}

import { useProductPriceRange } from "@/hooks/useProduct";

export default function ProductToolbar(props: ProductToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);

  const { data: priceRangeData } = useProductPriceRange();
  const minLimit = priceRangeData?.min ?? PRICE_MIN;
  const maxLimit = priceRangeData?.max ?? PRICE_MAX;

  const [priceRange, setPriceRange] = useState<[number, number]>([
    props.minPrice ?? minLimit,
    props.maxPrice ?? maxLimit,
  ]);

  const isDraggingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onPriceRef = useRef(props.onPriceChange);

  useEffect(() => {
    onPriceRef.current = props.onPriceChange;
  }, [props.onPriceChange]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setPriceRange([props.minPrice ?? minLimit, props.maxPrice ?? maxLimit]);
    }
  }, [props.minPrice, props.maxPrice, minLimit, maxLimit]);

  const debouncedCommit = useCallback((range: [number, number]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const min = range[0] === minLimit ? null : range[0];
      const max = range[1] === maxLimit ? null : range[1];
      onPriceRef.current(min, max);
    }, 400);
  }, [minLimit, maxLimit]);

  const handlePriceDrag = useCallback(
    (v: [number, number]) => {
      isDraggingRef.current = true;
      setPriceRange(v);
      debouncedCommit(v);
    },
    [debouncedCommit],
  );

  useEffect(() => {
    if (!isDraggingRef.current) return;
    const t = setTimeout(() => {
      isDraggingRef.current = false;
    }, 600);
    return () => clearTimeout(t);
  }, [priceRange]);

  const hasActiveFilters =
    props.status !== "" ||
    props.categoryId != null ||
    props.brandId != null ||
    props.minPrice != null ||
    props.maxPrice != null ||
    props.direction !== "desc";

  const filterCount = [
    props.status !== "",
    props.categoryId != null,
    props.brandId != null,
    props.minPrice != null || props.maxPrice != null,
    props.direction !== "desc",
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <SearchBar
        search={props.search}
        onSearchChange={props.onSearchChange}
        onCreate={props.onCreate}
        filterCount={filterCount}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((o) => !o)}
        hasSelection={props.hasSelection}
        onExport={props.onExport}
      />
      {filtersOpen && (
        <FilterPanel
          status={props.status}
          onStatusChange={props.onStatusChange}
          direction={props.direction}
          onDirectionChange={props.onDirectionChange}
          categoryId={props.categoryId}
          onCagegoryChange={props.onCagegoryChange}
          brandId={props.brandId}
          onBrandChange={props.onBrandChange}
          priceRange={priceRange}
          onPriceRangeChange={handlePriceDrag}
          categories={props.categories}
          brands={props.brands}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={props.onResetFilters}
          minLimit={minLimit}
          maxLimit={maxLimit}
        />
      )}
    </div>
  );
}
