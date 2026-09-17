import type { User, UpdateProfilePayload } from "@/api/authApi";
import type { UserGender } from "@/api/userApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChangePassword, useMe, useUpdateProfile } from "@/hooks/useAuth";
import useAuthStore from "@/store/authStore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface ProfileFormValues {
  fullName: string;
  phone: string;
  gender: UserGender;
  birthday: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ApiError {
  apiMessage?: string;
  response?: {
    data?: {
      validationErrors?: Record<string, string>;
    };
  };
}

const EMPTY_PROFILE: ProfileFormValues = {
  fullName: "",
  phone: "",
  gender: "MALE",
  birthday: "",
};

const EMPTY_PASSWORD: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const PROFILE_FIELDS = new Set<keyof ProfileFormValues>([
  "fullName",
  "phone",
  "gender",
  "birthday",
]);

function toProfileValues(user: User): ProfileFormValues {
  return {
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    gender: user.gender === "FEMALE" ? "FEMALE" : "MALE",
    birthday: user.birthday ?? "",
  };
}

function adultBirthdayLimit(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const { isLoading } = useMe();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutate: changePassword, isPending: isChanging } = useChangePassword();
  const maximumBirthday = adultBirthdayLimit();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    control,
    reset: resetProfile,
    setError: setProfileError,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormValues>({ defaultValues: EMPTY_PROFILE });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    getValues: getPasswordValues,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({ defaultValues: EMPTY_PASSWORD });

  useEffect(() => {
    if (user) resetProfile(toProfileValues(user));
  }, [resetProfile, user]);

  const onProfileSubmit = (values: ProfileFormValues) => {
    const payload: UpdateProfilePayload = {
      ...values,
      fullName: values.fullName.trim().replace(/\s+/g, " "),
      phone: values.phone.trim(),
    };

    updateProfile(payload, {
      onSuccess: (updatedUser) => {
        resetProfile(toProfileValues(updatedUser));
        toast.success("Cập nhật hồ sơ thành công");
      },
      onError: (error) => {
        const apiError = error as ApiError;
        const validationErrors = apiError.response?.data?.validationErrors;

        Object.entries(validationErrors ?? {}).forEach(([field, message]) => {
          const profileField = field === "adult" ? "birthday" : field;
          if (PROFILE_FIELDS.has(profileField as keyof ProfileFormValues)) {
            setProfileError(profileField as keyof ProfileFormValues, {
              type: "server",
              message,
            });
          }
        });

        toast.error(apiError.apiMessage ?? "Không thể cập nhật hồ sơ");
      },
    });
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePassword(values, {
      onSuccess: () => {
        resetPassword();
        toast.success("Đổi mật khẩu thành công");
      },
      onError: (error) => {
        const apiError = error as ApiError;
        toast.error(apiError.apiMessage ?? "Không thể đổi mật khẩu");
      },
    });
  };

  if (isLoading && !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-sm text-destructive">Không thể tải hồ sơ người dùng.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cập nhật thông tin của {user.role === "ADMIN" ? "quản trị viên" : "nhân viên"}.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="fullName">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullName"
                autoComplete="name"
                aria-invalid={Boolean(profileErrors.fullName)}
                {...registerProfile("fullName", {
                  setValueAs: (value: string) => value.trim().replace(/\s+/g, " "),
                  required: "Vui lòng nhập họ và tên",
                  minLength: { value: 2, message: "Họ tên phải có ít nhất 2 ký tự" },
                  maxLength: { value: 100, message: "Họ tên không được quá 100 ký tự" },
                  pattern: {
                    value: /^[\p{L}][\p{L}\s.'’-]*$/u,
                    message: "Họ tên chỉ được chứa chữ cái và dấu cách",
                  },
                })}
              />
              <FieldError message={profileErrors.fullName?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="Ví dụ: 0912345678"
                aria-invalid={Boolean(profileErrors.phone)}
                {...registerProfile("phone", {
                  setValueAs: (value: string) => value.trim(),
                  required: "Vui lòng nhập số điện thoại",
                  pattern: {
                    value: /^(03|05|07|08|09)\d{8}$/,
                    message: "Số điện thoại Việt Nam không hợp lệ",
                  },
                })}
              />
              <FieldError message={profileErrors.phone?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gender">
                Giới tính <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="gender"
                control={control}
                rules={{ required: "Vui lòng chọn giới tính" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="gender" aria-invalid={Boolean(profileErrors.gender)}>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={profileErrors.gender?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birthday">
                Ngày sinh <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birthday"
                type="date"
                max={maximumBirthday}
                aria-invalid={Boolean(profileErrors.birthday)}
                {...registerProfile("birthday", {
                  required: "Vui lòng chọn ngày sinh",
                  validate: (value) =>
                    value <= maximumBirthday || "Nhân viên phải đủ 18 tuổi trở lên",
                })}
              />
              <FieldError message={profileErrors.birthday?.message} />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={isUpdating || !isProfileDirty}>
                {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">
                Mật khẩu hiện tại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(passwordErrors.currentPassword)}
                {...registerPassword("currentPassword", {
                  required: "Vui lòng nhập mật khẩu hiện tại",
                })}
              />
              <FieldError message={passwordErrors.currentPassword?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">
                  Mật khẩu mới <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordErrors.newPassword)}
                  {...registerPassword("newPassword", {
                    required: "Vui lòng nhập mật khẩu mới",
                    minLength: { value: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
                    maxLength: { value: 100, message: "Mật khẩu không được quá 100 ký tự" },
                  })}
                />
                <FieldError message={passwordErrors.newPassword?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  Xác nhận mật khẩu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordErrors.confirmPassword)}
                  {...registerPassword("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu mới",
                    validate: (value) =>
                      value === getPasswordValues("newPassword")
                      || "Mật khẩu xác nhận không khớp",
                  })}
                />
                <FieldError message={passwordErrors.confirmPassword?.message} />
              </div>
            </div>

            <Button type="submit" disabled={isChanging}>
              {isChanging && <Loader2 className="mr-2 size-4 animate-spin" />}
              Đổi mật khẩu
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
