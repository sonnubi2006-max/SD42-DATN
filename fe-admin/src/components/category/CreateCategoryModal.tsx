import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { categorySchema, type CategoryForm } from "@/utils/categoryValidator";
import { useCreateCategory } from "@/hooks/useCategory";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Category } from "@/api/categoryApi";

interface CreateCategoryModalProps {
  onCreated?: (category: Category) => void;
  className?: string;
}

const firstErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return undefined;
};

export default function CreateCategoryModal({
  onCreated,
  className,
}: CreateCategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { mutate: create, isPending } = useCreateCategory();

  const form = useForm({
    defaultValues: {
      categoryName: "",
      categoryDescription: "",
      categoryStatus: "ACTIVE",
    } as CategoryForm,
    onSubmit: ({ value }) => {
      create(
        {
          ...value,
          categoryName: value.categoryName.replace(/\s+/g, " ").trim(),
        },
        {
          onSuccess: (category) => {
            toast.success("Tạo danh mục thành công.");
            onCreated?.(category);
            setIsOpen(false);
            form.reset();
          },
          onError: (err: any) =>
            toast.error(
              err?.apiMessage ?? "Có lỗi xảy ra vui lòng thử lại sau!",
            ),
        },
      );
    },
    validators: {
      onSubmit: categorySchema,
    },
  });

  const handleOpenModal = (open: boolean) => {
    setIsOpen(open);
    if (open) form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenModal}>
      <DialogTrigger asChild>
        <Button type="button" size="lg" className={className}>
          <Plus /> Thêm danh mục
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">Thêm danh mục mới</DialogTitle>
          <DialogDescription>Nhập thông tin danh mục sản phẩm</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {}
          <form.Field
            name="categoryName"
            validators={{
              onChange: ({ value }) => {
                const result = categorySchema.shape.categoryName.safeParse(value);
                return result.success ? undefined : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-1">
                <Label htmlFor={field.name}>
                  Tên danh mục <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  placeholder="VD: Áo Thun"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {firstErrorMessage(field.state.meta.errors?.[0]) && (
                  <p className="text-xs text-destructive">
                    {firstErrorMessage(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {}
          <form.Field
            name="categoryDescription"
            validators={{
              onChange: ({ value }) => {
                const result = categorySchema.shape.categoryDescription.safeParse(value ?? "");
                return result.success ? undefined : result.error.issues[0]?.message;
              },
            }}
          >
            {(field) => (
              <div className="grid gap-1">
                <Label htmlFor={field.name}>Mô tả</Label>
                <Input
                  id={field.name}
                  placeholder="Mô tả ngắn gọn"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {firstErrorMessage(field.state.meta.errors?.[0]) && (
                  <p className="text-xs text-destructive">
                    {firstErrorMessage(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg">
                Huỷ
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              onClick={(e) => e.stopPropagation()}
            >
              {isPending ? "Đang lưu…" : "Thêm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
