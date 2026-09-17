import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/api/categoryApi";
import type { Brand } from "@/api/brandApi";

interface ProductSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  brandId: string;
  onBrandChange: (value: string) => void;
  categories?: Category[];
  brands?: Brand[];
}

export default function ProductSearchBar({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  brandId,
  onBrandChange,
  categories,
  brands,
}: ProductSearchBarProps) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm tên, mã hàng, mã vạch, màu, kích cỡ, thương hiệu..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 pl-9"
        />
      </div>
      <Select value={categoryId} onValueChange={onCategoryChange}>
        <SelectTrigger className="h-10 lg:w-48">
          <SelectValue placeholder="Danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả danh mục</SelectItem>
          {categories?.map((c) => (
            <SelectItem key={c.categoryId} value={String(c.categoryId)}>
              {c.categoryName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={brandId} onValueChange={onBrandChange}>
        <SelectTrigger className="h-10 lg:w-44">
          <SelectValue placeholder="Thương hiệu" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả brand</SelectItem>
          {brands?.map((brand) => (
            <SelectItem key={brand.brandId} value={String(brand.brandId)}>
              {brand.brandName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
