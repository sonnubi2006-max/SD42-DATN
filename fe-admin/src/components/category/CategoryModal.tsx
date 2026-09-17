import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { ModalMode } from "@/hooks/useCategoryPage";
import type { CategoryForm } from "@/utils/categoryValidator";

export interface CategoryModalProps {
  mode: ModalMode;
  initial?: CategoryForm;
  onClose: () => void;
  onSubmit: (form: CategoryForm) => void;
  isPending: boolean;
}

const DEFAULT_VALUES: CategoryForm = {
  categoryName: "",
  categoryDescription: "",
  categoryStatus: "ACTIVE",
};

export default function CategoryModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isPending,
}: CategoryModalProps) {
  const isEdit = mode === "edit";

  const form = useForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: ({ value }) => onSubmit(value),
  });

  useEffect(() => {
    form.reset();
    if (isEdit && initial) {
      form.setFieldValue("categoryName", initial.categoryName);
      form.setFieldValue(
        "categoryDescription",
        initial.categoryDescription ?? "",
      );
      form.setFieldValue("categoryStatus", initial.categoryStatus);
    }
  }, [mode, initial, isEdit]);

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin danh mục"
              : "Nhập thông tin cho danh mục mới"}
          </DialogDescription>
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
              onChange: ({ value }) =>
                !value ? "Vui lòng nhập tên danh mục" : undefined,
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
                {field.state.meta.errors?.[0] && (
                  <p className="text-xs text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {}
          <form.Field name="categoryDescription">
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
              </div>
            )}
          </form.Field>

          {}
          <form.Field name="categoryStatus">
            {(field) => (
              <div className="grid gap-1">
                <Label htmlFor={field.name}>Trạng thái</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(val) =>
                    field.handleChange(val as CategoryForm["categoryStatus"])
                  }
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClose}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Đang lưu…" : isEdit ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
