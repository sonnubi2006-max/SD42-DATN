import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type { CategoryStatus } from "@/api/categoryApi";
import type { ChangeEvent } from "react";
import { Search } from "lucide-react";

export interface CategoryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  status: CategoryStatus | null;
  onStatusChange: (value: CategoryStatus | null) => void;

  direction: "asc" | "desc";
  onDirectionChange: (value: "asc" | "desc") => void;
}

export default function CategoryToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  direction,
  onDirectionChange,
}: CategoryToolbarProps) {
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 max-sm:flex-wrap">
      {}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Tìm kiếm theo mã, tên"
          className="pl-8 h-9 w-48 text-sm"
        />
      </div>

      {}
      <Select
        value={status ?? "ALL"}
        onValueChange={(val) =>
          onStatusChange(val === "ALL" ? null : (val as CategoryStatus))
        }
      >
        <SelectTrigger className="w-36 h-9 py-4">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tất cả</SelectItem>
          <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
          <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
        </SelectContent>
      </Select>

      {}
      <Select
        value={direction}
        onValueChange={(val) => onDirectionChange(val as "asc" | "desc")}
      >
        <SelectTrigger className="w-32 h-9 py-4">
          <SelectValue placeholder="Sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Mới nhất</SelectItem>
          <SelectItem value="asc">Cũ nhất</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
