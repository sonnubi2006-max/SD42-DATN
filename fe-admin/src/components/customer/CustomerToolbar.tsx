import { Search, RotateCcw, Download, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CustomerStatus, CustomerSource } from "@/api/customerApi";

export type ExportScope = "selected" | "filtered" | "all";

interface Props {
  search: string;
  direction: string;
  onSearchChange: (v: string) => void;
  onDirectionChange: (v: string) => void;
  status: CustomerStatus | null;
  onStatusChange: (v: CustomerStatus | null) => void;
  onReset: () => void;
  selectedCount: number;
  exporting: boolean;
  onExport: (scope: ExportScope) => void;
}

export function CustomerToolbar({
  search,
  direction,
  onSearchChange,
  onDirectionChange,
  status,
  onStatusChange,
  onReset,
  selectedCount,
  exporting,
  onExport,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b">
      <span className="text-sm font-medium">Danh sách khách hàng</span>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex items-center">
          <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã, tên, email, SĐT..."
            className="pl-8 w-64"
          />
        </div>

        <Select
          value={status ?? "ALL"}
          onValueChange={(v) =>
            onStatusChange(v === "ALL" ? null : (v as CustomerStatus))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Ngừng</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={direction ?? "desc"}
          onValueChange={(v) =>
            onDirectionChange(v === "desc" ? "desc" : "asc")
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Mới nhất</SelectItem>
            <SelectItem value="asc">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={onReset} title="Đặt lại bộ lọc">
          <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={exporting}>
              <Download className="h-4 w-4 mr-1.5" />
              {exporting ? "Đang xuất..." : "Xuất Excel"}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={selectedCount === 0}
              onClick={() => onExport("selected")}
            >
              Xuất đã chọn ({selectedCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("filtered")}>
              Xuất theo bộ lọc hiện tại
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport("all")}>
              Xuất toàn bộ khách hàng
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
