import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserById, useResetPassword } from "@/hooks/useUser";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import EditForm from "@/components/user/EditForm";
import StaffOrderHistory from "@/components/user/StaffOrderHistory";
import StaffReturnHistory from "@/components/user/StaffReturnHistory";
import StaffStatistics from "@/components/user/StaffStatistics";
import { Button } from "@/components/ui/button";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  userId: number;
}

function ResetPasswordDialog({
  open,
  onOpenChange,
  username,
  userId,
}: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleReset = () => {
    if (newPassword.length < 8) {
      toast.error("Mật khẩu tối thiểu 8 ký tự");
      return;
    }
    resetPassword(
      { id: userId, payload: { newPassword } },
      {
        onSuccess: () => {
          toast.success("Đã reset mật khẩu");
          onOpenChange(false);
          setNewPassword("");
        },
        onError: (err: any) => toast.error(err?.apiMessage ?? "Thất bại"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset mật khẩu</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu mới cho <strong>@{username}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1 py-2">
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="Tối thiểu 8 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleReset} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders");

  const { data: user, isLoading } = useUserById(Number(id));
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-muted-foreground text-sm gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Đang tải...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <p className="text-muted-foreground">Không tìm thấy người dùng</p>
        <Button variant="outline" onClick={() => navigate("/users")}>
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-medium text-foreground">
          Chi tiết người dùng
        </h1>
      </div>

      <EditForm
        key={user.userId}
        user={user}
        onNavigateBack={() => navigate("/users")}
        onOpenReset={() => setResetOpen(true)}
      />

      {}
      <StaffStatistics staffId={user.userId} />

      {}
      <div className="space-y-4">
        <div className="border-b border-gray-100 flex gap-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-colors ${
              activeTab === "orders"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Lịch sử xử lý đơn hàng
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`pb-3 text-sm font-medium border-b-2 px-4 transition-colors ${
              activeTab === "returns"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Lịch sử xử lý đổi trả
          </button>
        </div>

        {activeTab === "orders" && (
          <StaffOrderHistory staffId={user.userId} />
        )}

        {activeTab === "returns" && (
          <StaffReturnHistory staffId={user.userId} />
        )}
      </div>

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        username={user.username}
        userId={user.userId}
      />
    </div>
  );
}
