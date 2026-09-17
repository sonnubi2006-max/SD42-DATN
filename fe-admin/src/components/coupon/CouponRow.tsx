import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import dayjs from "dayjs";
import type { CouponResponse } from "@/api/couponApi";

export interface Props {
  row: CouponResponse;
  index: number;
  selected: boolean;
  onToggleOne: (id: number) => void;
  onEdit: (row: CouponResponse) => void;
  onToggleStatus: (row: CouponResponse) => void;
}

const STATUS_MAP: Record<
  CouponResponse["status"],
  {
    label: string;
    variant: "success" | "destructive" | "secondary" | "outline";
  }
> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "outline" },
  ACTIVE: { label: "Hoạt động", variant: "success" },
  EXPIRED: { label: "Hết hạn", variant: "secondary" },
  INACTIVE: { label: "Vô hiệu hoá", variant: "destructive" },
};

const TYPE_MAP: Record<
  CouponResponse["couponType"],
  { label: string; variant: "success" | "secondary" }
> = {
  PUBLIC: { label: "Công khai", variant: "secondary" },
  PERSONAL: { label: "Cá nhân", variant: "success" },
};

export function CouponRow({
  row,
  index,
  selected,
  onToggleOne,
  onEdit,
  onToggleStatus,
}: Props) {
  const getActualStatus = (row: CouponResponse): CouponResponse["status"] => {
    if (row.status === "INACTIVE") return "INACTIVE";

    const now = dayjs();
    const start = row.startDate ? dayjs(row.startDate) : null;
    const end = row.endDate ? dayjs(row.endDate) : null;

    if (end && now.isAfter(end)) return "EXPIRED";
    if (row.totalQuantity != null && row.remainingQuantity != null && row.remainingQuantity <= 0) {
      return "EXPIRED";
    }
    if (start && now.isBefore(start)) return "UPCOMING";
    return "ACTIVE";
  };

  const actualStatus = getActualStatus(row);
  const status = STATUS_MAP[actualStatus] ?? STATUS_MAP.INACTIVE;
  const type = TYPE_MAP[row.couponType] ?? TYPE_MAP.PUBLIC;

  const discountLabel =
    row.discountType === "PERCENTAGE"
      ? `${row.discountValue}%`
      : new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(row.discountValue);

  const isActive = actualStatus === "ACTIVE" || actualStatus === "UPCOMING";
  const isExpired = actualStatus === "EXPIRED";

  return (
    <TableRow className="group" data-state={selected ? "selected" : undefined}>
      {}
      <TableCell>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleOne(row.couponId)}
          aria-label={`Chọn mã ${row.code}`}
        />
      </TableCell>

      {}
      <TableCell className="text-sm text-muted-foreground">
        {index + 1}
      </TableCell>

      {}
      <TableCell className="tracking-wide">{row.code}</TableCell>

      {}
      <TableCell>
        <Badge variant={type.variant}>{type.label}</Badge>
      </TableCell>

      {}
      <TableCell className="text-sm">{discountLabel}</TableCell>
      <TableCell className="text-sm">
        {row.minOrderValue != null
          ? new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(row.minOrderValue)
          : "-"}
      </TableCell>
      <TableCell className="text-sm">
        {row.totalQuantity ?? "Không giới hạn"}
      </TableCell>
      <TableCell className="text-sm">
        {row.remainingQuantity ?? "Không giới hạn"}
      </TableCell>

      {}
      <TableCell className="text-sm text-muted-foreground">
        {row.startDate ? dayjs(row.startDate).format("DD/MM/YYYY") : "—"}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {row.endDate ? dayjs(row.endDate).format("DD/MM/YYYY") : "—"}
      </TableCell>

      {}
      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
      </TableCell>
      {}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-3">
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
            disabled={isExpired}
            onCheckedChange={() => onToggleStatus(row)}
            title={isExpired ? "Mã đã hết hạn" : "Đổi trạng thái"}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
