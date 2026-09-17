import { useState } from "react";
import { X, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventoryList } from "@/hooks/useInventory";
import { useDebounce } from "@/hooks/useDebounce";

import type {
  GoodsReceiptRequest,
  GoodsReceiptDetailRequest,
  InventoryResponse,
} from "@/api/inventoryApi";

interface GoodsReceiptModalProps {
  isOpen: boolean;

  suppliers: {
    id: number;
    name: string;
  }[];

  onClose: () => void;

  onSubmit: (data: GoodsReceiptRequest) => void;

  isPending: boolean;
}

type ErrorState = Record<string, string>;

type GoodsReceiptItem = GoodsReceiptDetailRequest & {
  variantLabel?: string;
};

export default function GoodsReceiptModal({
  isOpen,
  suppliers,
  onClose,
  onSubmit,
  isPending,
}: GoodsReceiptModalProps) {
  const [supplierId, setSupplierId] = useState<string>("none");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<GoodsReceiptItem[]>([]);
  const [variantQuery, setVariantQuery] = useState("");
  const [errors, setErrors] = useState<ErrorState>({});

  const debouncedVariantQuery = useDebounce(variantQuery, 300);
  const { data: variantResults, isFetching: isSearchingVariants } =
    useInventoryList({ keyword: debouncedVariantQuery, page: 0, size: 10 });

  if (!isOpen) return null;

  const addItemFromVariant = (variant: InventoryResponse) => {
    if (items.some((item) => item.variantId === variant.variantId)) {
      setErrors((prev) => ({
        ...prev,
        variantSearch: "Variant này đã được thêm",
      }));
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        variantId: variant.variantId,
        variantLabel: `${variant.sku} — ${variant.productName}`,
        quantity: 1,
        importPrice: 0,
      },
    ]);
    setVariantQuery("");
    setErrors((prev) => ({ ...prev, variantSearch: "" }));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof GoodsReceiptDetailRequest,
    value: number,
  ) => {
    setItems((prev) => {
      const clone = [...prev];

      clone[index] = {
        ...clone[index],
        [field]: value,
      };

      return clone;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: ErrorState = {};

    if (supplierId === "none") {
      newErrors.supplier = "Vui lòng chọn nhà cung cấp";
    }

    if (items.length === 0) {
      newErrors.items = "Phải thêm ít nhất 1 sản phẩm";
    }

    items.forEach((item, index) => {
      if (!item.variantId) {
        newErrors[`item_${index}_variant`] = "Vui lòng nhập Variant ID";
      }

      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = "Số lượng phải lớn hơn 0";
      }

      if (item.importPrice <= 0) {
        newErrors[`item_${index}_price`] = "Giá nhập phải lớn hơn 0";
      }
    });

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);

      return;
    }

    onSubmit({
      supplierId: Number(supplierId),

      note: note.trim() || undefined,

      items,
    });

    setSupplierId("none");

    setNote("");

    setItems([]);

    setErrors({});

    onClose();
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.importPrice,
    0,
  );

  return (
    <div
      className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/40 px-4
      overflow-y-auto
      "
    >
      <div
        className="
        bg-white
        rounded-2xl
        w-full max-w-2xl
        shadow-lg
        my-8
        "
      >
        {}

        <div
          className="
          flex justify-between
          items-center
          px-6 py-4
          border-b
          "
        >
          <h2 className="font-medium">Tạo phiếu nhập hàng</h2>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="
            px-6 py-5
            space-y-4
            max-h-96
            overflow-y-auto
            "
          >
            {}

            <div className="space-y-1.5">
              <label
                className="
                text-xs
                font-medium
                "
              >
                Nhà cung cấp *
              </label>

              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhà cung cấp" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">Chọn nhà cung cấp</SelectItem>

                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {errors.supplier && (
                <p className="text-xs text-red-500">{errors.supplier}</p>
              )}
            </div>

            {}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">Tìm biến thể sản phẩm</label>
                  <span className="text-xs text-gray-500">
                    Nhập mã hàng hoặc tên sản phẩm
                  </span>
                </div>
                <Input
                  value={variantQuery}
                  onChange={(e) => {
                    setVariantQuery(e.target.value);
                    setErrors((prev) => ({ ...prev, variantSearch: "" }));
                  }}
                  placeholder="Tìm biến thể sản phẩm..."
                />
                {errors.variantSearch && (
                  <p className="text-xs text-red-500">{errors.variantSearch}</p>
                )}
                {variantQuery.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm max-h-64 overflow-y-auto">
                    {isSearchingVariants ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Đang tìm variant...
                      </div>
                    ) : variantResults?.content.length ? (
                      variantResults.content.map((variant) => (
                        <button
                          type="button"
                          key={variant.variantId}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50"
                          onClick={() => addItemFromVariant(variant)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {variant.sku} — {variant.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tồn kho: {variant.stockQuantity}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Không tìm thấy variant.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">Chi tiết nhập *</label>
                  <span className="text-xs text-gray-500">
                    Nhấn vào variant bên trên để thêm
                  </span>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-4"
                        value={item.variantLabel}
                        disabled
                      />

                      <Input
                        className="col-span-3"
                        type="number"
                        placeholder="Số lượng"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", Number(e.target.value))
                        }
                      />

                      <Input
                        className="col-span-3"
                        type="number"
                        placeholder="Giá nhập"
                        value={item.importPrice}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "importPrice",
                            Number(e.target.value),
                          )
                        }
                      />

                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-4" />
                      <div className="col-span-3 text-xs text-red-500">
                        {errors[`item_${index}_quantity`]}
                      </div>
                      <div className="col-span-3 text-xs text-red-500">
                        {errors[`item_${index}_price`]}
                      </div>
                      <div className="col-span-2" />
                    </div>
                  </div>
                ))}
                {errors.items && (
                  <p className="text-xs text-red-500">{errors.items}</p>
                )}
              </div>
            </div>

            {}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú"
              className="
              w-full
              border
              rounded-lg
              px-3 py-2
              text-sm
              "
            />

            {items.length > 0 && (
              <div
                className="
                bg-blue-50
                rounded-lg
                px-4 py-3
                text-sm
                "
              >
                Tổng:
                <b> {totalAmount.toLocaleString("vi-VN")}₫</b>
              </div>
            )}
          </div>

          <div
            className="
            flex gap-2
            px-6 py-4
            border-t
            "
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Hủy
            </Button>

            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Đang tạo..." : "Tạo phiếu nhập"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
