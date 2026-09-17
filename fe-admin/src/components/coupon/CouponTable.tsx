import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CouponRow } from "./CouponRow";
import type { CouponResponse } from "@/api/couponApi";

interface Props {
  data: CouponResponse[];
  isLoading: boolean;
  selectedIds: Set<number>;
  onToggleOne: (id: number) => void;
  onTogglePage: (ids: number[], checked: boolean) => void;
  onEdit: (row: CouponResponse) => void;
  onToggleStatus: (row: CouponResponse) => void;
}

export function CouponTable({
  data,
  isLoading,
  selectedIds,
  onToggleOne,
  onTogglePage,
  onEdit,
  onToggleStatus,
}: Props) {
  const pageIds = data.map((c) => c.couponId);
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
          <TableHead className="w-16">STT</TableHead>
          <TableHead>Mã</TableHead>
          <TableHead>Loại phiếu</TableHead>
          <TableHead>Giảm giá</TableHead>
          <TableHead>Giá tối thiểu áp dụng</TableHead>
          <TableHead>Tổng số lượng</TableHead>
          <TableHead>Số lượng còn lại</TableHead>
          <TableHead>Ngày bắt đầu</TableHead>
          <TableHead>Ngày kết thúc</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-center">Hành động</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={12} className="text-center py-16">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang tải…
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={12}
              className="text-center py-16 text-muted-foreground text-sm"
            >
              Chưa có mã giảm giá nào
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, index) => (
            <CouponRow
              key={row.couponId}
              row={row}
              index={index}
              selected={selectedIds.has(row.couponId)}
              onToggleOne={onToggleOne}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
