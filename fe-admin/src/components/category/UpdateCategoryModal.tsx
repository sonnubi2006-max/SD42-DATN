import { useState } from "react";
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
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { categorySchema, type CategoryForm } from "@/utils/categoryValidator";
import type { Category } from "@/api/categoryApi";
import { useUpdateCategory } from "@/hooks/useCategory";
import { toast } from "sonner";
import { Edit, ShieldAlert } from "lucide-react";

export default function UpdateCategoryModal({ category }: { category: Category }) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<CategoryForm | null>(null);

  const { mutate: update, isPending } = useUpdateCategory();

  const form = useForm({
    defaultValues: {
      categoryName: category.categoryName,
      categoryDescription: category.categoryDescription,
      categoryStatus: category.categoryStatus,
    } as CategoryForm,
    onSubmit: ({ value }) => {

      setPendingValues(value);
      setConfirmOpen(true);
    },
    validators: { onSubmit: categorySchema },
  });

  const handleConfirm = () => {
    if (!pendingValues) return;
    update(
      {
        id: category.categoryId,
        payload: {
          ...pendingValues,
          categoryName: pendingValues.categoryName.replace(/\s+/g, " ").trim(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật danh mục thành công.");
          setConfirmOpen(false);
          setIsOpen(false);
          setPendingValues(null);
        },
        onError: (err: any) => {
          toast.error(err?.apiMessage ?? "Có lỗi xảy ra vui lòng thử lại sau!");
          setConfirmOpen(false);
        },
      },
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) form.reset(); }}>
        <DialogTrigger asChild>
          <Button size="icon-lg" variant="ghost" title="Chỉnh sửa">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-lg">Chỉnh sửa danh mục</DialogTitle>
            <DialogDescription>Cập nhật thông tin danh mục</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="categoryName"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Vui lòng nhập tên danh mục" : undefined,
              }}
            >
              {(field) => (
                <div className="grid gap-1.5">
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
                      {(field.state.meta.errors[0] as { message?: string })?.message ??
                        String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="categoryDescription">
              {(field) => (
                <div className="grid gap-1.5">
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

            <form.Field name="categoryStatus">
              {(field) => (
                <div className="grid gap-1.5">
                  <Label>Trạng thái</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) =>
                      field.handleChange(val as CategoryForm["categoryStatus"])
                    }
                  >
                    <SelectTrigger>
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

            <DialogFooter className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Huỷ</Button>
              </DialogClose>
              <Button type="submit">Cập nhật</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-500" />
              Xác nhận cập nhật
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn cập nhật danh mục{" "}
              <strong>"{category.categoryName}"</strong> với thông tin mới không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Đang lưu..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
