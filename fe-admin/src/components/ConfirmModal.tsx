import { Trash2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type TypeConfirm = "DELETE" | "UPDATE" | "CREATE";

interface ConfirmModalProps {
  typeConfirm: TypeConfirm;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export default function ConfirmModal({
  typeConfirm,
  message,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm p-6 space-y-4 shadow-lg">
        {}
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
        {}

        <p className="text-sm text-gray-500 mt-1">{message}</p>
        {}
        <div className="flex gap-2.5 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="flex-1"
            size={"lg"}
          >
            Huỷ
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            size={"lg"}
            className={`
              flex-1 
              text-white
              ${current.button}
              disabled:opacity-60
            `}
          >
            {isPending ? current.pendingText : current.confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
