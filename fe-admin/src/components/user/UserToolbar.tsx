import { Download, RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole, UserStatus } from "@/api/userApi";
import { Button } from "../ui/button";

interface Props {
  direction: string;
  onDirectionChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  status: UserStatus | null;
  onStatusChange: (v: UserStatus | null) => void;
  role: UserRole | null;
  onRoleChange: (v: UserRole | null) => void;
  onResetFilters: () => void;
  onExport: (type: "selected" | "filtered" | "all") => void;
  hasSelection: boolean;
}

export function UserToolbar({
  direction,
  onDirectionChange,
  search,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
  onResetFilters,
  onExport,
  hasSelection,
}: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b">
      <span className="text-base font-medium">Danh sách người dùng</span>
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <Search className="absolute left-1.5 top-1/4 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã, tên, tài khoản, SĐT..."
            className="pl-8 w-56 py-4"
          />
        </div>

        <Select
          value={role ?? "ALL"}
          onValueChange={(v) =>
            onRoleChange(v === "ALL" ? null : (v as UserRole))
          }
        >
          <SelectTrigger className="w-40 h-9 py-4">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            <SelectItem value="STAFF">Nhân viên</SelectItem>
            <SelectItem value="ADMIN">Quản trị viên</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status ?? "ALL"}
          onValueChange={(v) =>
            onStatusChange(v === "ALL" ? null : (v as UserStatus))
          }
        >
          <SelectTrigger className="w-40 h-9 py-4">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
            <SelectItem value="BANNED">Bị cấm</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={direction ?? "desc"}
          onValueChange={(v) =>
            onDirectionChange(v === "desc" ? "desc" : "asc")
          }
        >
          <SelectTrigger className="w-40 h-9 py-4">
            <SelectValue placeholder="Thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Mới nhất</SelectItem>
            <SelectItem value="asc">Cũ nhất</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="xs"
          onClick={onResetFilters}
          className="h-9 gap-1 text-xs hover:text-red-500 hover:bg-red-50"
        >
          <RotateCcw size={12} /> Xoá bộ lọc
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onExport(hasSelection ? "selected" : "filtered")}
          className="h-9 gap-1 text-xs"
        >
          <Download size={12} />
          {hasSelection ? "Xuất mục đã chọn" : "Xuất theo bộ lọc"}
        </Button>
        <Button
          variant="outline"
          size="xs"
          onClick={() => onExport("all")}
          className="h-9 gap-1 text-xs"
        >
          <Download size={12} /> Xuất tất cả
        </Button>
      </div>
    </div>
  );
}
