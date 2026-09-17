import { useEffect, useState } from "react";
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
import type { AddressRequest, AddressResponse } from "@/api/addressApi";
import { useProvinces, useWardsByProvince } from "@/hooks/useVnAddress";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

interface AddressModalProps {
  open: boolean;
  initial?: AddressResponse | null;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (payload: AddressRequest) => void;
  guestMode?: boolean;
}

const EMPTY: AddressRequest = {
  consigneeName: "",
  phone: "",
  province: "",
  district: "-",
  ward: "",
  streetAddress: "",
  isDefault: false,
};

export default function AddressModal({
  open,
  initial,
  isPending,
  onClose,
  onSubmit,
  guestMode = false,
}: AddressModalProps) {
  const [form, setForm] = useState<AddressRequest>(EMPTY);

  const [provinceCode, setProvinceCode] = useState<number | undefined>(undefined);
  const [wardCode, setWardCode] = useState<string | undefined>(undefined);

  const { data: provinces = [] } = useProvinces();
  const { data: wards = [], isLoading: wardsLoading } = useWardsByProvince(provinceCode, form.province);



  useEffect(() => {
    if (initial) {
      setForm({
        consigneeName: initial.consigneeName,
        phone: initial.phone,
        province: initial.province,
        district: initial.district || "-",
        ward: initial.ward,
        streetAddress: initial.streetAddress,
        isDefault: initial.isDefault,
      });
      setWardCode(initial.ghnWardCode);
    } else {
      setForm(EMPTY);
      setProvinceCode(undefined);
      setWardCode(undefined);
    }
  }, [initial, open]);

  const cleanName = (s: string) => {
    if (!s) return "";
    return s
      .toLowerCase()
      .replace(/^(tỉnh|thành phố|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, "")
      .trim();
  };

  useEffect(() => {
    if (form.province && provinces.length > 0) {
      const found = provinces.find(
        (p) => cleanName(p.name) === cleanName(form.province)
      );
      if (found && found.code !== provinceCode) {
        setProvinceCode(found.code);
      }
    }
  }, [form.province, provinces, provinceCode]);

  useEffect(() => {
    if (form.ward && wards.length > 0) {
      const found = wards.find(
        (w) => cleanName(w.wardName) === cleanName(form.ward)
      );
      if (found) {
        const val = found.ghnWardCode || found.wardCode;
        if (val !== wardCode) {
          setWardCode(val);
        }
      }
    }
  }, [form.ward, wards]);

  const handleProvinceChange = (v: string) => {
    if (!v) {
      setProvinceCode(undefined);
      setWardCode(undefined);
      setForm((f) => ({ ...f, province: "", district: "-", ward: "" }));
      return;
    }
    const id = Number(v);
    setProvinceCode(id);
    setWardCode(undefined);
    const p = provinces.find((x) => x.code === id);
    setForm((f) => ({
      ...f,
      province: p?.name ?? "",
      district: "-",
      ward: "",
    }));
  };

  const handleWardChange = (v: string) => {
    if (!v) {
      setWardCode(undefined);
      setForm((f) => ({ ...f, ward: "", district: "-" }));
      return;
    }
    setWardCode(v);
    const w = wards.find((x) => x.ghnWardCode === v || x.wardCode === v);
    setForm((f) => ({
      ...f,
      ward: w?.wardName ?? "",
      district: w?.districtName ?? "-",
    }));
  };

  const set = (key: keyof AddressRequest, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedWard = wards.find(
      (w) => w.ghnWardCode === wardCode || w.wardCode === wardCode,
    );
    if (!selectedWard) return;
    const hasGhnMapping =
      !!selectedWard.ghnProvinceId &&
      !!selectedWard.ghnWardCode &&
      selectedWard.districtId > 0;
    onSubmit({
      ...form,
      ghnProvinceId: hasGhnMapping ? selectedWard.ghnProvinceId : undefined,
      ghnDistrictId: hasGhnMapping ? selectedWard.districtId : undefined,
      ghnWardCode: hasGhnMapping ? selectedWard.ghnWardCode : undefined,
      provinceName: form.province,
      districtName: form.district,
      wardName: form.ward,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {guestMode
              ? "Thông tin nhận hàng"
              : initial
                ? "Cập nhật địa chỉ"
                : "Thêm địa chỉ mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Người nhận</Label>
              <Input
                value={form.consigneeName}
                onChange={(e) => set("consigneeName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Số điện thoại</Label>
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tỉnh/Thành phố <span className="text-destructive">*</span></Label>
              <NativeSelect
                value={provinceCode != null ? String(provinceCode) : ""}
                onChange={(e) => handleProvinceChange(e.target.value)}
                required
                className="w-full"
              >
                <NativeSelectOption value="">Chọn Tỉnh/Thành</NativeSelectOption>
                {provinces.map((p) => (
                  <NativeSelectOption key={p.code} value={String(p.code)}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>
                Phường/Xã <span className="text-destructive">*</span>
                {wardsLoading && <span className="ml-1 text-indigo-400">⟳</span>}
              </Label>
              <NativeSelect
                value={wardCode != null ? String(wardCode) : ""}
                onChange={(e) => handleWardChange(e.target.value)}
                disabled={provinceCode == null || wardsLoading}
                required
                className="w-full"
              >
                <NativeSelectOption value="">
                  {wardsLoading ? "Đang tải..." : "Chọn Phường/Xã"}
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
            </div>
          </div>
          <div className="space-y-1.5 relative">
            <Label>Địa chỉ cụ thể</Label>
            <div className="relative">
              <Input
                value={form.streetAddress}
                onChange={(e) => set("streetAddress", e.target.value)}
                placeholder="Số nhà, tên đường…"
                required
              />
            </div>
          </div>
          {!guestMode && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) => set("isDefault", e.target.checked)}
              />
              Đặt làm địa chỉ mặc định
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {guestMode ? "Sử dụng thông tin này" : initial ? "Cập nhật" : "Thêm địa chỉ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
