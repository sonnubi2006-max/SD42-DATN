import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PromotionRow } from "./PromotionRow";
import type { PromotionResponse } from "@/api/promotionApi";

interface Props {
  data: PromotionResponse[];
  isLoading: boolean;
  selectedIds: Set<number>;
  onToggleOne: (id: number) => void;
  onTogglePage: (ids: number[], checked: boolean) => void;
  onEdit: (row: PromotionResponse) => void;
  onToggleStatus: (row: PromotionResponse) => void;
}

export function PromotionTable({
  data,
  isLoading,
  selectedIds,
  onToggleOne,
  onTogglePage,
  onEdit,
  onToggleStatus,
}: Props) {
  const pageIds = data.map((p) => p.promotionId);
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
          <TableHead>Mã đợt</TableHead>
          <TableHead>Tên chương trình</TableHead>
          <TableHead>Áp dụng</TableHead>
          <TableHead>Giảm giá</TableHead>
          <TableHead>Giảm tối đa</TableHead>
          <TableHead>Bắt đầu</TableHead>
          <TableHead>Kết thúc</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Hành động</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-16">
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Đang tải…
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={11}
              className="text-center py-16 text-muted-foreground text-sm"
            >
              Chưa có chương trình khuyến mãi nào
            </TableCell>
          </TableRow>
        ) : (
          data.map((row, index) => (
            <PromotionRow
              key={row.promotionId}
              row={row}
              index={index}
              selected={selectedIds.has(row.promotionId)}
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
