import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import type { UserResponse } from "@/api/userApi";

export type ModalMode = "create" | "edit" | null;

interface CreateUserForm {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName: string;
  gender: string;
  birthday: string;
  role: string;
}

interface EditUserForm {
  fullName: string;
  phone: string;
  gender: string;
  birthday: string;
  avatar: string;
  role: string;
}

type UserForm = CreateUserForm & EditUserForm;

interface Props {
  mode: ModalMode;
  initial?: UserResponse;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending?: boolean;
}

const DEFAULT_CREATE: UserForm = {
  username: "",
  password: "",
  email: "",
  phone: "",
  fullName: "",
  gender: "",
  birthday: "",
  role: "USER",
  avatar: "",
};

function toFormValues(user: UserResponse): UserForm {
  return {
    username: user.username,
    password: "",
    email: user.email,
    phone: user.phone ?? "",
    fullName: user.fullName ?? "",
    gender: user.gender ?? "",
    birthday: user.birthday ?? "",
    role: user.role,
    avatar: user.avatar ?? "",
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export default function UserModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserForm>({ defaultValues: DEFAULT_CREATE });

  useEffect(() => {
    reset(isEdit && initial ? toFormValues(initial) : DEFAULT_CREATE);
  }, [mode, initial, isEdit, reset]);

  const onValid = (values: UserForm) => {
    if (isEdit) {
      const { username, password, email, ...editPayload } = values;
      onSubmit(editPayload);
    } else {
      onSubmit(values);
    }
  };

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin hồ sơ"
              : "Nhập thông tin tài khoản mới"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          {}
          {!isEdit && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label htmlFor="username">
                    Tên đăng nhập <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    placeholder="VD: nguyenvana"
                    {...register("username", {
                      required: "Vui lòng nhập tên đăng nhập",
                      minLength: { value: 3, message: "Tối thiểu 3 ký tự" },
                      maxLength: { value: 50, message: "Tối đa 50 ký tự" },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: "Chỉ được dùng chữ, số và _",
                      },
                    })}
                  />
                  <FieldError message={errors.username?.message} />
                </div>

                <div className="grid gap-1">
                  <Label htmlFor="password">
                    Mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tối thiểu 8 ký tự"
                    {...register("password", {
                      required: "Vui lòng nhập mật khẩu",
                      minLength: { value: 8, message: "Tối thiểu 8 ký tự" },
                    })}
                  />
                  <FieldError message={errors.password?.message} />
                </div>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="VD: user@example.com"
                  {...register("email", {
                    required: "Vui lòng nhập email",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email không hợp lệ",
                    },
                  })}
                />
                <FieldError message={errors.email?.message} />
              </div>
            </>
          )}

          {}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                placeholder="VD: Nguyễn Văn A"
                {...register("fullName", {
                  maxLength: { value: 100, message: "Tối đa 100 ký tự" },
                })}
              />
              <FieldError message={errors.fullName?.message} />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="VD: 0912345678"
                {...register("phone", {
                  pattern: {
                    value: /^(0|\+84)[0-9]{9}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                })}
              />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Giới tính</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "UNSET"}
                    onValueChange={(v) =>
                      field.onChange(v === "UNSET" ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNSET">Không xác định</SelectItem>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="birthday">Ngày sinh</Label>
              <Input
                id="birthday"
                type="date"
                {...register("birthday", {
                  validate: (val) => {
                    if (!val) return true;
                    const today = new Date().toISOString().split("T")[0];
                    return val < today || "Ngày sinh không hợp lệ";
                  },
                })}
              />
              <FieldError message={errors.birthday?.message} />
            </div>
          </div>

          {}
          <div className="grid gap-1">
            <Label>Vai trò</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Người dùng</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {}
          {isEdit && (
            <div className="grid gap-1">
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                placeholder="https://..."
                {...register("avatar")}
              />
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu…" : isEdit ? "Cập nhật" : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
