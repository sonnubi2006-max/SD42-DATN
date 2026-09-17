import type {
  UserGender,
  UserResponse,
  UserRole,
  UserStatus,
} from "@/api/userApi";
import { useUpdateUser } from "@/hooks/useUser";
import { useProvinces, useWardsByProvince } from "@/hooks/useVnAddress";
import { useForm } from "@tanstack/react-form";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { KeyRound, ImagePlus, X } from "lucide-react";
import { FieldError } from "@/components/form/FieldError";
import AddressSelects from "./AddressSelect";
import AcceptModal from "../AcceptModal";
import { useMe } from "@/hooks/useAuth";
import CccdScannerModal from "../cccd/CccdScannerModal";
import { vnAddressApi } from "@/api/vnAddressApi";

interface EditFormProps {
  user: UserResponse;
  onNavigateBack: () => void;
  onOpenReset: () => void;
}

const userSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên tối thiểu 2 ký tự")
    .max(100, "Họ tên tối đa 100 ký tự"),
  phone: z
    .string()
    .trim()
    .regex(/^(03|05|07|08|09)\d{8}$/, "Số điện thoại Việt Nam không hợp lệ"),
  gender: z.enum(["MALE", "FEMALE"], { error: "Vui lòng chọn giới tính" }),
  birthday: z
    .string()
    .min(1, "Ngày sinh không được để trống")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh không hợp lệ (YYYY-MM-DD)")
    .refine((value) => {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      const maxBirthday = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
      return value <= maxBirthday;
    }, "Nhân viên phải đủ 18 tuổi trở lên"),
  province: z.string().trim().min(1, "Tỉnh/TP không được để trống"),
  district: z.string().trim().min(1, "Quận/Huyện không được để trống"),
  ward: z.string().trim().min(1, "Phường/Xã không được để trống"),
  cccd: z
    .string()
    .trim()
    .min(1, "CCCD không được để trống")
    .regex(/^\d{12}$/, "CCCD phải gồm đúng 12 chữ số"),
  streetAddress: z
    .string()
    .trim()
    .min(1, "Địa chỉ chi tiết không được để trống"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  role: z.enum(["ADMIN", "STAFF"]),
});
type UserForm = z.infer<typeof userSchema>;

export default function EditForm({
  user,
  onNavigateBack,
  onOpenReset,
}: EditFormProps) {
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { data: account } = useMe();

  const isSelf = user.userId === account?.userId;
  const [openScanner, setOpenScanner] = useState(false);
  const adultCutoff = new Date();
  adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
  const maxBirthday = `${adultCutoff.getFullYear()}-${String(adultCutoff.getMonth() + 1).padStart(2, "0")}-${String(adultCutoff.getDate()).padStart(2, "0")}`;

  const [provinceCode, setProvinceCode] = useState<number>();
  const [provinceName, setProvinceName] = useState<string>(user.province);
  const [wardCode, setWardCode] = useState<string | number>();
  const autoFill = useRef(Boolean(user.province || user.ward));

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar ?? "");

  const { data: provinces = [] } = useProvinces();
  const { data: wards = [] } = useWardsByProvince(provinceCode, provinceName);

  const mappedWards = wards.map((w) => ({
    code: w.ghnWardCode || w.wardCode,
    name: w.wardName,
  }));

  const handleRemoveAvatar = useCallback(() => {
    setAvatarFile(null);
    setAvatarPreview("");
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Vui lòng chọn file ảnh hợp lệ");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      e.target.value = "";
    },
    [],
  );

  const { Field, handleSubmit, setFieldValue, getFieldValue } = useForm({
    defaultValues: {
      fullName: user.fullName,
      phone: user.phone,
      gender: user.gender === "FEMALE" ? "FEMALE" : "MALE",
      birthday: user.birthday,
      status: user.status ?? "ACTIVE",
      role: user.role ?? "STAFF",
      cccd: user.cccd ?? "",
      province: user.province,
      district: "-",
      ward: user.ward,
      streetAddress: user.streetAddress ?? "",
    } satisfies UserForm,
    validators: { onSubmit: userSchema },
    onSubmit: async ({ value }) => {
      updateUser(
        {
          id: user.userId,
          payload: {
            ...value,
            district: "-",
            avatar: user.avatar ?? "",
            file: avatarFile ?? undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Cập nhật người dùng thành công");
            onNavigateBack();
          },
          onError: (err: any) =>
            toast.error(err?.apiMessage ?? "Cập nhật thất bại"),
        },
      );
    },
  });

  const handleProvinceChange = (code: number | undefined) => {
    autoFill.current = false;
    setProvinceCode(code);
    const p = provinces.find((x) => x.code === code);
    setProvinceName(p?.name ?? "");
    setWardCode(undefined);
    setFieldValue("district", "-");
    setFieldValue("ward", "");
  };

  const handleWardChange = (code: string | number | undefined) => {
    setWardCode(code);
    if (code) {
      const w = wards.find((x) => (x.ghnWardCode || x.wardCode) === code);
      setFieldValue("district", w?.districtName ?? "-");
    } else {
      setFieldValue("district", "-");
    }
  };

  const province = getFieldValue("province");
  const ward = getFieldValue("ward");

  const cleanName = (s: string) =>
    s
      .toLowerCase()
      .replace(/^(tỉnh|thành phố|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, "")
      .trim();

  useEffect(() => {
    if (!autoFill.current || provinceCode || !province) return;
    const p = provinces.find((x) => cleanName(x.name) === cleanName(province));
    if (p) {
      queueMicrotask(() => {
        setProvinceCode(Number(p.code));
        setProvinceName(p.name);
      });
    }
  }, [provinces, province]);

  useEffect(() => {
    if (!autoFill.current || wardCode || !ward || wards.length === 0) return;
    const w = wards.find((x) => cleanName(x.wardName) === cleanName(ward));
    if (w) {
      queueMicrotask(() => {
        setWardCode(w.ghnWardCode || w.wardCode);
        autoFill.current = false;
      });
    }
  }, [wards, ward]);

  return (
    <Card>
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-base font-medium flex items-center justify-between gap-4">
          Chỉnh sửa thông tin
          <Button onClick={() => setOpenScanner(true)}>Quét CCCD</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {}
          <div className="flex items-center gap-4">
            <div
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-400 transition shrink-0"
              onClick={() =>
                document.getElementById("edit-avatar-input")?.click()
              }
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Ảnh đại diện xem trước"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImagePlus className="w-6 h-6 text-gray-400" />
              )}
              {avatarPreview && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAvatar();
                  }}
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Ảnh đại diện</p>
              <p>Click vào khung tròn để chọn ảnh mới</p>
              <p>PNG, JPG, WEBP</p>
            </div>
            <input
              id="edit-avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input id="email" type="email" value={user.email} disabled />
            </div>
            <Field name="fullName">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">
                    Họ tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field name="cccd">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label htmlFor="cccd">
                    CCCD <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="cccd"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>
            <Field name="phone">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field name="gender">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label>
                    Giới tính <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => {
                      if (v) field.handleChange(v as UserGender);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Nam</SelectItem>
                      <SelectItem value="FEMALE">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>

            <Field name="birthday">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label htmlFor="birthday">
                    Ngày sinh <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    max={maxBirthday}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field name="role">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label>
                    Vai trò <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={isSelf ? "ADMIN" : field.state.value}
                    disabled={isSelf}
                    onValueChange={(v) => field.handleChange(v as UserRole)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Nhân viên</SelectItem>
                      <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>

            <Field name="status">
              {(field: any) => (
                <div className="space-y-1.5">
                  <Label>
                    Trạng thái <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={isSelf ? "ACTIVE" : field.state.value}
                    disabled={isSelf}
                    onValueChange={(v) => field.handleChange(v as UserStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                      <SelectItem value="INACTIVE">Vô hiệu hoá</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </div>
              )}
            </Field>
          </div>

          <AddressSelects
            Field={Field}
            provinceCode={provinceCode}
            wardCode={wardCode}
            provinces={provinces}
            wards={mappedWards}
            onProvinceChange={handleProvinceChange}
            onWardChange={handleWardChange}
          />

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onOpenReset}
              className="gap-2"
            >
              <KeyRound size={14} />
              Reset mật khẩu
            </Button>

            <AcceptModal
              typeConfirm="UPDATE"
              message="Bạn có chắc muốn lưu các dữ liệu này không?"
              onConfirm={handleSubmit}
              isPending={isUpdating}
            >
              <Button type="button" disabled={isUpdating}>
                {isUpdating ? "Đang lưu..." : "Xác nhận"}
              </Button>
            </AcceptModal>
          </div>
        </form>
        <CccdScannerModal
          open={openScanner}
          onClose={() => setOpenScanner(false)}
          onSuccess={async (data) => {
            setFieldValue("cccd", data.cccd);
            setFieldValue("fullName", data.fullName);
            setFieldValue("gender", data.gender);
            setFieldValue("birthday", data.birthday);
            setFieldValue("district", "-");
            setFieldValue("streetAddress", data.streetAddress ?? "");

            const resolved = await vnAddressApi.resolveLegacyAddress(
              data.ward ?? "",
              data.district ?? "",
              data.province ?? "",
            );
            if (!resolved) {
              toast.warning("Không thể tự đối chiếu địa chỉ V2. Vui lòng chọn tỉnh và phường/xã.");
              setFieldValue("province", "");
              setFieldValue("ward", "");
              setProvinceCode(undefined);
              setProvinceName("");
              setWardCode(undefined);
              return;
            }

            setFieldValue("province", resolved.province);
            setFieldValue("ward", resolved.ward);
            setProvinceCode(resolved.provinceCode);
            setProvinceName(resolved.province);
            setWardCode(undefined);
            autoFill.current = true;
            toast.success(`Đã chuyển địa chỉ sang ${resolved.ward}, ${resolved.province}`);
          }}
        />
      </CardContent>
    </Card>
  );
}
