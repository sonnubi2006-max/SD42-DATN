import { useEffect, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useProductList, useProductPriceRange } from "@/hooks/useProduct";
import { useCategoryList } from "@/hooks/useCategory";
import { useBrandList } from "@/hooks/useBrand";
import { useDebounce } from "@/hooks/useDebounce";
import { PriceRangeSlider } from "./PriceRangeSlider";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface ProductSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
}

export function ProductSelectorModal({
  open,
  onOpenChange,
  selectedIds,
  onSelect,
}: ProductSelectorModalProps) {
  if (!open) return null;

  return (
    <OpenProductSelectorModal
      open={open}
      onOpenChange={onOpenChange}
      selectedIds={selectedIds}
      onSelect={onSelect}
    />
  );
}

function OpenProductSelectorModal({
  onOpenChange,
  selectedIds,
  onSelect,
}: ProductSelectorModalProps) {
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<number>>(
    () => new Set(selectedIds),
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [brandId, setBrandId] = useState<string>("all");
  const { data: priceRangeData } = useProductPriceRange();
  const minLimit = Number(priceRangeData?.min ?? 0);
  const maxLimit = Number(priceRangeData?.max ?? 10_000_000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10_000_000]);
  const [sortOption, setSortOption] = useState("createdAt,desc");
  const debouncedPriceRange = useDebounce(priceRange, 400);
  const [page, setPage] = useState(0);
  const size = 5;

  useEffect(() => {
    setPriceRange([minLimit, maxLimit]);
  }, [minLimit, maxLimit]);

  const { data: categoryData } = useCategoryList({ status: "ACTIVE", size: 100 });
  const { data: brandData } = useBrandList({ status: "ACTIVE", size: 100 });
  const [sort, direction] = sortOption.split(",") as [string, "asc" | "desc"];
  const { data: productData, isLoading } = useProductList({
    page,
    size,
    sort,
    direction,
    keyword: debouncedSearch || undefined,
    categoryId: categoryId === "all" ? undefined : Number(categoryId),
    brandId: brandId === "all" ? undefined : Number(brandId),
    minPrice: debouncedPriceRange[0] > minLimit ? debouncedPriceRange[0] : undefined,
    maxPrice: debouncedPriceRange[1] < maxLimit ? debouncedPriceRange[1] : undefined,
    status: "ACTIVE",
  });

  const categories = categoryData?.content ?? [];
  const brands = brandData?.content ?? [];
  const products = productData?.content ?? [];
  const totalPages = productData?.totalPages ?? 1;
  const totalElements = productData?.totalElements ?? 0;

  const toggleOne = (id: number) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const currentPageIds = products.map((p) => p.productId);
  const allCurrentChecked =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => tempSelectedIds.has(id));

  const togglePage = (checked: boolean) => {
    setTempSelectedIds((prev) => {
      const next = new Set(prev);
      currentPageIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
  };

  const handleSave = () => {
    onSelect(Array.from(tempSelectedIds));
    onOpenChange(false);
  };

  const resetFilters = () => {
    setSearchInput("");
    setCategoryId("all");
    setBrandId("all");
    setPriceRange([minLimit, maxLimit]);
    setSortOption("createdAt,desc");
    setPage(0);
  };

  const activeFilterCount = [
    categoryId !== "all",
    brandId !== "all",
    priceRange[0] > minLimit || priceRange[1] < maxLimit,
    sortOption !== "createdAt,desc",
  ].filter(Boolean).length;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Chọn sản phẩm áp dụng khuyến mãi
          </DialogTitle>
        </DialogHeader>

        {}
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã hoặc tên sản phẩm..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-9.5 text-sm"
            />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setPage(0);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Xóa nội dung tìm kiếm"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex h-9.5 items-center gap-1.5 rounded-md border bg-muted/30 px-3 text-xs text-muted-foreground">
              <SlidersHorizontal className="size-3.5" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
            <Select
              value={categoryId}
              onValueChange={(val) => {
                setCategoryId(val);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-48 h-9 text-xs">
                <SelectValue placeholder="Tất cả danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.categoryId} value={String(cat.categoryId)}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={brandId}
              onValueChange={(val) => {
                setBrandId(val);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-48 h-9 text-xs">
                <SelectValue placeholder="Tất cả thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.brandId} value={String(brand.brandId)}>
                    {brand.brandName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <PriceRangeSlider
              min={minLimit}
              max={maxLimit}
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value);
                setPage(0);
              }}
            />

            <Select
              value={sortOption}
              onValueChange={(value) => {
                setSortOption(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt,desc">Mới nhất</SelectItem>
                <SelectItem value="createdAt,asc">Cũ nhất</SelectItem>
                <SelectItem value="price,asc">Giá thấp đến cao</SelectItem>
                <SelectItem value="price,desc">Giá cao đến thấp</SelectItem>
              </SelectContent>
            </Select>

            {(activeFilterCount > 0 || searchInput) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 gap-1 text-xs text-muted-foreground"
              >
                <RotateCcw className="size-3.5" /> Xóa bộ lọc
              </Button>
            )}
          </div>
        </div>

        {}
        <div className="flex-1 overflow-y-auto border rounded-lg bg-background min-h-60">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary/80 backdrop-blur z-10">
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={allCurrentChecked}
                    onCheckedChange={(checked) => togglePage(Boolean(checked))}
                  />
                </TableHead>
                <TableHead className="w-16">STT</TableHead>
                <TableHead className="w-18">Ảnh</TableHead>
                <TableHead className="w-32">Mã sản phẩm</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead className="w-40">Danh mục</TableHead>
                <TableHead className="w-36">Thương hiệu</TableHead>
                <TableHead className="w-40 text-right">Khoảng giá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Đang tải sản phẩm…
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p, index) => {
                  const isChecked = tempSelectedIds.has(p.productId);
                  const thumbnail =
                    p.images?.find((img) => img.isThumbnail) ?? p.images?.[0];
                  const prices = (p.variants ?? [])
                    .filter((variant) => variant.status === "ACTIVE")
                    .map((variant) =>
                      variant.salePrice && variant.salePrice > 0
                        ? variant.salePrice
                        : variant.price,
                    );
                  const minPrice = prices.length ? Math.min(...prices) : null;
                  const maxPrice = prices.length ? Math.max(...prices) : null;

                  return (
                    <TableRow
                      key={p.productId}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleOne(p.productId)}
                    >
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOne(p.productId)}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">
                        {page * size + index + 1}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {thumbnail ? (
                          <img
                            src={thumbnail.imageUrl}
                            alt={p.productName}
                            className="w-10 h-10 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        {p.productCode}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {p.productName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.category?.categoryName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.brand?.brandName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold">
                        {minPrice == null
                          ? "—"
                          : minPrice === maxPrice
                            ? `${minPrice.toLocaleString("vi-VN")}đ`
                            : `${minPrice.toLocaleString("vi-VN")}đ – ${maxPrice?.toLocaleString("vi-VN")}đ`}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {}
        <div className="flex items-center justify-between pt-4 border-t mt-4 flex-wrap gap-3">
          <span className="text-sm text-muted-foreground">
            Đã chọn: <strong className="text-foreground">{tempSelectedIds.size}</strong> sản phẩm | Tổng số {totalElements} sản phẩm
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Trang {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>

        {}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button type="button" onClick={handleSave}>
            Lưu lựa chọn ({tempSelectedIds.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
