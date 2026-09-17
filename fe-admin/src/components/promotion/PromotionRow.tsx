import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import dayjs from "dayjs";
import type { PromotionResponse } from "@/api/promotionApi";

export interface Props {
  row: PromotionResponse;
  index: number;
  selected: boolean;
  onToggleOne: (id: number) => void;
  onEdit: (row: PromotionResponse) => void;
  onToggleStatus: (row: PromotionResponse) => void;
}

const STATUS_MAP: Record<
  PromotionResponse["status"],
  {
    label: string;
    variant: "success" | "destructive" | "secondary" | "outline";
  }
> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "outline" },
  ACTIVE: { label: "Hoạt động", variant: "success" },
  ENDED: { label: "Kết thúc", variant: "secondary" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

const APPLY_MAP: Record<
  PromotionResponse["applyType"],
  { label: string; variant: "success" | "secondary" | "outline" }
> = {
  ORDER: { label: "Toàn đơn", variant: "outline" },
  PRODUCT: { label: "Sản phẩm", variant: "secondary" },
  CATEGORY: { label: "Danh mục", variant: "success" },
  VARIANT: { label: "Biến thể", variant: "outline" },
};

function formatVnd(value?: number) {
  if (value == null) return "-";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function PromotionRow({
  row,
  index,
  selected,
  onToggleOne,
  onEdit,
  onToggleStatus,
}: Props) {
  const status = STATUS_MAP[row.status] ?? STATUS_MAP.CANCELLED;
  const apply = APPLY_MAP[row.applyType] ?? APPLY_MAP.ORDER;

  const discountLabel =
    row.discountType === "PERCENTAGE"
      ? `${row.discountValue}%`
      : formatVnd(row.discountValue);

  const isActive = row.status === "ACTIVE" || row.status === "UPCOMING";
  const isEnded = row.status === "ENDED";

  return (
    <TableRow className="group" data-state={selected ? "selected" : undefined}>
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleOne(row.promotionId)}
          aria-label={`Chọn ${row.name}`}
        />
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {index + 1}
      </TableCell>

      <TableCell className="text-sm ">
        {row.promotionCode || "—"}
      </TableCell>

      <TableCell className="font-medium max-w-48 truncate" title={row.name}>
        {row.name}
      </TableCell>

      <TableCell>
        <Badge variant={apply.variant}>{apply.label}</Badge>
      </TableCell>

      <TableCell className="text-sm">{discountLabel}</TableCell>
      <TableCell className="text-sm">{formatVnd(row.maxDiscountAmount)}</TableCell>

      <TableCell className="text-sm text-muted-foreground">
        {row.startDate ? dayjs(row.startDate).format("DD/MM/YYYY") : "\u2014"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.endDate ? dayjs(row.endDate).format("DD/MM/YYYY") : "\u2014"}
      </TableCell>

      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>

      <TableCell className="text-center">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(row)}
            title="Chỉnh sửa"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Switch
            checked={isActive}
            disabled={isEnded}
            onCheckedChange={() => onToggleStatus(row)}
            title={isEnded ? "Chương trình đã kết thúc" : "Đổi trạng thái"}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
