import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerRequest } from "@/api/customerApi";
import AcceptModal from "../AcceptModal";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

interface Props {
  defaultValues?: Partial<CustomerRequest>;
  isPending: boolean;
  submitLabel: string;
  onSubmit: (payload: CustomerRequest) => void;
  onCancel: () => void;
}

export function CustomerForm({
  defaultValues,
  isPending,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const adultCutoff = new Date();
  adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
  const maxBirthday = [
    adultCutoff.getFullYear(),
    String(adultCutoff.getMonth() + 1).padStart(2, "0"),
    String(adultCutoff.getDate()).padStart(2, "0"),
  ].join("-");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CustomerRequest>({
    defaultValues: {
      emailSubscribed: true,
      ...defaultValues,
      gender: defaultValues?.gender === "FEMALE" ? "FEMALE" : "MALE",
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="VD: khach@gmail.com"
            {...register("email", {
              required: "Vui lòng nhập email",
              validate: (value) => {
                value?.trim();
                const regex =
                  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return regex.test(value ?? "") || "Email không hợp lệ";
              },
              maxLength: {
                value: 255,
                message: "Email tối đa 255 ký tự",
              },
            })}
          />

          <FieldError message={errors.email?.message} />
        </div>

        <div className="grid gap-1">
          <Label htmlFor="fullName">Họ và tên</Label>
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
              validate: (value) => {
                value?.trim();

                return (
                  /^[a-zA-ZÀ-ỹ\s]+$/.test(value ?? "") ||
                  "Họ tên không được chứa ký tự đặc biệt"
                );
              },
            })}
          />
          <FieldError message={errors.fullName?.message} />
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            placeholder="VD: 0912345678"
            {...register("phone", {
              required: "Vui lòng nhập số điện thoại",
              pattern: {
                value: /^(0[3|5|7|8|9])[0-9]{8}$/,
                message: "Số điện thoại không hợp lệ",
              },
            })}
          />

          <FieldError message={errors.phone?.message} />
        </div>

        <div className="grid gap-1">
          <Label>Giới tính</Label>
          <Controller
            name="gender"
            control={control}
            rules={{
              required: "Vui lòng chọn giới tính",
            }}
            render={({ field }) => (
              <Select
                value={field.value ?? "MALE"}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giới tính" />
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
      <div className="grid gap-1 max-w-[50%]">
        <Label htmlFor="birthday">Ngày sinh</Label>
        <Input
          id="birthday"
          type="date"
          max={maxBirthday}
          {...register("birthday", {
            validate: (value) => {
              if (!value) return true;
              return (
                value <= maxBirthday ||
                "Khách hàng phải đủ 18 tuổi trở lên"
              );
            },
          })}
        />

        <FieldError message={errors.birthday?.message} />
      </div>

      {}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>Nhận email ưu đãi</Label>
          <p className="text-xs text-muted-foreground">
            Gửi thông tin khuyến mãi của cửa hàng tới email khách
          </p>
        </div>
        <Controller
          name="emailSubscribed"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value ?? true}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Huỷ
        </Button>
        <AcceptModal
          typeConfirm="UPDATE"
          message="Bạn có chắc muốn lưu các dữ liệu này không?"
          onConfirm={handleSubmit(onSubmit)}
          isPending={isPending}
        >
          <Button type="button" disabled={isPending}>
            {isPending ? "Đang lưu..." : submitLabel}
          </Button>
        </AcceptModal>
      </div>
    </form>
  );
}
