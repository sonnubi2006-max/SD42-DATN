import type { UserResponse } from "@/api/userApi";
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
import { toast } from "sonner";
import { useState } from "react";
import { useUpdateUserStatus } from "@/hooks/useUser";
import { useMe } from "@/hooks/useAuth";

const UpdateStatusUser = ({ user }: { user: UserResponse }) => {
  const [open, setOpen] = useState(false);

  const { data: account } = useMe();
  const { mutate: update, isPending: isUpdating } = useUpdateUserStatus();

  const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const handleUpdateStatus = () => {
    update(
      { id: user.userId },
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
      <AlertDialogTrigger asChild>
        <div>
          <Switch
            checked={user.status === "ACTIVE"}
            disabled={account?.userId == user.userId}
          />
        </div>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Xác nhận</AlertDialogTitle>

          <AlertDialogDescription>
            {`Bạn có chắc muốn thay đổi trạng thái tài khoản '${user.username}' thành ${
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

export default UpdateStatusUser;
