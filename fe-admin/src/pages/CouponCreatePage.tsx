import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Trash, Search } from "lucide-react";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustomerList } from "@/hooks/useCustomer";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumberWithCommas, parseNumberFromCommas } from "@/utils/format";

import {
  useCouponById,
  useCreateCoupon,
  useUpdateCoupon,
} from "@/hooks/useCoupon";
import type {
  CouponPayload,
  CouponResponse,
  CouponStatus,
  CouponType,
  DiscountType,
  TargetedCustomer,
} from "@/api/couponApi";

interface CouponFormValues {
  code: string;
  description: string;
  couponType: CouponType;
  discountType: DiscountType;
  discountValue: string;
  maxDiscountAmount: string;
  minOrderValue: string;
  totalQuantity: string;
  maxUsesPerUser: string;
  startDate: string;
  endDate: string;
  status: Extract<CouponStatus, "ACTIVE" | "INACTIVE">;
}

const STATUS_MAP: Record<
  CouponStatus,
  {
    label: string;
    variant: "success" | "destructive" | "secondary" | "outline";
  }
> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "outline" },
  ACTIVE: { label: "Hoạt động", variant: "success" },
  EXPIRED: { label: "Hết hạn", variant: "secondary" },
  INACTIVE: { label: "Vô hiệu hoá", variant: "destructive" },
};

const DEFAULT_VALUES: CouponFormValues = {
  code: "",
  description: "",
  couponType: "PUBLIC",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderValue: "",
  totalQuantity: "",
  maxUsesPerUser: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

function toFormValues(c: CouponResponse): CouponFormValues {
  return {
    code: c.code,
    description: c.description ?? "",
    couponType: c.couponType ?? "PUBLIC",
    discountType: c.discountType,
    discountValue: c.discountValue?.toString() ?? "",
    maxDiscountAmount: c.maxDiscountAmount?.toString() ?? "",
    minOrderValue: c.minOrderValue?.toString() ?? "",
    totalQuantity: c.totalQuantity?.toString() ?? "",
    maxUsesPerUser: c.maxUsesPerUser?.toString() ?? "",
    startDate: c.startDate ? c.startDate.slice(0, 10) : "",
    endDate: c.endDate ? c.endDate.slice(0, 10) : "",

    status: c.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}

function toPayload(
  values: CouponFormValues,
  targeted: TargetedCustomer[],
): CouponPayload {
  const isPersonal = values.couponType === "PERSONAL";
  return {
    code: values.code?.trim().toUpperCase() ?? "",
    description: values.description?.trim() ?? "",
    couponType: values.couponType,
    discountType: values.discountType,
    discountValue: parseFloat(values.discountValue),
    maxDiscountAmount:
      values.discountType === "PERCENTAGE" && values.maxDiscountAmount
        ? parseFloat(values.maxDiscountAmount)
        : undefined,
    minOrderValue: values.minOrderValue
      ? parseFloat(values.minOrderValue)
      : undefined,
    totalQuantity: values.totalQuantity
      ? parseInt(values.totalQuantity)
      : undefined,
    maxUsesPerUser: values.maxUsesPerUser
      ? parseInt(values.maxUsesPerUser)
      : undefined,
    startDate: values.startDate ? `${values.startDate}T00:00:00` : undefined,
    endDate: values.endDate ? `${values.endDate}T23:59:59` : undefined,
    status: values.status,
    targetedCustomerIds: isPersonal
      ? targeted.map((c) => c.customerId)
      : undefined,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function CouponCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const couponId = id ? Number(id) : undefined;
  const isEdit = !!couponId;

  const [targeted, setTargeted] = useState<TargetedCustomer[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const debouncedCustomerSearch = useDebounce(customerSearch, 500);
  const [customerPage, setCustomerPage] = useState(0);

  const { data: customerData, isLoading: isLoadingCustomers } = useCustomerList(
    {
      keyword: debouncedCustomerSearch || undefined,
      status: "ACTIVE",
      page: customerPage,
      size: 5,
    },
  );

  useEffect(() => {
    setCustomerPage(0);
  }, [debouncedCustomerSearch]);

  const { data: existing } = useCouponById(couponId ?? 0);
  const { mutate: create, isPending: isCreating } = useCreateCoupon();
  const { mutate: update, isPending: isUpdating } = useUpdateCoupon();
  const isPending = isCreating || isUpdating;
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormValues>({ defaultValues: DEFAULT_VALUES });

  const discountType = watch("discountType");
  const couponType = watch("couponType");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const totalQuantity = watch("totalQuantity");
  const statusVal = watch("status");

  const getPreviewStatus = () => {
    if (statusVal === "INACTIVE") return "INACTIVE";
    if (!startDate || !endDate) return null;

    const today = dayjs();
    const startDateTime = dayjs(`${startDate}T00:00:00`);
    const endDateTime = dayjs(`${endDate}T23:59:59`);

    if (today.isAfter(endDateTime)) return "EXPIRED";
    if (totalQuantity && parseInt(totalQuantity) <= 0) return "EXPIRED";
    if (today.isBefore(startDateTime)) return "UPCOMING";
    return "ACTIVE";
  };

  const previewStatus = getPreviewStatus();

  useEffect(() => {
    if (isEdit && existing) {
      reset(toFormValues(existing));
      setTargeted(existing.targetedCustomers ?? []);
    }
  }, [isEdit, existing, reset]);

  const onValid = (values: CouponFormValues) => {
    if (values.couponType === "PERSONAL" && targeted.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 khách hàng cho phiếu cá nhân");
      return;
    }
    const payload = toPayload(values, targeted);

    if (isEdit && couponId) {
      update(
        { id: couponId, payload },
        {
          onSuccess: () => {
            toast.success("Cập nhật phiếu giảm giá thành công");
            navigate("/coupons");
          },
          onError: (err: any) =>
            toast.error(err?.apiMessage ?? "Cập nhật thất bại"),
        },
      );
    } else {
      create(payload, {
        onSuccess: () => {
          toast.success("Tạo phiếu giảm giá thành công");
          navigate("/coupons");
        },
        onError: (err: any) => toast.error(err?.apiMessage ?? "Tạo thất bại"),
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 pb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => navigate("/coupons")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Label className="text-lg font-semibold">
            {isEdit ? "Chỉnh sửa phiếu giảm giá" : "Thêm phiếu giảm giá mới"}
          </Label>
          {isEdit && existing && (
            <Badge variant={STATUS_MAP[existing.status].variant}>
              {STATUS_MAP[existing.status].label}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="space-y-3" onSubmit={handleSubmit(onValid)}>
            { }
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>
                  Loại phiếu <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="couponType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v) field.onChange(v);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">
                          Công khai (mọi khách)
                        </SelectItem>
                        <SelectItem value="PERSONAL">
                          Cá nhân (khách chỉ định)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="h-4" />
              </div>

              { }
              <div className="grid gap-1">
                <Label>Trạng thái</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v === "ACTIVE" || v === "INACTIVE") {
                          field.onChange(v);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          Kích hoạt theo thời gian
                        </SelectItem>
                        <SelectItem value="INACTIVE">Tạm tắt</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="h-4 text-[11px] text-muted-foreground">
                  Trạng thái thực tế được tính theo ngày áp dụng và số lượng.
                </div>
              </div>
            </div>

            { }
            <div className="grid gap-1">
              <Label htmlFor="code">
                Mã giảm giá {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="code"
                placeholder="VD: SALE2024"
                readOnly={isEdit}
                className={isEdit ? "bg-muted cursor-not-allowed select-none" : ""}
                {...register("code", {
                  required: "Vui lòng nhập mã giảm giá",
                  setValueAs: (value) => value.trim(),
                  minLength: { value: 4, message: "Tối thiểu 4 ký tự" },
                  maxLength: { value: 50, message: "Tối đa 50 ký tự" },
                  pattern: {
                    value: /^[A-Za-z0-9_]+$/,
                    message: "Chỉ được dùng chữ, số và _",
                  },
                })}
              />
              <div className="h-4">
                <FieldError message={errors.code?.message} />
              </div>
            </div>

            { }
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="startDate">
                  Ngày bắt đầu<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register("startDate", {
                    required: "Vui lòng chọn ngày bắt đầu",
                  })}
                />
                <div className="h-4">
                  <FieldError message={errors.startDate?.message} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="endDate">
                  Ngày kết thúc<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register("endDate", {
                    required: "Vui lòng chọn ngày kết thúc",
                    validate: (val) => {
                      if (startDate && val <= startDate) {
                        return "Ngày kết thúc phải sau ngày bắt đầu";
                      }
                      return true;
                    },
                  })}
                />
                <div className="h-4">
                  <FieldError message={errors.endDate?.message} />
                </div>
              </div>
            </div>

            {previewStatus && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/50 border border-gray-150 rounded-lg text-xs mt-1 animate-in fade-in duration-200">
                <span className="text-muted-foreground font-medium">Trạng thái dự kiến:</span>
                <Badge variant={STATUS_MAP[previewStatus as CouponStatus].variant} className="text-[10px] px-2 py-0.5 font-semibold">
                  {STATUS_MAP[previewStatus as CouponStatus].label}
                </Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              { }
              <div className="grid gap-1">
                <Label>Loại giảm giá</Label>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v) {
                          field.onChange(v);

                          setValue("discountValue", "");
                          setValue("maxDiscountAmount", "");
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">
                          Phần trăm (%)
                        </SelectItem>
                        <SelectItem value="FIXED_AMOUNT">
                          Số tiền cố định
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="h-4" />
              </div>

              { }
              <div className="grid gap-1">
                <Label htmlFor="discountValue">
                  Giá trị giảm <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="discountValue"
                  control={control}
                  rules={{
                    required: "Vui lòng nhập giá trị giảm",
                    validate: (val) => {
                      const num = parseFloat(val);
                      if (isNaN(num) || num <= 0)
                        return "Giá trị phải lớn hơn 0";
                      if (discountType === "PERCENTAGE" && num > 100)
                        return "Phần trăm không được vượt quá 100%";
                      if (discountType === "FIXED_AMOUNT" && num < 1000)
                        return "Số tiền tối thiểu 1.000 VNĐ";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        id="discountValue"
                        type="text"
                        inputMode="numeric"
                        placeholder={
                          discountType === "PERCENTAGE"
                            ? "VD: 10 (%)"
                            : "VD: 50.000 (VNĐ)"
                        }
                        value={
                          discountType === "FIXED_AMOUNT"
                            ? formatNumberWithCommas(field.value)
                            : field.value
                        }
                        onChange={(e) => {
                          if (discountType === "FIXED_AMOUNT") {
                            const raw = parseNumberFromCommas(e.target.value);
                            field.onChange(raw);
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
                        className="pr-8 "
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                        {discountType === "FIXED_AMOUNT" ? "đ" : "%"}
                      </span>
                    </div>
                  )}
                />
                <div className="h-4">
                  <FieldError message={errors.discountValue?.message} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              { }
              <div
                className="grid gap-1"
                hidden={discountType !== "PERCENTAGE"}
              >
                <Label htmlFor="maxDiscountAmount">Giảm tối đa (VNĐ)</Label>
                <Controller
                  name="maxDiscountAmount"
                  control={control}
                  rules={{
                    validate: (val) => {
                      if (!val) {
                        return discountType === "PERCENTAGE"
                          ? "Vui lòng nhập mức giảm tối đa"
                          : true;
                      }
                      const num = parseFloat(val);
                      if (isNaN(num) || num < 1000)
                        return "Tối thiểu 1.000 VNĐ";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        id="maxDiscountAmount"
                        type="text"
                        inputMode="numeric"
                        placeholder="VD: 100.000"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const raw = parseNumberFromCommas(e.target.value);
                          field.onChange(raw);
                        }}
                        className="pr-8 "
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                        đ
                      </span>
                    </div>
                  )}
                />
                <div className="h-4">
                  <FieldError message={errors.maxDiscountAmount?.message} />
                </div>
              </div>

              { }
              <div className="grid gap-1">
                <Label htmlFor="minOrderValue">
                  Giá trị đơn tối thiểu (VNĐ)
                </Label>
                <Controller
                  name="minOrderValue"
                  control={control}
                  rules={{
                    validate: (val) => {
                      if (!val) return true;
                      const num = parseFloat(val);
                      if (isNaN(num) || num < 0) return "Không được âm";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        id="minOrderValue"
                        type="text"
                        inputMode="numeric"
                        placeholder="VD: 200.000"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const raw = parseNumberFromCommas(e.target.value);
                          field.onChange(raw);
                        }}
                        className="pr-8 "
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">
                        đ
                      </span>
                    </div>
                  )}
                />
                <div className="h-4">
                  <FieldError message={errors.minOrderValue?.message} />
                </div>
              </div>
            </div>

            { }
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="totalQuantity">Tổng số lượng</Label>
                <Controller
                  name="totalQuantity"
                  control={control}
                  rules={{
                    validate: (val) => {
                      if (!val) return true;
                      const num = parseInt(val);
                      if (isNaN(num) || num <= 0) return "Tối thiểu 1";
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        id="totalQuantity"
                        type="text"
                        inputMode="numeric"
                        placeholder="Không giới hạn"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const raw = parseNumberFromCommas(e.target.value);
                          field.onChange(raw);
                        }}
                        className="pr-14 "
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground">
                        phiếu
                      </span>
                    </div>
                  )}
                />
                <div className="h-4">
                  <FieldError message={errors.totalQuantity?.message} />
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="maxUsesPerUser">Mỗi khách tối đa</Label>
                <Controller
                  name="maxUsesPerUser"
                  control={control}
                  rules={{
                    validate: (val) => {
                      if (!val) return true;
                      const num = parseInt(val);
                      if (isNaN(num) || num <= 0) return "Tối thiểu 1";
                      if (
                        totalQuantity &&
                        num > parseInt(totalQuantity)
                      ) {
                        return "Không được vượt tổng số lượng";
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        id="maxUsesPerUser"
                        type="text"
                        inputMode="numeric"
                        placeholder="Không giới hạn"
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const raw = parseNumberFromCommas(e.target.value);
                          field.onChange(raw);
                        }}
                        className="pr-10 "
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-semibold text-muted-foreground">
                        lần
                      </span>
                    </div>
                  )}
                />
                <div className="h-4">
                  <FieldError message={errors.maxUsesPerUser?.message} />
                </div>
              </div>
            </div>

            { }
            <div className="grid gap-1">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn gọn"
                {...register("description", {
                  maxLength: { value: 200, message: "Tối đa 200 ký tự" },
                })}
              />
              <div className="h-4">
                <FieldError message={errors.description?.message} />
              </div>
            </div>
            { }
            {couponType === "PERSONAL" && (
              <div className="grid gap-2 border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid gap-1">
                    <Label className="text-sm font-semibold">
                      Khách hàng áp dụng{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Đã chọn {targeted.length} khách hàng
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Chọn khách hàng từ danh sách
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                          Chọn khách hàng áp dụng
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-3 py-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            Tích chọn các khách hàng để áp dụng phiếu giảm giá
                            này.
                          </p>
                          <div className="relative w-full max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Tìm khách hàng..."
                              value={customerSearch}
                              onChange={(e) =>
                                setCustomerSearch(e.target.value)
                              }
                              className="h-8 pl-8 text-xs bg-white"
                            />
                          </div>
                        </div>

                        <div className="border border-border rounded-lg bg-white overflow-hidden mt-1">
                          <Table className="text-xs">
                            <TableHeader>
                              <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="w-10 text-center">
                                  <Checkbox
                                    checked={
                                      customerData?.content.length
                                        ? customerData.content.every((c) =>
                                          targeted.some(
                                            (t) =>
                                              t.customerId === c.customerId,
                                          ),
                                        )
                                        : false
                                    }
                                    onCheckedChange={(checked) => {
                                      if (customerData?.content) {
                                        if (checked) {

                                          setTargeted((prev) => {
                                            const next = [...prev];
                                            customerData.content.forEach(
                                              (c) => {
                                                if (
                                                  !next.some(
                                                    (t) =>
                                                      t.customerId ===
                                                      c.customerId,
                                                  )
                                                ) {
                                                  next.push({
                                                    customerId: c.customerId,
                                                    fullName: c.fullName,
                                                    email: c.email,
                                                  });
                                                }
                                              },
                                            );
                                            return next;
                                          });
                                        } else {

                                          const pageIds =
                                            customerData.content.map(
                                              (c) => c.customerId,
                                            );
                                          setTargeted((prev) =>
                                            prev.filter(
                                              (t) =>
                                                !pageIds.includes(t.customerId),
                                            ),
                                          );
                                        }
                                      }
                                    }}
                                  />
                                </TableHead>
                                <TableHead className="w-12 text-center">
                                  STT
                                </TableHead>
                                <TableHead className="w-20 text-center ">
                                  Mã ID
                                </TableHead>
                                <TableHead>Họ tên</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Số điện thoại</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isLoadingCustomers ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={6}
                                    className="text-center py-6 text-muted-foreground"
                                  >
                                    Đang tải khách hàng...
                                  </TableCell>
                                </TableRow>
                              ) : !customerData?.content.length ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={6}
                                    className="text-center py-6 text-muted-foreground"
                                  >
                                    Không tìm thấy khách hàng nào.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                customerData.content.map((c, i) => {
                                  const isSelected = targeted.some(
                                    (t) => t.customerId === c.customerId,
                                  );
                                  return (
                                    <TableRow
                                      key={c.customerId}
                                      className="hover:bg-muted/30"
                                    >
                                      <TableCell className="text-center">
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setTargeted((prev) => [
                                                ...prev,
                                                {
                                                  customerId: c.customerId,
                                                  fullName: c.fullName,
                                                  email: c.email,
                                                },
                                              ]);
                                            } else {
                                              setTargeted((prev) =>
                                                prev.filter(
                                                  (t) =>
                                                    t.customerId !==
                                                    c.customerId,
                                                ),
                                              );
                                            }
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell className="text-center text-muted-foreground">
                                        {customerPage * 5 + i + 1}
                                      </TableCell>
                                      <TableCell className="text-center  text-muted-foreground">
                                        #{c.customerId}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        {c.fullName || "—"}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {c.email || "—"}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {c.phone || "—"}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        {customerData && customerData.totalPages > 1 && (
                          <div className="flex items-center justify-end gap-1.5 mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px]"
                              disabled={customerPage === 0}
                              onClick={() => setCustomerPage((p) => p - 1)}
                            >
                              Trước
                            </Button>
                            <span className="text-[10px] text-muted-foreground px-2">
                              Trang {customerPage + 1} /{" "}
                              {customerData.totalPages}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px]"
                              disabled={
                                customerPage + 1 >= customerData.totalPages
                              }
                              onClick={() => setCustomerPage((p) => p + 1)}
                            >
                              Sau
                            </Button>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="pt-2">
                        <DialogClose asChild>
                          <Button type="button" size="sm">
                            Đồng ý ({targeted.length} đã chọn)
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/coupons")}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? "Đang lưu…"
                  : isEdit
                    ? "Cập nhật"
                    : "Thêm phiếu giảm giá"}
              </Button>
            </DialogFooter>
          </form>
        </CardContent>
      </Card>

      {couponType === "PERSONAL" && (
        <Card className="mt-6">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Danh sách khách hàng áp dụng</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Đã chọn {targeted.length} khách hàng
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-14 text-center">STT</TableHead>
                  <TableHead className="w-24 text-center ">
                    Mã ID
                  </TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-20 text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targeted.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground text-sm"
                    >
                      Chưa chọn khách hàng nào cho phiếu giảm giá cá nhân.
                    </TableCell>
                  </TableRow>
                ) : (
                  targeted.map((c, index) => (
                    <TableRow key={c.customerId}>
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center text-xs  text-muted-foreground">
                        #{c.customerId}
                      </TableCell>
                      <TableCell className="font-medium">
                        {c.fullName || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.email || "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setTargeted((prev) =>
                              prev.filter(
                                (item) => item.customerId !== c.customerId,
                              ),
                            );
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
