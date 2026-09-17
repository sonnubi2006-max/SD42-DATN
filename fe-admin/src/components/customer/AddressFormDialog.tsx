import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useProvinces, useWardsByProvince } from "@/hooks/useVnAddress";

import type { AddressRequest, AddressResponse } from "@/api/customerApi";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: AddressRequest | AddressResponse | null;
  isPending?: boolean;
  onSubmit: (payload: AddressRequest) => void;
}

const EMPTY: AddressRequest = {
  consigneeName: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  streetAddress: "",
  isDefault: false,
};

function normalizeInitial(initial?: AddressRequest | AddressResponse | null): AddressRequest {
  if (!initial) return EMPTY;
  return {
    consigneeName: initial.consigneeName ?? "",
    phone: initial.phone ?? "",
    province: initial.province ?? "",
    district: initial.district ?? "",
    ward: initial.ward ?? "",
    ghnProvinceId: initial.ghnProvinceId,
    ghnDistrictId: initial.ghnDistrictId,
    ghnWardCode: initial.ghnWardCode,
    streetAddress: initial.streetAddress ?? "",
    isDefault: !!initial.isDefault,
  };
}

const normName = (s: string | null | undefined) => {
  if (!s) return "";
  return s.toLowerCase()
    .replace(/^(tỉnh|thành phố|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, "")
    .trim();
};

export function AddressFormDialog({
  open,
  onOpenChange,
  initial,
  isPending,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressRequest>({ defaultValues: EMPTY });

  const [provinceId, setProvinceId] = useState<number | undefined>(undefined);
  const [wardCode, setWardCode] = useState<string | undefined>(undefined);
  const autoFill = useRef(false);

  const { data: provinces = [] } = useProvinces();
  const { data: wards = [], isLoading: wardsLoading } = useWardsByProvince(provinceId);

  useEffect(() => {
    if (!open || !initial) return;
    const data = normalizeInitial(initial);
    reset(data);
    autoFill.current = true;
    setProvinceId(undefined);
    setWardCode(data.ghnWardCode);
  }, [open, initial, reset]);

  const province = watch("province");
  const ward = watch("ward");
  const streetAddress = watch("streetAddress") || "";



  useEffect(() => {
    if (!autoFill.current || provinceId || !province) return;
    const p = provinces.find((x) => normName(x.name) === normName(province));
    if (p) queueMicrotask(() => setProvinceId(p.code));
  }, [provinces, province, provinceId]);

  useEffect(() => {
    if (!autoFill.current || wardCode || !ward || !provinceId || wards.length === 0) return;
    const w = wards.find((x) => normName(x.wardName) === normName(ward));
    if (w) {
      queueMicrotask(() => {
        setWardCode(w.ghnWardCode || w.wardCode);
        autoFill.current = false;
      });
    }
  }, [wards, ward, wardCode, provinceId]);

  const handleOpenChange = (value: boolean) => {
    if (!value) reset(EMPTY);
    onOpenChange(value);
  };

  const handleProvinceChange = (id: number | undefined) => {
    autoFill.current = false;
    setProvinceId(id);
    setWardCode(undefined);
    setValue("district", "-");
    setValue("ward", "");
  };

  const handleWardChange = (code: string | undefined) => {
    setWardCode(code);
    if (code) {
      const w = wards.find((x) => x.ghnWardCode === code || x.wardCode === code);
      setValue("district", w?.districtName ?? "-");
    } else {
      setValue("district", "-");
    }
  };

  const handleSubmitForm = handleSubmit((data) => {
    const selectedWard = wards.find(
      (w) => w.ghnWardCode === wardCode || w.wardCode === wardCode,
    );
    if (!selectedWard) return;
    const hasGhnMapping =
      !!selectedWard.ghnProvinceId &&
      !!selectedWard.ghnWardCode &&
      selectedWard.districtId > 0;
    onSubmit({
      ...data,
      ghnProvinceId: hasGhnMapping ? selectedWard.ghnProvinceId : undefined,
      ghnDistrictId: hasGhnMapping ? selectedWard.districtId : undefined,
      ghnWardCode: hasGhnMapping ? selectedWard.ghnWardCode : undefined,
      provinceName: data.province,
      districtName: data.district,
      wardName: data.ward,
    });
    reset(EMPTY);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg min-w-fit">
        <DialogHeader>
          <DialogTitle>{initial ? "Sửa địa chỉ" : "Thêm địa chỉ"}</DialogTitle>
        </DialogHeader>

        <form id="address-form" onSubmit={handleSubmitForm} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label htmlFor="consigneeName">
                Người nhận <span className="text-destructive">*</span>
              </Label>
              <Input
                id="consigneeName"
                {...register("consigneeName", { required: "Vui lòng nhập tên người nhận" })}
              />
              <FieldError message={errors.consigneeName?.message} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                {...register("phone", {
                  required: "Vui lòng nhập SĐT",
                  pattern: { value: /^(0|\+84)[0-9]{9}$/, message: "SĐT không hợp lệ" },
                })}
              />
              <FieldError message={errors.phone?.message} />
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3">
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
                    value={provinceId != null ? String(provinceId) : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) { handleProvinceChange(undefined); field.onChange(""); return; }
                      const id = Number(v);
                      handleProvinceChange(id);
                      const p = provinces.find((x) => x.code === id);
                      field.onChange(p?.name ?? "");
                    }}
                    className="w-full text-xs"
                  >
                    <NativeSelectOption value="">Chọn tỉnh/thành</NativeSelectOption>
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
                    disabled={provinceId == null || wardsLoading}
                    value={wardCode != null ? wardCode : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) { handleWardChange(undefined); field.onChange(""); return; }
                      handleWardChange(v);
                      const w = wards.find((x) => x.ghnWardCode === v || x.wardCode === v);
                      field.onChange(w?.wardName ?? "");
                    }}
                    className="w-full text-xs"
                  >
                    <NativeSelectOption value="">
                      {wardsLoading ? "Đang tải..." : "Chọn phường/xã"}
                    </NativeSelectOption>
                    {wards.map((w) => {
                      const val = w.ghnWardCode || w.wardCode;
                      return (
                        <NativeSelectOption
                          key={w.wardCode || val}
                          value={val}
                        >
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

          {}
          <div className="grid gap-1 relative">
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

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(watch("isDefault"))}
              onCheckedChange={(v) => setValue("isDefault", Boolean(v))}
            />
            Đặt làm địa chỉ mặc định
          </label>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="submit" form="address-form" disabled={isPending}>
            {isPending ? "Đang lưu..." : "Lưu địa chỉ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
