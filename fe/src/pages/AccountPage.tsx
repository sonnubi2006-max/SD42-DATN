import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  User,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Mail,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useChangePassword, useMe, useUpdateProfile } from "@/hooks/useAuth";
import type { Gender } from "@/api/authApi";
import AccountLayout from "@/components/account/AccountLayout";
import { cn } from "@/lib/utils";

interface ProfileFormData {
  fullName: string;
  phone: string;
  gender: Gender;
  birthday: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountPage() {
  const { data: me } = useMe();
  const { mutate: updateProfile, isPending: savingProfile } =
    useUpdateProfile();
  const { mutate: changePassword, isPending: changingPassword } =
    useChangePassword();

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    watch: watchProfile,
    reset: resetProfileForm,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      phone: "",
      gender: "OTHER",
      birthday: "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const watchGender = watchProfile("gender", "OTHER");
  const watchNewPassword = watchPassword("newPassword", "");
  const watchConfirmPassword = watchPassword("confirmPassword", "");

  const hasMinLength = watchNewPassword.length >= 8;
  const hasLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)/.test(watchNewPassword);
  const isPasswordMatched =
    watchNewPassword.length > 0 && watchNewPassword === watchConfirmPassword;

  useEffect(() => {
    if (me) {
      const g = (me as { gender?: string }).gender;
      const initialGender: Gender =
        g === "MALE" || g === "FEMALE" || g === "OTHER" ? g : "OTHER";

      resetProfileForm({
        fullName: (me as { fullName?: string }).fullName ?? "",
        phone: (me as { phone?: string }).phone ?? "",
        gender: initialGender,
        birthday: (me as { birthday?: string }).birthday ?? "",
      });
    }
  }, [me, resetProfileForm]);

  const onSaveProfile = (data: ProfileFormData) => {
    updateProfile(
      {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        gender: data.gender,
        birthday: data.birthday || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Cập nhật thông tin hồ sơ thành công!");
        },
        onError: (err) => {
          toast.error(
            err?.apiMessage ??
            "Không thể cập nhật hồ sơ. Vui lòng thử lại sau!",
          );
        },
      },
    );
  };

  const onChangePassword = (data: PasswordFormData) => {
    changePassword(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      },
      {
        onSuccess: () => {
          resetPasswordForm();
          setShowCurrentPass(false);
          setShowNewPass(false);
          setShowConfirmPass(false);
          toast.success(
            "Đổi mật khẩu thành công! Vui lòng bảo mật thông tin tài khoản.",
          );
        },
        onError: (err) => {
          toast.error(
            err?.apiMessage ??
            "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!",
          );
        },
      },
    );
  };

  const displayName =
    (me as { fullName?: string })?.fullName || me?.username || "Thành viên";
  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0].toUpperCase())
    .join("");

  return (
    <AccountLayout>
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white shadow-lg">
          <div className="absolute -right-10 -bottom-10 size-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white font-bold text-xl shadow-inner backdrop-blur-md border border-white/20">
                {userInitials || "US"}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight">
                    {displayName}
                  </h1>
                </div>
                <p className="text-xs text-blue-100/80 flex items-center gap-1.5">
                  <Mail className="size-3.5" />{" "}
                  {me?.email || "Chưa cập nhật email"}
                  <span className="mx-1">•</span>
                  <User className="size-3.5" /> @{me?.username}
                </p>
              </div>
            </div>
          </div>
        </div>

        { }
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="border-b border-border/50 bg-muted/20 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
              <div>
                <CardTitle className="text-sm font-bold">
                  Thông tin tài khoản hệ thống
                </CardTitle>
                <CardDescription className="text-xs">
                  Thông tin định danh cố định không thể chỉnh sửa trực tiếp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Tên đăng nhập (Username)
              </Label>
              <div className="relative">
                <Input
                  value={me?.username ?? ""}
                  disabled
                  className="bg-muted/40  text-xs pl-8 border-border/60"
                />
                <User className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Địa chỉ Email
              </Label>
              <div className="relative">
                <Input
                  value={me?.email ?? ""}
                  disabled
                  className="bg-muted/40  text-xs pl-8 border-border/60"
                />
                <Mail className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        { }
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="border-b border-border/50 bg-muted/20 py-4">
            <div className="flex items-center gap-2">
              <User className="size-4 text-primary" />
              <div>
                <CardTitle className="text-sm font-bold">
                  Hồ sơ & Thông tin liên hệ
                </CardTitle>
                <CardDescription className="text-xs">
                  Cập nhật thông tin cá nhân của bạn để nhận thông báo và giao
                  hàng nhanh chóng
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={handleProfileSubmit(onSaveProfile)}
              className="space-y-5"
              noValidate
            >
              <div className="grid gap-5 sm:grid-cols-2">
                { }
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className={cn(
                        "pl-8 text-xs transition-all",
                        profileErrors.fullName
                          ? "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                          : "border-input focus-visible:ring-primary",
                      )}
                      {...registerProfile("fullName", {
                        required: "Vui lòng nhập họ và tên của bạn",
                        minLength: {
                          value: 2,
                          message: "Họ và tên phải có ít nhất 2 ký tự",
                        },
                        maxLength: {
                          value: 100,
                          message: "Họ và tên không được dài quá 100 ký tự",
                        },
                        pattern: {
                          value:
                            /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấnầẩẫậnắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừÝỲỴỶỸýỳỵỷỹ\s]+$/,
                          message:
                            "Họ và tên chỉ bao gồm chữ cái và khoảng trắng, không chứa số hay ký tự đặc biệt",
                        },
                      })}
                    />
                    <User className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  </div>
                  {profileErrors.fullName && (
                    <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{profileErrors.fullName.message}</span>
                    </p>
                  )}
                </div>

                { }
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      className={cn(
                        "pl-8 text-xs  transition-all",
                        profileErrors.phone
                          ? "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                          : "border-input focus-visible:ring-primary",
                      )}
                      {...registerProfile("phone", {
                        required: "Vui lòng nhập số điện thoại liên hệ",
                        pattern: {
                          value: /^(03|05|07|08|09)\d{8}$/,
                          message:
                            "Số điện thoại không hợp lệ (Định dạng đúng: 10 chữ số bắt đầu bằng 03, 05, 07, 08 hoặc 09)",
                        },
                      })}
                    />
                    <Phone className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  </div>
                  {profileErrors.phone && (
                    <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{profileErrors.phone.message}</span>
                    </p>
                  )}
                </div>

                { }
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Giới tính</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "MALE", label: "Nam" },
                      { value: "FEMALE", label: "Nữ" },
                      { value: "OTHER", label: "Khác" },
                    ].map((g) => {
                      const isSelected = watchGender === g.value;
                      return (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() =>
                            setProfileValue("gender", g.value as Gender, {
                              shouldDirty: true,
                            })
                          }
                          className={cn(
                            "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold cursor-pointer transition-all select-none",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-2xs font-bold"
                              : "border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span>{g.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                { }
                <div className="space-y-1.5">
                  <Label htmlFor="birthday" className="text-xs font-semibold">
                    Ngày sinh
                  </Label>
                  <div className="relative">
                    <Input
                      id="birthday"
                      type="date"
                      className={cn(
                        "pl-8 text-xs transition-all",
                        profileErrors.birthday
                          ? "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                          : "border-input focus-visible:ring-primary",
                      )}
                      {...registerProfile("birthday", {
                        validate: (v) => {
                          if (!v) return true;
                          const date = new Date(v);
                          const today = new Date();
                          if (date > today)
                            return "Ngày sinh không được vượt quá ngày hiện tại";
                          const age = today.getFullYear() - date.getFullYear();
                          if (age > 120) return "Năm sinh không hợp lệ";
                          return true;
                        },
                      })}
                    />
                    <Calendar className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  </div>
                  {profileErrors.birthday && (
                    <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{profileErrors.birthday.message}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-2">
                <p className="text-[11px] text-muted-foreground">
                  * Các thông tin có dấu{" "}
                  <span className="text-destructive">*</span> là bắt buộc
                </p>
                <Button
                  type="submit"
                  disabled={savingProfile || !isProfileDirty}
                  className="cursor-pointer font-semibold shadow-xs"
                >
                  {savingProfile && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Lưu thay đổi hồ sơ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        { }
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="border-b border-border/50 bg-muted/20 py-4">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-amber-500" />
              <div>
                <CardTitle className="text-sm font-bold">
                  Bảo mật & Đổi mật khẩu
                </CardTitle>
                <CardDescription className="text-xs">
                  Đổi mật khẩu định kỳ giúp bảo vệ tài khoản khỏi truy cập trái
                  phép
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form
              onSubmit={handlePasswordSubmit(onChangePassword)}
              className="space-y-4"
              noValidate
            >
              { }
              <div className="space-y-1.5">
                <Label
                  htmlFor="currentPassword"
                  className="text-xs font-semibold"
                >
                  Mật khẩu hiện tại <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPass ? "text" : "password"}
                    placeholder="Nhập mật khẩu hiện tại..."
                    className={cn(
                      "pr-10 text-xs transition-all",
                      passwordErrors.currentPassword
                        ? "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                        : "border-input focus-visible:ring-primary",
                    )}
                    {...registerPassword("currentPassword", {
                      required: "Vui lòng nhập mật khẩu hiện tại của bạn",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    title={showCurrentPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showCurrentPass ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{passwordErrors.currentPassword.message}</span>
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                { }
                <div className="space-y-1.5">
                  <Label
                    htmlFor="newPassword"
                    className="text-xs font-semibold"
                  >
                    Mật khẩu mới <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPass ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
                      className={cn(
                        "pr-10 text-xs transition-all",
                        passwordErrors.newPassword
                          ? "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                          : "border-input focus-visible:ring-primary",
                      )}
                      {...registerPassword("newPassword", {
                        required: "Vui lòng nhập mật khẩu mới",
                        minLength: {
                          value: 8,
                          message: "Mật khẩu mới phải có tối thiểu 8 ký tự",
                        },
                        pattern: {
                          value: /^(?=.*[A-Za-z])(?=.*\d)/,
                          message:
                            "Mật khẩu mới phải bao gồm ít nhất 1 chữ cái và 1 chữ số",
                        },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showNewPass ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{passwordErrors.newPassword.message}</span>
                    </p>
                  )}
                </div>

                { }
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold"
                  >
                    Xác nhận mật khẩu mới{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới..."
                      className={cn(
                        "pr-10 text-xs transition-all",
                        passwordErrors.confirmPassword
                          ? "border-destructive bg-destructive/5 focus-visible:ring-destructive"
                          : "border-input focus-visible:ring-primary",
                      )}
                      {...registerPassword("confirmPassword", {
                        required: "Vui lòng nhập lại mật khẩu mới để xác nhận",
                        validate: (v, formValues) =>
                          v === formValues.newPassword ||
                          "Mật khẩu xác nhận không khớp với mật khẩu mới",
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition cursor-pointer"
                    >
                      {showConfirmPass ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="size-3 shrink-0" />
                      <span>{passwordErrors.confirmPassword.message}</span>
                    </p>
                  )}
                </div>
              </div>

              { }
              {watchNewPassword.length > 0 && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2 text-xs animate-in fade-in duration-200">
                  <p className="font-semibold text-muted-foreground text-[11px] uppercase tracking-wider">
                    Yêu cầu độ an toàn của mật khẩu:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 font-medium transition-colors",
                        hasMinLength
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {hasMinLength ? (
                        <Check className="size-3.5 stroke-[3]" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                      <span>Độ dài từ 8 ký tự trở lên</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 font-medium transition-colors",
                        hasLetterAndNumber
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {hasLetterAndNumber ? (
                        <Check className="size-3.5 stroke-[3]" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                      <span>Gồm chữ cái & chữ số</span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 font-medium transition-colors",
                        isPasswordMatched
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {isPasswordMatched ? (
                        <Check className="size-3.5 stroke-[3]" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                      <span>Mật khẩu xác nhận trùng khớp</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={changingPassword}
                  variant="outline"
                  className="cursor-pointer font-semibold border-amber-500/50 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
                >
                  {changingPassword && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Xác nhận đổi mật khẩu
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
