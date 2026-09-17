import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { UserResponse, UserStatus } from "@/api/userApi";
import UserRow from "./UserRow";
import { Checkbox } from "../ui/checkbox";

interface Props {
  data: UserResponse[];
  isLoading: boolean;
  onStatusChange: (id: number, status: UserStatus) => void;
  onTogglePage: (ids: number[], checked: boolean) => void;
  onToggleOne: (id: number) => void;
  selectedIds: Set<number>;
}

export function UserTable({
  data,
  isLoading,
  selectedIds,
  onToggleOne,
  onTogglePage,
}: Props) {
  const pageIds = data.map((u) => u.userId);
  const allChecked =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allChecked}
              onCheckedChange={(v) => onTogglePage(pageIds, Boolean(v))}
              aria-label="Chọn tất cả"
            />
          </TableHead>
          <TableHead className="w-12 text-center">STT</TableHead>
          <TableHead>Mã NV</TableHead>
          <TableHead>Người dùng</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>CCCD</TableHead>
          <TableHead>Số điện thoại</TableHead>
          <TableHead>Giới tính</TableHead>
          <TableHead>Ngày sinh</TableHead>
          <TableHead>Địa chỉ</TableHead>
          <TableHead>Vai trò</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Hành động</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={13} className="text-center py-16">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={13}
              className="text-center py-16 text-muted-foreground"
            >
              Không có người dùng nào
            </TableCell>
          </TableRow>
        ) : (
          data.map((user, i) => (
            <UserRow
              index={i}
              user={user}
              key={user.userId}
              onToggleOne={onToggleOne}
              selectedIds={selectedIds}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
