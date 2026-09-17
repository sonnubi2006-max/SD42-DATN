import type { ReactNode } from "react";
import { FieldError } from "@/components/form/FieldError";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";


interface AddressItem {
  code: number | string;
  name: string;
}

export interface AddressFormField {
  state: {
    value: string;
    meta: { errors: any[] };
  };
  handleChange: (value: string) => void;
}

type AddressFieldName = "province" | "district" | "ward" | "streetAddress";

export interface AddressFormFieldComponent {
  (props: {
    name: AddressFieldName;
    children: (field: AddressFormField) => ReactNode;
  }): ReactNode | Promise<ReactNode>;
}

interface AddressSelectsProps {
  Field: any;
  provinceCode: number | undefined;
  wardCode: string | number | undefined;
  provinces: AddressItem[];
  wards: AddressItem[];
  onProvinceChange: (code: number | undefined) => void;
  onWardChange: (code: string | number | undefined) => void;
}

interface DetailedAddressInputProps {
  field: AddressFormField;
  provinceCode: number | undefined;
  wardCode: string | number | undefined;
  provinces: AddressItem[];
  wards: AddressItem[];
}

function DetailedAddressInput({
  field,
  provinceCode,
  wardCode,
  provinces,
  wards,
}: DetailedAddressInputProps) {
  const activeProvinceName = provinces.find((p) => Number(p.code) === provinceCode)?.name;
  const activeWardName = wards.find((w) => String(w.code) === String(wardCode))?.name;



  return (
    <div className="space-y-1.5 relative">
      <Label htmlFor="streetAddress" className="text-xs font-semibold text-gray-750">
        Địa chỉ chi tiết <span className="text-destructive">*</span>
      </Label>
      <Input
        id="streetAddress"
        placeholder="Số nhà, tên đường..."
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        className="text-xs h-9.5"
      />
      <FieldError errors={field.state.meta.errors} />
    </div>
  );
}

export default function AddressSelects({
  Field,
  provinceCode,
  wardCode,
  provinces,
  wards,
  onProvinceChange,
  onWardChange,
}: AddressSelectsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field name="province">
          {(field: AddressFormField) => (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-750">
                Tỉnh/TP <span className="text-destructive">*</span>
              </Label>
              <NativeSelect
                value={provinceCode != null ? String(provinceCode) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    onProvinceChange(undefined);
                    field.handleChange("");
                    return;
                  }
                  const code = Number(v);
                  onProvinceChange(code);
                  const p = provinces.find((x) => x.code === code);
                  field.handleChange(p?.name ?? "");
                }}
                className="w-full text-xs"
              >
                <NativeSelectOption value="">Chọn tỉnh/TP</NativeSelectOption>
                {provinces.map((p) => (
                  <NativeSelectOption key={p.code} value={String(p.code)}>
                    {p.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </Field>

        <Field name="ward">
          {(field: AddressFormField) => (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-750">
                Phường/Xã <span className="text-destructive">*</span>
              </Label>
              <NativeSelect
                disabled={provinceCode == null}
                value={wardCode != null ? String(wardCode) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onWardChange(v || undefined);
                  const w = wards.find((x) => String(x.code) === v);
                  field.handleChange(w?.name ?? "");
                }}
                className="w-full text-xs"
              >
                <NativeSelectOption value="">Chọn phường/xã</NativeSelectOption>
                {wards.map((w) => (
                  <NativeSelectOption key={w.code} value={String(w.code)}>
                    {w.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </Field>
      </div>

      <Field name="streetAddress">
        {(field: AddressFormField) => (
          <DetailedAddressInput
            field={field}
            provinceCode={provinceCode}
            wardCode={wardCode}
            provinces={provinces}
            wards={wards}
          />
        )}
      </Field>
    </div>
  );
}
