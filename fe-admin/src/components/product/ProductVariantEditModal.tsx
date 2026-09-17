import { useCallback, useEffect, useState } from "react";
import { Edit } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  ProductImageResponse,
  ProductVariantResponse,
  ProductVariantStatus,
} from "@/api/productVariantApi";
import { useUpdateProductVariant } from "@/hooks/useProductVariant";
import AcceptModal from "../AcceptModal";
import { toast } from "sonner";
import {
  MAX_VARIANT_IMAGE_SIZE,
  VARIANT_IMAGE_ACCEPT,
  VARIANT_IMAGE_TYPES,
} from "./variantImageValidation";

const variantSchema = z
  .object({
    color: z.string().trim().min(1, "Vui lòng nhập màu"),
    size: z.string().trim().min(1, "Vui lòng nhập size"),
    price: z
      .number({ error: "Giá bán không hợp lệ" })
      .min(1, "Giá bán phải lớn hơn 0")
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

type VariantForm = z.infer<typeof variantSchema>;

export interface EditableVariant {
  variantId?: number;
  size?: string;
  color?: string;
  price?: number;
  stockQuantity?: number;
  status?: ProductVariantStatus;
  image?: ProductImageResponse;
}

interface ProductVariantEditModalProps {
  variant: EditableVariant;

  onSaved?: (result: ProductVariantResponse) => void;
}

export default function ProductVariantEditModal({
  variant,
  onSaved,
}: ProductVariantEditModalProps) {
  const [open, setOpen] = useState(false);
  const { mutate: updateVariant, isPending: isUpdating } =
    useUpdateProductVariant();

  const buildDefaults = useCallback(
    (): VariantForm => ({
      color: variant.color ?? "",
      size: variant.size ?? "",
      price: variant.price ?? 0,
      stockQuantity: variant.stockQuantity ?? 0,
      status: variant.status ?? "ACTIVE",
      file: null,
    }),
    [
      variant.color,
      variant.price,
      variant.size,
      variant.status,
      variant.stockQuantity,
    ],
  );

  const form = useForm({
    defaultValues: buildDefaults(),
    validators: {
      onSubmit: variantSchema,
    },
    onSubmit: async ({ value }) => {
      updateVariant(
        {
          variantId: variant.variantId!,
          data: {
            size: value.size.trim(),
            color: value.color.trim(),
            price: value.price,
            stockQuantity: value.stockQuantity,
            status: value.status,
          },
          file: value.file ?? undefined,
        },
        {
          onSuccess: (data) => {
            onSaved?.(data);
            toast.success("Cập nhật biến thể thành công");
            setOpen(false);
          },
          onError: (e: unknown) =>
            toast.error(
              (e as { apiMessage?: string } | null)?.apiMessage ??
                "Cập nhật thất bại",
            ),
        },
      );
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(buildDefaults());

  }, [open, buildDefaults, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
          title="Chỉnh sửa"
        >
          <Edit size={14} />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa biến thể sản phẩm</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {}
          <form.Field name="file">
            {(field) => {
              const preview = field.state.value
                ? URL.createObjectURL(field.state.value)
                : variant.image?.imageUrl;
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <label className="relative block h-14 w-14 cursor-pointer rounded-lg border border-gray-200 overflow-hidden bg-white shrink-0">
                      {preview ? (
                        <img
                          src={preview}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-gray-300">
                          Ảnh
                        </span>
                      )}
                      <input
                        type="file"
                        accept={VARIANT_IMAGE_ACCEPT}
                        className="hidden"
                        onChange={(e) =>
                          field.handleChange(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    <div className="text-sm text-gray-500">
                      <p className="font-medium text-gray-700">
                        Bấm vào ảnh để đổi
                      </p>
                      <p className="text-xs text-gray-400">
                        Size và màu của biến thể đã lưu không thể thay đổi.
                      </p>
                    </div>
                  </div>
                  {field.state.meta.errors?.[0] && (
                    <p className="text-xs text-destructive">
                      {
                        (field.state.meta.errors[0] as { message?: string })
                          .message
                      }
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <div className="grid grid-cols-1 gap-3">
            {}
            <form.Field name="size">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="size">
                    Size <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="size"
                    value={field.state.value}
                    placeholder="VD: S, M, L, XL, 39, 40..."
                    className="h-9 text-sm"
                    disabled
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
            </form.Field>

            {}
            <form.Field name="color">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="color">
                    Màu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="color"
                    value={field.state.value}
                    placeholder="VD: Đen, Trắng, Đỏ..."
                    className="h-9 text-sm"
                    disabled
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
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {}
            <form.Field name="price">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="price">
                    Giá bán <span className="text-destructive">*</span>
                  </Label>
                  <PriceInput
                    className="h-9"
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v === "" ? 0 : Number(v))}
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
            </form.Field>

          </div>

          <div className="grid grid-cols-2 gap-3">
            {}
            <form.Field name="stockQuantity">
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
            </form.Field>

            {}
            <form.Field name="status">
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
                      <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
            <DialogClose asChild>
              <Button type="button" variant="destructive" disabled={isUpdating}>
                Huỷ
              </Button>
            </DialogClose>

            <AcceptModal
              typeConfirm="UPDATE"
              message="Bạn có chắc muốn lưu các dữ liệu này không?"
              onConfirm={async () => {
                await form.handleSubmit();
              }}
              isPending={isUpdating}
            >
              <Button
                type="button"
                disabled={isUpdating}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isUpdating ? "Đang lưu..." : "Xác nhận"}
              </Button>
            </AcceptModal>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
