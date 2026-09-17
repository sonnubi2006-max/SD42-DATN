import ProductVariantEditModal from "./ProductVariantEditModal";
import { Switch } from "../ui/switch";
import { TableCell, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import type {
  ProductVariantResponse,
  ProductVariantStatus,
} from "@/api/productVariantApi";
import { useChangeProductVariantStatus } from "@/hooks/useProductVariant";
import ConfirmModal from "../ConfirmModal";
import { useState } from "react";
import { toast } from "sonner";
import ProductVariantQrDialog from "./ProductVariantQrDialog";
import VariantDamageDialog from "./VariantDamageDialog";

function formatPrice(v: number) {
  return v.toLocaleString("vi-VN") + "đ";
}

interface Props {
  variant: ProductVariantResponse;
  index: number;
  selectedIds: number[];
  onSelectChange: (ids: number[]) => void;
}

const ProductVariantRow = ({
  variant,
  index,
  selectedIds,
  onSelectChange,
}: Props) => {
  const [open, setOpen] = useState(false);

  const checked = selectedIds.includes(variant.variantId);

  const { mutate: changeStatus, isPending: isUpdating } =
    useChangeProductVariantStatus();

  const toggleOne = (id: number) =>
    onSelectChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );

  const confirmToggleStatus = () => {
    const next: ProductVariantStatus =
      variant.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    changeStatus(
      { variantId: variant.variantId, status: next },
      {
        onSuccess: () => {
          toast.success("Cập nhật trạng thái thành công");
          setOpen(false);
        },
        onError: (error: unknown) =>
          toast.error(
            (error as { apiMessage?: string } | null)?.apiMessage ?? "Thất bại",
          ),
      },
    );
  };

  return (
    <TableRow key={variant.variantId} className="group hover:bg-gray-50">
      <TableCell>
        <Checkbox
          checked={checked}
          onCheckedChange={() => toggleOne(variant.variantId)}
        />
      </TableCell>

      <TableCell>{index + 1}</TableCell>
      <TableCell className="text-sm  text-gray-500">
        {variant.variantCode || "—"}
      </TableCell>

      <TableCell className="text-sm font-medium text-gray-700">
        {variant.size}
      </TableCell>
      <TableCell className="text-sm text-gray-600">{variant.color}</TableCell>
      <TableCell className="text-sm font-medium text-gray-700">
        {formatPrice(variant.price)}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {variant.stockQuantity}
      </TableCell>
      <TableCell>
        <Badge variant={(variant.damagedQuantity ?? 0) > 0 ? "destructive" : "secondary"}>
          {variant.damagedQuantity ?? 0}
        </Badge>
      </TableCell>
      <TableCell>
        {variant.image ? (
          <img
            src={variant.image.imageUrl}
            className="w-10 h-10 object-cover rounded-lg bg-gray-100 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
        )}
      </TableCell>
      <TableCell>
        <Badge variant={variant.status === "ACTIVE" ? "success" : "destructive"}>
          {variant.status === "ACTIVE" ? "Đang bán" : "Ngừng bán"}
        </Badge>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-1">
          <ProductVariantQrDialog variant={variant} />
          <VariantDamageDialog variant={variant} />
          <ProductVariantEditModal variant={variant} />
          <Switch
            checked={variant.status === "ACTIVE"}
            onCheckedChange={() => setOpen(true)}
            title="Đổi trạng thái"
          />
        </div>
      </TableCell>
      {open && (
        <ConfirmModal
          typeConfirm="UPDATE"
          message={
            variant.status === "ACTIVE"
              ? `Ngừng bán biến thể "${variant.variantCode}"?`
              : `Kích hoạt biến thể "${variant.variantCode}"?`
          }
          onConfirm={confirmToggleStatus}
          onCancel={() => setOpen(false)}
          isPending={isUpdating}
        />
      )}
    </TableRow>
  );
};

export default ProductVariantRow;
