import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/common/Pagination";
import {
  useBrands,
  useCategories,
  useProducts,
  useProductPriceRange,
} from "@/hooks/useCatalog";
import type { ProductFilterParams } from "@/api/productApi";
import { formatCurrency, formatNumber } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get("keyword") ?? "";
  const categoryId = searchParams.get("categoryId");
  const brandId = searchParams.get("brandId");
  const sort = searchParams.get("sort") ?? "createdAt,desc";
  const page = Number(searchParams.get("page") ?? "0");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: priceRange } = useProductPriceRange();

  const [tempMinPrice, setTempMinPrice] = useState<string>("");
  const [tempMaxPrice, setTempMaxPrice] = useState<string>("");

  useEffect(() => {
    if (minPrice) {
      setTempMinPrice(minPrice);
    } else if (priceRange) {
      setTempMinPrice(String(priceRange.min));
    }
  }, [minPrice, priceRange]);

  useEffect(() => {
    if (maxPrice) {
      setTempMaxPrice(maxPrice);
    } else if (priceRange) {
      setTempMaxPrice(String(priceRange.max));
    }
  }, [maxPrice, priceRange]);

  const params: ProductFilterParams = useMemo(
    () => ({
      page,
      size: 12,
      sort,
      keyword: keyword || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      brandId: brandId ? Number(brandId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [page, sort, keyword, categoryId, brandId, minPrice, maxPrice],
  );

  const { data, isLoading, isFetching } = useProducts(params);

  const setParam = (key: string, value?: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  const hasFilters = !!(keyword || categoryId || brandId || minPrice || maxPrice);

  const applyPriceSliderFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (priceRange) {
        if (tempMinPrice && Number(tempMinPrice) > priceRange.min) {
          next.set("minPrice", tempMinPrice);
        } else {
          next.delete("minPrice");
        }

        if (tempMaxPrice && Number(tempMaxPrice) < priceRange.max) {
          next.set("maxPrice", tempMaxPrice);
        } else {
          next.delete("maxPrice");
        }
      }
      next.delete("page");
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {}
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Sản phẩm</h1>
        <p className="text-sm text-muted-foreground">
          {data ? `${formatNumber(data.totalElements)} sản phẩm` : "Đang tải…"}
          {keyword && ` cho "${keyword}"`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {}
        <aside className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-2 border-b pb-3 border-border">
            <Filter className="size-4 text-foreground" />
            <span className="font-bold text-sm tracking-wide uppercase text-foreground">Bộ lọc tìm kiếm</span>
          </div>

          {}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Theo Danh mục</h3>
            <div className="space-y-2.5 pr-2">
              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={!categoryId}
                  onCheckedChange={() => setParam("categoryId", undefined)}
                />
                <span className={!categoryId ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}>
                  Tất cả danh mục
                </span>
              </label>

              {categories?.content?.map((c) => {
                const isSelected = String(c.categoryId) === categoryId;
                return (
                  <label key={c.categoryId} className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => setParam("categoryId", isSelected ? undefined : String(c.categoryId))}
                    />
                    <span className={isSelected ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}>
                      {c.categoryName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <h3 className="text-sm font-semibold text-foreground">Theo Thương hiệu</h3>
            <div className="space-y-2.5 pr-2">
              <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                <Checkbox
                  checked={!brandId}
                  onCheckedChange={() => setParam("brandId", undefined)}
                />
                <span className={!brandId ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}>
                  Tất cả thương hiệu
                </span>
              </label>
              {brands?.content?.map((b) => {
                const isSelected = String(b.brandId) === brandId;
                return (
                  <label key={b.brandId} className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => setParam("brandId", isSelected ? undefined : String(b.brandId))}
                    />
                    <span className={isSelected ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"}>
                      {b.brandName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {}
          {priceRange && priceRange.max > priceRange.min && (
            <div className="space-y-3 pt-4 border-t border-border/60">
              <h3 className="text-sm font-semibold text-foreground">Khoảng giá</h3>
              <div className="flex flex-col gap-2 rounded-lg bg-muted/20 border p-3 border-border/50 shadow-2xs">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-medium">
                  <span>Khoảng giá:</span>
                </div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 text-center my-0.5">
                  {formatCurrency(Number(tempMinPrice || priceRange.min))} - {formatCurrency(Number(tempMaxPrice || priceRange.max))}
                </div>
                <div className="relative h-6 flex items-center">
                  {}
                  <div className="absolute left-0 right-0 h-1 bg-secondary rounded-lg" />
                  {}
                  <div
                    className="absolute h-1 bg-indigo-600 dark:bg-indigo-400 rounded-lg"
                    style={{
                      left: `${((Number(tempMinPrice || priceRange.min) - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                      right: `${100 - ((Number(tempMaxPrice || priceRange.max) - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`
                    }}
                  />
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step={10000}
                    value={tempMinPrice || priceRange.min}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), Number(tempMaxPrice || priceRange.max) - 10000);
                      setTempMinPrice(String(val));
                    }}
                    onMouseUp={applyPriceSliderFilter}
                    onTouchEnd={applyPriceSliderFilter}
                    className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer accent-indigo-600 dark:accent-indigo-400 focus:outline-hidden [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                  />
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step={10000}
                    value={tempMaxPrice || priceRange.max}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), Number(tempMinPrice || priceRange.min) + 10000);
                      setTempMaxPrice(String(val));
                    }}
                    onMouseUp={applyPriceSliderFilter}
                    onTouchEnd={applyPriceSliderFilter}
                    className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none cursor-pointer accent-indigo-600 dark:accent-indigo-400 focus:outline-hidden [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                  <span>{formatCurrency(priceRange.min)}</span>
                  <span>{formatCurrency(priceRange.max)}</span>
                </div>
              </div>
            </div>
          )}

          {}
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setSearchParams(new URLSearchParams());
                if (priceRange) {
                  setTempMinPrice(String(priceRange.min));
                  setTempMaxPrice(String(priceRange.max));
                }
              }}
            >
              <X className="mr-1.5 size-3.5" /> Xóa tất cả bộ lọc
            </Button>
          )}
        </aside>

        {}
        <main className="lg:col-span-9 space-y-6">
          {}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/40 p-3 dark:bg-slate-900/40 border border-border/50">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-muted-foreground font-medium text-xs">Sắp xếp theo:</span>

              {}
              <button
                onClick={() => setParam("sort", "createdAt,desc")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer border transition-all duration-200",
                  sort === "createdAt,desc"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-foreground hover:bg-accent border-border"
                )}
              >
                Mới nhất
              </button>

              {}
              <button
                onClick={() => setParam("sort", "averageRating,desc")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer border transition-all duration-200",
                  sort === "averageRating,desc"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-foreground hover:bg-accent border-border"
                )}
              >
                Bán chạy / Đánh giá cao
              </button>

              {}
              <button
                onClick={() => setParam("sort", "createdAt,asc")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer border transition-all duration-200",
                  sort === "createdAt,asc"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-foreground hover:bg-accent border-border"
                )}
              >
                Cũ nhất
              </button>
            </div>

            {}
            <div className="flex items-center gap-2">
              <Select
                value={sort.startsWith("variants.price") ? sort : "default"}
                onValueChange={(v) => setParam("sort", v === "default" ? undefined : v)}
              >
                <SelectTrigger className="h-8 w-44 text-xs bg-background">
                  <SelectValue placeholder="Giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Giá: Mặc định</SelectItem>
                  <SelectItem value="variants.price,asc">Giá: Thấp đến Cao</SelectItem>
                  <SelectItem value="variants.price,desc">Giá: Cao đến Thấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {}
          <div className="relative">
            {isFetching && !isLoading && (
              <div className="absolute top-2 right-2 z-10 rounded-full bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-xs border border-border shadow-xs">
                Đang cập nhật…
              </div>
            )}
            <ProductGrid products={data?.content} isLoading={isLoading} skeletonCount={12} />
          </div>

          {}
          {data && data.totalPages > 1 && (
            <Pagination
              className="mt-8"
              currentPage={data.number}
              totalPages={data.totalPages}
              onPageChange={(p) => setParam("page", String(p))}
            />
          )}
        </main>
      </div>
    </div>
  );
}
