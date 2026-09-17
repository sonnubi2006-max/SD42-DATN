import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { VnProvince, GhnWardFull } from "@/api/vnAddressApi";
import { Loader2 } from "lucide-react";

export interface ManualAddressFormProps {
  receiverName: string;
  setReceiverName: (v: string) => void;
  receiverPhone: string;
  setReceiverPhone: (v: string) => void;

  provinceId: number | undefined;
  setProvinceId: (v: number | undefined) => void;
  setProvinceName: (v: string) => void;

  wardCode: string | undefined;
  setWardCode: (v: string | undefined) => void;
  setWardName: (v: string) => void;
  setDistrictId: (v: number | undefined) => void;
  setDistrictName: (v: string) => void;

  detailAddress: string;
  setDetailAddress: (v: string) => void;

  provinces: VnProvince[] | undefined;

  wards: GhnWardFull[] | undefined;
  wardsLoading?: boolean;
}

export default function ManualAddressForm({
  receiverName,
  setReceiverName,
  receiverPhone,
  setReceiverPhone,
  provinceId,
  setProvinceId,
  setProvinceName,
  wardCode,
  setWardCode,
  setWardName,
  setDistrictId,
  setDistrictName,
  detailAddress,
  setDetailAddress,
  provinces,
  wards,
  wardsLoading,
}: ManualAddressFormProps) {
  const activeProvinceName = provinces?.find((p) => p.code === provinceId)?.name;
  const activeWardName = wards?.find((w) => w.ghnWardCode === wardCode || w.wardCode === wardCode)?.wardName;



  return (
    <div className="space-y-3">
      { }
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
            Tên người nhận
          </Label>
          <Input
            placeholder="Tên người nhận"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            className="h-8.5 text-xs bg-background border-input focus-visible:ring-primary/20"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
            Số điện thoại
          </Label>
          <Input
            placeholder="Số điện thoại"
            value={receiverPhone}
            onChange={(e) => setReceiverPhone(e.target.value)}
            className="h-8.5 text-xs bg-background border-input focus-visible:ring-primary/20 "
          />
        </div>
      </div>

      { }
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
            Tỉnh / Thành phố
          </Label>
          <NativeSelect
            value={provinceId?.toString() ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setProvinceId(undefined);
                setProvinceName("");
                setWardCode(undefined);
                setWardName("");
                setDistrictId(undefined);
                setDistrictName("");
                return;
              }
              const id = Number(v);
              setProvinceId(id);
              const p = provinces?.find((x) => x.code === id);
              setProvinceName(p?.name ?? "");

              setWardCode(undefined);
              setWardName("");
              setDistrictId(undefined);
              setDistrictName("");
            }}
            className="w-full h-8.5 text-xs bg-background border-input cursor-pointer"
          >
            <NativeSelectOption value="">Chọn tỉnh/thành</NativeSelectOption>
            {provinces?.map((p) => (
              <NativeSelectOption key={p.code} value={p.code.toString()}>
                {p.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
            <span>Phường / Xã</span>
            {wardsLoading && (
              <Loader2 size={10} className="animate-spin text-primary" />
            )}
          </Label>
          <NativeSelect
            value={wardCode ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setWardCode(undefined);
                setWardName("");
                setDistrictId(undefined);
                setDistrictName("");
                return;
              }
              setWardCode(v);
              const w = wards?.find((x) => x.ghnWardCode === v || x.wardCode === v);
              setWardName(w?.wardName ?? "");
              setDistrictId(w?.districtId ?? undefined);
              setDistrictName(w?.districtName ?? "");
            }}
            disabled={!provinceId || wardsLoading}
            className="w-full h-8.5 text-xs bg-background border-input cursor-pointer"
          >
            <NativeSelectOption value="">
              {wardsLoading ? "Đang tải phường/xã..." : "Chọn phường/xã"}
            </NativeSelectOption>
            {wards?.map((w) => {
              const val = w.ghnWardCode || w.wardCode;
              return (
                <NativeSelectOption key={w.wardCode || val} value={val}>
                  {w.wardName}
                </NativeSelectOption>
              );
            })}
          </NativeSelect>
        </div>
      </div>

      { }
      <div className="space-y-1 relative">
        <Label className="text-[10px] font-semibold text-muted-foreground uppercase">
          Địa chỉ chi tiết (Số nhà, đường)
        </Label>
        <Input
          placeholder="Ví dụ: Số 123 đường Nguyễn Trãi..."
          value={detailAddress}
          onChange={(e) => setDetailAddress(e.target.value)}
          className="h-8.5 text-xs bg-background border-input"
        />
      </div>
    </div>
  );
}
