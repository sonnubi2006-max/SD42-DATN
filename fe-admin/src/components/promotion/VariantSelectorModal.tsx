import { useEffect, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useProductVariantList } from "@/hooks/useProductVariant";
import { useProductList, useProductPriceRange } from "@/hooks/useProduct";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface VariantSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
}

export function VariantSelectorModal({
  open,
  onOpenChange,
  selectedIds,
  onSelect,
}: VariantSelectorModalProps) {
  if (!open) return null;

  return (
    <OpenVariantSelectorModal
      open={open}
      onOpenChange={onOpenChange}
      selectedIds={selectedIds}
      onSelect={onSelect}
    />
  );
}

function OpenVariantSelectorModal({
  onOpenChange,
  selectedIds,
  onSelect,
}: VariantSelectorModalProps) {
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<number>>(
    () => new Set(selectedIds),
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [productId, setProductId] = useState<string>("all");
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

  const { data: productData } = useProductList({
    page: 0,
    size: 1000,
    sort: "productName",
    direction: "asc",
    status: "ACTIVE",
  });
  const { data: variantData, isLoading } = useProductVariantList({
    page,
    size,
    sort: sortOption,
    keyword: debouncedSearch || undefined,
    productId: productId === "all" ? undefined : Number(productId),
    minPrice: debouncedPriceRange[0] > minLimit ? debouncedPriceRange[0] : undefined,
    maxPrice: debouncedPriceRange[1] < maxLimit ? debouncedPriceRange[1] : undefined,
    status: "ACTIVE",
  });

  const products = productData?.content ?? [];
  const variants = variantData?.content ?? [];
  const totalPages = variantData?.totalPages ?? 1;
  const totalElements = variantData?.totalElements ?? 0;

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

  const currentPageIds = variants.map((v) => v.variantId);
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
    setProductId("all");
    setPriceRange([minLimit, maxLimit]);
    setSortOption("createdAt,desc");
    setPage(0);
  };

  const activeFilterCount = [
    productId !== "all",
    priceRange[0] > minLimit || priceRange[1] < maxLimit,
    sortOption !== "createdAt,desc",
  ].filter(Boolean).length;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg font-semibold text-foreground">
            Chọn biến thể sản phẩm áp dụng khuyến mãi
          </DialogTitle>
        </DialogHeader>

        {}
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã biến thể, mã vạch, kích cỡ hoặc màu sắc..."
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
              value={productId}
              onValueChange={(value) => {
                setProductId(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-60 text-xs">
                <SelectValue placeholder="Tất cả sản phẩm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sản phẩm</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.productId} value={String(product.productId)}>
                    {product.productCode} — {product.productName}
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
                <TableHead className="w-32">Mã biến thể</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="w-24">Màu sắc</TableHead>
                <TableHead className="w-24">Kích cỡ</TableHead>
                <TableHead className="w-32 text-right">Giá bán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Đang tải biến thể…
                    </div>
                  </TableCell>
                </TableRow>
              ) : variants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    Không tìm thấy biến thể nào
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((v, index) => {
                  const isChecked = tempSelectedIds.has(v.variantId);
                  const imageUrl = v.image?.imageUrl;

                  return (
                    <TableRow
                      key={v.variantId}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => toggleOne(v.variantId)}
                    >
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOne(v.variantId)}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">
                        {page * size + index + 1}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={v.variantCode}
                            className="w-10 h-10 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-xs">
                        {v.variantCode}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {v.productName || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.color || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.size || "—"}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-right">
                        {v.price.toLocaleString("vi-VN")}đ
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
            Đã chọn: <strong className="text-foreground">{tempSelectedIds.size}</strong> biến thể | Tổng số {totalElements} biến thể
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
