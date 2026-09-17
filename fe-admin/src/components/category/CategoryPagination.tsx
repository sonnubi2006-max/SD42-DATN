import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { useState } from "react";

export interface CategoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  onPageChange: (page: number) => void;
  onChangeSize: (size: number) => void;
}

type SizePage = "10" | "20" | "50" | "100";

export default function CategoryPagination({
  currentPage,
  totalPages,
  totalElements,
  first,
  last,
  onPageChange,
  onChangeSize,
}: CategoryPaginationProps) {
  const [sizePage, setSizePage] = useState<SizePage>("10");

  const maxButtons = 5;
  const start = Math.max(
    0,
    Math.min(currentPage - Math.floor(maxButtons / 2), totalPages - maxButtons),
  );
  const end = Math.min(totalPages, start + maxButtons);
  const pages = Array.from({ length: end - start }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/30">
      <span className="text-xs text-muted-foreground">
        Trang {currentPage + 1} / {totalPages} — {totalElements} danh mục
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={first}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← Trước
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={last}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau →
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-gray-500">
          Hiển thị {sizePage} sản phẩm mỗi trang
        </Label>
        <Select
          value={sizePage}
          onValueChange={(v: SizePage) => {
            onChangeSize(+v);
            setSizePage(v);
          }}
        >
          <SelectTrigger className="w-20 h-9 p-4">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent className="p-2">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
