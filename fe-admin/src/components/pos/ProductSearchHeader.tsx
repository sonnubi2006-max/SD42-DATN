import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatNumberWithCommas, parseNumberFromCommas } from "./posUtils";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  brandId: string;
  onBrandChange: (v: string) => void;
  minPrice: string;
  onMinPriceChange: (v: string) => void;
  maxPrice: string;
  onMaxPriceChange: (v: string) => void;
  showFilter: boolean;
  onToggleFilter: () => void;
  categoryList?: { content: { categoryId: number; categoryName: string }[] };
  brandList?: { content: { brandId: number; brandName: string }[] };
}

export default function ProductSearchHeader({
  search, onSearchChange, categoryId, onCategoryChange, brandId, onBrandChange,
  minPrice, onMinPriceChange, maxPrice, onMaxPriceChange, showFilter, onToggleFilter,
  categoryList, brandList,
}: Props) {
  return (
    <div className="mb-3 flex-shrink-0 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm sản phẩm, mã hàng, mã vạch..."
            className="pl-8 h-9 text-sm bg-background border-input"
          />
        </div>
        <Button
          variant={showFilter ? "default" : "outline"}
          size="sm"
          onClick={onToggleFilter}
          className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <SlidersHorizontal size={14} /> Bộ lọc
        </Button>
      </div>
      {showFilter && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-2.5">
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-8 w-36 text-xs bg-background"><SelectValue placeholder="Danh mục" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categoryList?.content.map((c) => <SelectItem key={c.categoryId} value={String(c.categoryId)}>{c.categoryName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={brandId} onValueChange={onBrandChange}>
            <SelectTrigger className="h-8 w-36 text-xs bg-background"><SelectValue placeholder="Thương hiệu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thương hiệu</SelectItem>
              {brandList?.content.map((b) => <SelectItem key={b.brandId} value={String(b.brandId)}>{b.brandName}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Giá từ"
              value={formatNumberWithCommas(minPrice)}
              onChange={(e) => onMinPriceChange(parseNumberFromCommas(e.target.value))}
              className="h-8 w-28 text-xs bg-background "
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Đến"
              value={formatNumberWithCommas(maxPrice)}
              onChange={(e) => onMaxPriceChange(parseNumberFromCommas(e.target.value))}
              className="h-8 w-28 text-xs bg-background "
            />
          </div>
          {(categoryId !== "all" || brandId !== "all" || minPrice || maxPrice) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:bg-destructive/10 gap-1 cursor-pointer"
              onClick={() => { onCategoryChange("all"); onBrandChange("all"); onMinPriceChange(""); onMaxPriceChange(""); }}
            >
              <RotateCcw size={12} />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
