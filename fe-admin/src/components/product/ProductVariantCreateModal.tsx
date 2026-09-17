import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import PriceInput from "./PriceInput";
import type {
  ProductVariantStatus,
} from "@/api/productVariantApi";
import type { ProductResponse } from "@/api/productApi";
import { useAddProductVariant } from "@/hooks/useProductVariant";
import AcceptModal from "../AcceptModal";
import { toast } from "sonner";
import { SearchableSelect, type ItemsSearchable } from "../SearchableSelect";
import {
  MAX_VARIANT_IMAGE_SIZE,
  VARIANT_IMAGE_ACCEPT,
  VARIANT_IMAGE_TYPES,
} from "./variantImageValidation";

const createVariantSchema = z
  .object({
    productId: z
      .number({ error: "Vui lòng chọn sản phẩm" })
      .min(1, "Vui lòng chọn sản phẩm"),

    size: z
      .string()
      .min(1, "Size không được để trống")
      .max(50, "Size tối đa 50 ký tự"),

    color: z
      .string()
      .min(1, "Màu không được để trống")
      .max(50, "Màu tối đa 50 ký tự"),

    price: z
      .number({ error: "Giá bán không hợp lệ" })
      .min(0, "Giá bán phải ≥ 0")
      .max(1_000_000_000, "Giá bán tối đa 1 tỷ"),

    stockQuantity: z
      .number({ error: "Tồn kho không hợp lệ" })
      .int("Tồn kho phải là số nguyên")
      .min(0, "Tồn kho phải ≥ 0")
      .max(10_000_000, "Tồn kho tối đa 10 triệu"),

    status: z.enum(["ACTIVE", "INACTIVE"]),

    file: z
      .instanceof(File)
      .nullable()
      .optional()
      .refine((f) => !f || f.size <= MAX_VARIANT_IMAGE_SIZE, "Ảnh tối đa 5MB")
      .refine(
        (f) => !f || VARIANT_IMAGE_TYPES.includes(f.type.toLowerCase()),
        "Chỉ nhận JPG, JPEG, PNG, WEBP, GIF, AVIF, BMP",
      ),
  });

type CreateVariantForm = z.infer<typeof createVariantSchema>;

interface ProductVariantCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductResponse[];
  defaultProductId?: number | null;
}

export default function ProductVariantCreateModal({
  open,
  onOpenChange,
  products,
  defaultProductId,
}: ProductVariantCreateModalProps) {
  const { mutate: addVariant, isPending: isAdding } = useAddProductVariant();

  const productList = products.map<ItemsSearchable>((i) => ({
    id: i.productId,
    name: i.productName,
  }));

  const { Field, handleSubmit, reset } = useForm({
    defaultValues: {
      productId: defaultProductId ?? 0,
      size: "",
      color: "",
      price: 0,
      stockQuantity: 0,
      status: "ACTIVE",
      file: null,
    } as CreateVariantForm,
    onSubmit: async ({ value }) => {
      addVariant(
        {
          productId: value.productId,
          data: {
            size: value.size,
            color: value.color,
            price: value.price,
            stockQuantity: value.stockQuantity,
            status: value.status,
          },
          file: value.file ?? undefined,
        },
        {
          onSuccess: () => {
            toast.success("Thêm biến thể thành công");
            onOpenChange(false);
          },
          onError: (error: unknown) =>
            toast.error(
              (error as { apiMessage?: string } | null)?.apiMessage ??
                "Thêm biến thể thất bại",
            ),
        },
      );
    },
    validators: {
      onSubmit: createVariantSchema,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        productId: defaultProductId ?? 0,
        size: "",
        color: "",
        price: 0,
        stockQuantity: 0,
        status: "ACTIVE",
        file: null,
      });
    }
  }, [open, defaultProductId, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm biến thể sản phẩm mới</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4"
        >
          {}
          <Field name="productId">
            {(field) => (
              <div className="space-y-1.5">
                <Label>
                  Sản phẩm <span className="text-destructive">*</span>
                </Label>
                {defaultProductId ? (
                  <Input
                    value={
                      products.find((p) => p.productId === defaultProductId)
                        ?.productName ?? ""
                    }
                    className="h-9 text-sm bg-gray-50"
                    disabled
                  />
                ) : (
                  <div className="w-full">
                    <SearchableSelect
                      title="Chọn sản phẩm"
                      items={productList}
                      value={field.state.value || null}
                      onChangeSelect={(v) => field.handleChange(v ?? 0)}
                      search=""
                    />
                  </div>
                )}
                {field.state.meta.errors?.[0] && (
                  <p className="text-xs text-destructive">
                    {
                      (field.state.meta.errors[0] as { message?: string })
                        .message
                    }
                  </p>
                )}
              </div>
            )}
          </Field>

          <div className="grid grid-cols-1 gap-3">
            {}
            <Field name="size">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="size">
                    Size <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="size"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="VD: S, M, L, XL, 39, 40..."
                    className="h-9 text-sm"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs text-destructive">
                      {
                        (field.state.meta.errors[0] as { message?: string })
                          .message
                      }
                    </p>
                  )}
                </div>
              )}
            </Field>

            {}
            <Field name="color">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="color">
                    Màu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="color"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="VD: Đen, Trắng, Đỏ..."
                    className="h-9 text-sm"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs text-destructive">
                      {
                        (field.state.meta.errors[0] as { message?: string })
                          .message
                      }
                    </p>
                  )}
                </div>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {}
            <Field name="price">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="price">
                    Giá bán <span className="text-destructive">*</span>
                  </Label>
                  <PriceInput
                    className="h-9"
                    value={field.state.value}
                    onChange={(v) =>
                      field.handleChange(v === "" ? 0 : Number(v))
                    }
                    placeholder="0"
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs text-destructive">
                      {
                        (field.state.meta.errors[0] as { message?: string })
                          .message
                      }
                    </p>
                  )}
                </div>
              )}
            </Field>

          </div>

          <div className="grid grid-cols-2 gap-3">
            {}
            <Field name="stockQuantity">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="stock">
                    Tồn kho <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value === "" ? 0 : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                    className="h-9 text-sm"
                    min={0}
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs text-destructive">
                      {
                        (field.state.meta.errors[0] as { message?: string })
                          .message
                      }
                    </p>
                  )}
                </div>
              )}
            </Field>

            {}
            <Field name="status">
              {(field) => (
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as ProductVariantStatus)
                    }
                  >
                    <SelectTrigger className="h-9 w-full py-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Đang bán</SelectItem>
                      <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs text-destructive">
                      {
                        (field.state.meta.errors[0] as { message?: string })
                          .message
                      }
                    </p>
                  )}
                </div>
              )}
            </Field>
          </div>

          {}
          <Field name="file">
            {(field) => (
              <div className="space-y-1.5">
                <Label>Ảnh biến thể (tuỳ chọn)</Label>
                <Input
                  type="file"
                  accept={VARIANT_IMAGE_ACCEPT}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    field.handleChange(f);
                  }}
                  className="text-sm"
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-xs text-destructive">
                    {
                      (field.state.meta.errors[0] as { message?: string })
                        .message
                    }
                  </p>
                )}
              </div>
            )}
          </Field>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
            <DialogClose asChild>
              <Button type="button" variant="destructive" disabled={isAdding}>
                Huỷ
              </Button>
            </DialogClose>

            <AcceptModal
              typeConfirm="CREATE"
              message="Bạn có chắc muốn thêm biến thể sản phẩm này không?"
              onConfirm={handleSubmit}
              isPending={isAdding}
            >
              <Button
                type="button"
                disabled={isAdding}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isAdding ? "Đang tạo..." : "Xác nhận"}
              </Button>
            </AcceptModal>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
