import { Trash2, Pencil, Plus } from "lucide-react";
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
} from "./ui/alert-dialog";
import { useState, type ReactNode } from "react";
import { Button } from "./ui/button";

type TypeConfirm = "DELETE" | "UPDATE" | "CREATE";

interface ConfirmModalProps {
  typeConfirm: TypeConfirm;
  message: string;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  children: ReactNode;
}

export default function AcceptModal({
  typeConfirm,
  message,
  children,
  onConfirm,
  isPending,
}: ConfirmModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const config = {
    DELETE: {
      icon: <Trash2 size={20} className="text-red-500" />,
      iconBg: "bg-red-50",
      title: "Xoá dữ liệu?",
      confirmText: "Xác nhận xoá",
      pendingText: "Đang xoá...",
      button: "bg-red-500 hover:bg-red-600",
    },

    UPDATE: {
      icon: <Pencil size={20} className="text-blue-500" />,
      iconBg: "bg-blue-50",
      title: "Cập nhật dữ liệu?",
      confirmText: "Xác nhận",
      pendingText: "Đang cập nhật...",
      button: "bg-blue-500 hover:bg-blue-600",
    },

    CREATE: {
      icon: <Plus size={20} className="text-green-500" />,
      iconBg: "bg-green-50",
      title: "Thêm mới dữ liệu?",
      confirmText: "Xác nhận",
      pendingText: "Đang tạo...",
      button: "bg-green-500 hover:bg-green-600",
    },
  };

  const current = config[typeConfirm];

  const handleConfirm = async () => {
    await onConfirm();
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {" "}
            <div className="flex items-center gap-2">
              <div
                className={`
            w-10 h-10 rounded-full 
            flex items-center justify-center
            ${current.iconBg}
          `}
              >
                {current.icon}
              </div>
              <h3 className="text-base font-medium text-gray-900">
                {current.title}
              </h3>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2.5 pt-2">
          <AlertDialogCancel disabled={isPending}>Huỷ</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? current.pendingText : current.confirmText}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
