import type { Brand } from "@/api/brandApi";
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
import { useUpdateBrand } from "@/hooks/useBrand";
import { toast } from "sonner";
import { useState } from "react";

const UpdateStatusBrand = ({ brand }: { brand: Brand }) => {
  const [open, setOpen] = useState(false);

  const { mutate: update, isPending: isUpdating } = useUpdateBrand();

  const newStatus = brand.brandStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const handleUpdateStatus = () => {
    update(
      {
        id: brand.brandId,
        payload: {
          ...brand,
          brandStatus: newStatus,
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
        <Switch checked={brand.brandStatus === "ACTIVE"} />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Xác nhận</AlertDialogTitle>

          <AlertDialogDescription>
            {`Bạn có chắc muốn thay đổi trạng thái '${brand.brandName}' thành ${
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

export default UpdateStatusBrand;
