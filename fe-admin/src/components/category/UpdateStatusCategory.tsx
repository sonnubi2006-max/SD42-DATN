import type { Category } from "@/api/categoryApi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Switch } from "../ui/switch";
import { useUpdateCategory } from "@/hooks/useCategory";
import { toast } from "sonner";
import { useState } from "react";

const UpdateStatusCategory = ({ category }: { category: Category }) => {
  const [open, setOpen] = useState(false);

  const { mutate: update, isPending: isUpdating } = useUpdateCategory();

  const newStatus =
    category.categoryStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const handleUpdateStatus = () => {
    update(
      {
        id: category.categoryId,
        payload: {
          categoryDescription: category.categoryDescription,
          categoryName: category.categoryName,
          categoryStatus: newStatus,
        },
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật trạng thái thành công");
          setOpen(false);
        },
        onError: (error: any) => {
          toast.error(error?.apiMessage ?? "Cập nhật trạng thái thất bại");
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger>
        <Switch checked={category.categoryStatus === "ACTIVE"} />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Xác nhận</AlertDialogTitle>

          <AlertDialogDescription>
            {`Bạn có chắc muốn thay đổi trạng thái '${category.categoryName}' thành ${
              newStatus === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"
            }`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel size={"lg"}>Huỷ</AlertDialogCancel>

          <AlertDialogAction
            size={"lg"}
            disabled={isUpdating}
            onClick={handleUpdateStatus}
          >
            {isUpdating ? "Đang cập nhật..." : "Xác nhận"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpdateStatusCategory;
