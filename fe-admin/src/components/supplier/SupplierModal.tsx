import { useState } from "react";
import type { Supplier, SupplierStatus } from "@/api/supplierApi";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface SupplierForm {
  supplierName: string;
  address: string;
  phone: string;
  email: string;
  status?: SupplierStatus;
}

type FormErrors = Partial<Record<keyof SupplierForm, string>>;

export type ModalMode = "create" | "edit" | null;

interface SupplierModalProps {
  mode: ModalMode;
  initial?: Supplier;
  onClose: () => void;
  onSubmit: (form: SupplierForm) => void;
  isPending: boolean;
}

const createInitialForm = (supplier?: Supplier): SupplierForm => ({
  supplierName: supplier?.supplierName ?? "",
  address: supplier?.address ?? "",
  phone: supplier?.phone ?? "",
  email: supplier?.email ?? "",
  status: supplier?.status ?? "true",
});

function validate(form: SupplierForm): FormErrors {
  const errors: FormErrors = {};

  if (!form.supplierName.trim()) {
    errors.supplierName = "Tên nhà cung cấp không được để trống";
  } else if (form.supplierName.trim().length < 2) {
    errors.supplierName = "Tên nhà cung cấp phải từ 2 ký tự trở lên";
  } else if (form.supplierName.length > 255) {
    errors.supplierName = "Tên nhà cung cấp không được vượt quá 255 ký tự";
  }

  if (!form.address.trim()) {
    errors.address = "Địa chỉ không được để trống";
  } else if (form.address.length > 500) {
    errors.address = "Địa chỉ không được vượt quá 500 ký tự";
  }

  if (!form.phone.trim()) {
    errors.phone = "Số điện thoại không được để trống";
  } else if (!/^(0|\+84)[0-9]{9,10}$/.test(form.phone)) {
    errors.phone = "Số điện thoại không đúng định dạng (VD: 0901234567)";
  }

  if (!form.email.trim()) {
    errors.email = "Email không được để trống";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Email không đúng định dạng";
  } else if (form.email.length > 255) {
    errors.email = "Email không được vượt quá 255 ký tự";
  }

  return errors;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>

      {children}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function SupplierModal({
  mode,
  initial,
  onClose,
  onSubmit,
  isPending,
}: SupplierModalProps) {
  const [form, setForm] = useState<SupplierForm>(() =>
    createInitialForm(initial),
  );

  const [errors, setErrors] = useState<FormErrors>({});

  if (!mode) return null;

  const updateField = <K extends keyof SupplierForm>(
    key: K,
    value: SupplierForm[K],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors = validate(form);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(form);
  };

  return (
    <Dialog open={!!mode} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl min-w-lg p-8">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {mode === "create"
              ? "Thêm nhà cung cấp mới"
              : "Chỉnh sửa nhà cung cấp"}
          </DialogTitle>
        </DialogHeader>

        <form id="supplier-form" onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <Field
              label="Tên nhà cung cấp"
              required
              error={errors.supplierName}
            >
              <Input
                value={form.supplierName}
                onChange={(e) => updateField("supplierName", e.target.value)}
                placeholder="VD: Công ty TNHH ABC"
              />
            </Field>

            <Field label="Địa chỉ" required error={errors.address}>
              <Input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="VD: Số 123, Đường Lê Lợi"
              />
            </Field>

            <Field label="Số điện thoại" required error={errors.phone}>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="0901234567"
              />
            </Field>

            <Field label="Email" required error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="contact@company.com"
              />
            </Field>

            {mode === "edit" && (
              <Field label="Trạng thái">
                <Select
                  value={String(form.status)}
                  onValueChange={(value) =>
                    updateField("status", value as SupplierStatus)
                  }
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>

                    <SelectItem value="false">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={onClose}
            disabled={isPending}
            size={"lg"}
          >
            Huỷ
          </Button>

          <Button
            type="submit"
            form="supplier-form"
            size={"lg"}
            disabled={isPending}
          >
            {isPending
              ? "Đang lưu..."
              : mode === "create"
                ? "Thêm mới"
                : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
