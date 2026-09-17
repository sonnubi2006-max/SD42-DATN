import { useState } from "react";
import type { AdjustmentType } from "@/api/inventoryApi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryAdjustmentModalProps {
  isOpen: boolean;
  variantId?: number;
  sku?: string;
  currentQuantity?: number;

  onClose: () => void;

  onSubmit: (data: {
    type: AdjustmentType;
    quantity: number;
    note?: string;
  }) => void;

  isPending: boolean;
}

interface AdjustmentForm {
  type: AdjustmentType;
  quantity: string;
  note: string;
}

const defaultForm: AdjustmentForm = {
  type: "ADJUST",
  quantity: "",
  note: "",
};

export default function InventoryAdjustmentModal({
  isOpen,
  variantId,
  sku,
  currentQuantity = 0,
  onClose,
  onSubmit,
  isPending,
}: InventoryAdjustmentModalProps) {
  const [form, setForm] = useState<AdjustmentForm>(defaultForm);

  const [error, setError] = useState("");

  const updateField = <K extends keyof AdjustmentForm>(
    key: K,
    value: AdjustmentForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    setError("");
  };

  const resetForm = () => {
    setForm(defaultForm);

    setError("");
  };

  const handleClose = () => {
    if (isPending) return;

    resetForm();

    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = Number(form.quantity);

    if (!quantity || quantity <= 0) {
      setError("Số lượng phải lớn hơn 0");
      return;
    }

    if (form.type === "EXPORT" && quantity > currentQuantity) {
      setError(`Không thể xuất vượt quá tồn kho (${currentQuantity})`);
      return;
    }

    onSubmit({
      type: form.type,
      quantity,
      note: form.note.trim() || undefined,
    });

    resetForm();

    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        </DialogHeader>

        <form id="adjustment-form" onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            { }

            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <Label className="text-xs text-gray-500">Mã hàng</Label>

              <p className="text-sm ">{sku ?? "-"}</p>
            </div>

            { }

            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <Label className="text-xs text-gray-500">Tồn kho hiện tại</Label>

              <p className="text-sm font-medium">{currentQuantity} sản phẩm</p>
            </div>

            { }

            <div className="space-y-1.5">
              <Label>
                Loại điều chỉnh
                <span className="text-red-500">*</span>
              </Label>

              <Select
                defaultValue={form.type}
                onValueChange={(value) =>
                  updateField("type", value as AdjustmentType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="IMPORT">Nhập kho</SelectItem>

                  <SelectItem value="EXPORT">Xuất kho</SelectItem>

                  <SelectItem value="ADJUST">Điều chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            { }

            <div className="space-y-1.5">
              <Label>
                Số lượng
                <span className="text-red-500">*</span>
              </Label>

              <Input
                type="number"
                min="1"
                defaultValue={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                placeholder="Nhập số lượng"
              />
            </div>

            { }

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>

              <textarea
                defaultValue={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                rows={3}
                placeholder="Lý do điều chỉnh..."
                className="
                  w-full
                  rounded-md
                  border
                  px-3
                  py-2
                  text-sm
                "
              />
            </div>

            {error && (
              <div
                className="
                rounded-md
                bg-red-50
                border
                border-red-200
                px-3
                py-2
              "
              >
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Hủy
          </Button>

          <Button type="submit" form="adjustment-form" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
