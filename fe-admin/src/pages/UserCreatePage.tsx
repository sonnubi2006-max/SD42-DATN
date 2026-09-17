import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useCreateStaff } from "@/hooks/useUser";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, X } from "lucide-react";

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
import type { CreateStaffPayload } from "@/api/userApi";
import { useRef, useState, useCallback, useEffect } from "react";
import { useProvinces, useWardsByProvince } from "@/hooks/useVnAddress";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import CccdScannerModal from "@/components/cccd/CccdScannerModal";
import { vnAddressApi } from "@/api/vnAddressApi";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export default function UserCreatePage() {
  const adultCutoff = new Date();
  adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
  const maxBirthday = `${adultCutoff.getFullYear()}-${String(adultCutoff.getMonth() + 1).padStart(2, "0")}-${String(adultCutoff.getDate()).padStart(2, "0")}`;
  const navigate = useNavigate();
  const { mutate: create, isPending } = useCreateStaff();

  const [provinceCode, setProvinceCode] = useState<number | undefined>(undefined);
  const [wardCode, setWardCode] = useState<string | undefined>(undefined);
  const autoFill = useRef(true); 

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [openScanner, setOpenScanner] = useState(false);

  const { data: provinces = [] } = useProvinces();
  const { data: wards = [], isLoading: wardsLoading } = useWardsByProvince(provinceCode);

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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<CreateStaffPayload>({
    defaultValues: {
      role: "STAFF",
      gender: "MALE",
      province: "",
      district: "-",
      ward: "",
      streetAddress: "",
    },
  });

  const onSubmit = (payload: CreateStaffPayload) => {
    create(
      { ...payload, district: "-", file: avatarFile ?? undefined },
      {
        onSuccess: () => {
          toast.success("Tạo tài khoản thành công");
          navigate("/users");
        },
        onError: (err: any) => {
          console.log(err);
          toast.error(err?.apiMessage ?? "Tạo thất bại");
        },
      },
    );
  };

  const cleanName = (s: string) => {
    if (!s) return "";
    return s
      .toLowerCase()
      .replace(/^(tỉnh|thành phố|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, "")
      .trim();
  };

  useEffect(() => {
    if (!provinceCode) return;

    const form = getValues();

    const w = wards.find((w) => cleanName(w.wardName) === cleanName(form.ward));

    if (w) queueMicrotask(() => setWardCode(w.ghnWardCode || w.wardCode));
  }, [getValues, provinceCode, wards]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-medium text-foreground">
            Thêm nhân viên
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            Thông tin tài khoản
            <Button onClick={() => setOpenScanner(true)}>Quét CCCD</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {}
            <Label className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              Tên đăng nhập và mật khẩu sẽ được hệ thống tự sinh và gửi tới
              email của nhân viên. Nhân viên nên đổi mật khẩu sau lần đăng nhập
              đầu tiên.
            </Label>
            {}
            <div className="grid gap-1">
              <Label>Ảnh đại diện</Label>
              <div className="flex items-center gap-4">
                <div
                  className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 cursor-pointer hover:border-blue-400 transition"
                  onClick={() =>
                    document.getElementById("avatar-input")?.click()
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
                  <p>Click vào khung tròn để chọn ảnh</p>
                  <p>PNG, JPG, WEBP</p>
                </div>
              </div>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {}
              <div className="grid gap-1">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="VD: staff@company.com"
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
              {}
              <div className="grid gap-1">
                <Label htmlFor="fullName">
                  Họ tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="VD: Nguyễn Văn A"
                  {...register("fullName", {
                    required: "Vui lòng nhập họ tên",
                    minLength: {
                      value: 2,
                      message: "Họ tên tối thiểu 2 ký tự",
                    },
                    maxLength: {
                      value: 100,
                      message: "Họ tên tối đa 100 ký tự",
                    },
                  })}
                />
                <FieldError message={errors.fullName?.message} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {}
              <div className="grid gap-1">
                <Label htmlFor="fullName">
                  CCCD <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cccd"
                  placeholder="VD: 09876543456"
                  {...register("cccd", {
                    required: "Vui lòng nhập Căn cước",
                    pattern: {
                      value: /^\d{12}$/,
                      message: "CCCD phải gồm đúng 12 chữ số",
                    },
                  })}
                />
                <FieldError message={errors.cccd?.message} />
              </div>
              {}
              <div className="grid gap-1">
                <Label htmlFor="phone">
                  Số điện thoại <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="VD: 0912345678"
                  {...register("phone", {
                    required: "Vui lòng nhập số điện thoại",
                    pattern: {
                      value: /^(03|05|07|08|09)\d{8}$/,
                      message: "Số điện thoại Việt Nam không hợp lệ",
                    },
                  })}
                />
                <FieldError message={errors.phone?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {}
              <div className="grid gap-1">
                <Label>
                  Vai trò <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Nhân viên</SelectItem>
                        <SelectItem value="ADMIN">
                          Quản trị viên
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.role?.message} />
              </div>
              {}
              <div className="grid gap-1">
                <Label>
                  Giới tính <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.gender?.message} />
              </div>
            </div>

            {}
            <div className="grid gap-1">
              <Label htmlFor="birthday">
                Ngày sinh <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birthday"
                type="date"
                max={maxBirthday}
                {...register("birthday", {
                  required: "Vui lòng nhập ngày sinh",
                  validate: (value) =>
                    value <= maxBirthday || "Nhân viên phải đủ 18 tuổi trở lên",
                })}
              />
              <FieldError message={errors.birthday?.message} />
            </div>

            {}
            <div className="grid grid-cols-2 gap-3">
              {}
              <div className="grid gap-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Tỉnh/TP <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="province"
                  control={control}
                  rules={{ required: "Bắt buộc" }}
                  render={({ field }) => (
                    <NativeSelect
                      value={provinceCode != null ? String(provinceCode) : ""}
                      onChange={(e) => {
                        autoFill.current = false;
                        const v = e.target.value;
                        if (!v) {
                          setProvinceCode(undefined);
                          field.onChange("");
                          setWardCode(undefined);
                          setValue("district", "-");
                          setValue("ward", "");
                          return;
                        }
                        const id = Number(v);
                        setProvinceCode(id);
                        const p = provinces.find((x) => x.code === id);
                        field.onChange(p?.name ?? "");

                        setWardCode(undefined);
                        setValue("district", "-");
                        setValue("ward", "");
                      }}
                      className="w-full text-xs h-9.5"
                    >
                      <NativeSelectOption value="">Chọn tỉnh</NativeSelectOption>
                      {provinces.map((p) => (
                        <NativeSelectOption key={p.code} value={String(p.code)}>
                          {p.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  )}
                />
                <FieldError message={errors.province?.message} />
              </div>

              {}
              <div className="grid gap-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Phường/Xã <span className="text-destructive">*</span>
                  {wardsLoading && <span className="ml-1 text-indigo-400">⟳</span>}
                </Label>
                <Controller
                  name="ward"
                  control={control}
                  rules={{ required: "Bắt buộc" }}
                  render={({ field }) => (
                    <NativeSelect
                      disabled={provinceCode == null || wardsLoading}
                      value={wardCode != null ? String(wardCode) : ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) {
                          setWardCode(undefined);
                          field.onChange("");
                          setValue("district", "-");
                          return;
                        }
                        setWardCode(v);
                        const w = wards.find(
                          (x) => (x.ghnWardCode || x.wardCode) === v,
                        );
                        field.onChange(w?.wardName ?? "");
                        setValue("district", w?.districtName ?? "-");
                      }}
                      className="w-full text-xs h-9.5"
                    >
                      <NativeSelectOption value="">
                        {wardsLoading ? "Đang tải..." : "Chọn phường/xã"}
                      </NativeSelectOption>
                      {wards.map((w) => {
                        const code = w.ghnWardCode || w.wardCode;
                        return (
                          <NativeSelectOption key={w.wardCode} value={code}>
                            {w.wardName}
                          </NativeSelectOption>
                        );
                      })}
                    </NativeSelect>
                  )}
                />
                <FieldError message={errors.ward?.message} />
              </div>
            </div>

            <div className="grid gap-1">
              <Label htmlFor="streetAddress" className="text-xs font-semibold text-gray-700">
                Địa chỉ chi tiết <span className="text-destructive">*</span>
              </Label>
              <Input
                id="streetAddress"
                placeholder="Số nhà, tên đường..."
                {...register("streetAddress", { required: "Bắt buộc" })}
                className="text-xs h-9.5"
              />
              <FieldError message={errors.streetAddress?.message} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users")}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <CccdScannerModal
        open={openScanner}
        onClose={() => setOpenScanner(false)}
        onSuccess={async (data) => {
          setValue("cccd", data.cccd, { shouldValidate: true });
          setValue("fullName", data.fullName, { shouldValidate: true });
          setValue("birthday", data.birthday, { shouldValidate: true });
          setValue("gender", data.gender, { shouldValidate: true });
          setValue("streetAddress", data.streetAddress ?? "", { shouldValidate: true });
          setValue("district", "-");

          const resolved = await vnAddressApi.resolveLegacyAddress(
            data.ward ?? "",
            data.district ?? "",
            data.province ?? "",
          );

          if (!resolved) {
            toast.warning("Không thể tự đối chiếu địa chỉ V2. Vui lòng chọn tỉnh và phường/xã.");
            setProvinceCode(undefined);
            setWardCode(undefined);
            setValue("province", "");
            setValue("ward", "");
            return;
          }

          setValue("province", resolved.province, { shouldValidate: true });
          setValue("ward", resolved.ward, { shouldValidate: true });
          setProvinceCode(resolved.provinceCode);
          setWardCode(undefined);
          autoFill.current = true;
          toast.success(`Đã chuyển địa chỉ sang ${resolved.ward}, ${resolved.province}`);
        }}
      />
    </div>
  );
}
