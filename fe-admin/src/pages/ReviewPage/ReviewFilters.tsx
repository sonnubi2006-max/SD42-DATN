import { Search, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReviewFiltersProps {
  keyword: string;
  fromDate: string;
  toDate: string;
  selectedRating: number | "ALL";
  onChange: (name: string, value: string) => void;
  onReset: () => void;
}

export default function ReviewFilters({
  keyword,
  fromDate,
  toDate,
  selectedRating,
  onChange,
  onReset,
}: ReviewFiltersProps) {
  return (
    <div className="space-y-3 border-b border-gray-100 p-5">
      <div className="grid gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tên khách, nội dung, mã sản phẩm hoặc mã biến thể..."
            value={keyword}
            onChange={(event) => onChange("keyword", event.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_180px_180px_auto] lg:items-end">
        <label className="space-y-1 text-xs text-gray-500">
          <span>Từ ngày</span>
          <Input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => onChange("fromDate", event.target.value)}
            className="h-9 text-xs"
          />
        </label>
        <label className="space-y-1 text-xs text-gray-500">
          <span>Đến ngày</span>
          <Input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => onChange("toDate", event.target.value)}
            className="h-9 text-xs"
          />
        </label>
        <label className="space-y-1 text-xs text-gray-500">
          <span>Số sao</span>
          <Select
            value={String(selectedRating)}
            onValueChange={(value) => onChange("rating", value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả số sao</SelectItem>
              {[5, 4, 3, 2, 1].map((rating) => (
                <SelectItem key={rating} value={String(rating)}>
                  {rating} sao
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={onReset} className="h-9 w-fit gap-1.5">
          <RotateCcw size={14} /> Đặt lại bộ lọc
        </Button>
      </div>
    </div>
  );
}
