import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import dayjs from "dayjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import {
  usePromotionById,
  useCreatePromotion,
  useUpdatePromotion,
} from "@/hooks/usePromotion";
import { useCategoryList } from "@/hooks/useCategory";
import { productApi } from "@/api/productApi";
import type { ProductResponse } from "@/api/productApi";
import { productVariantApi } from "@/api/productVariantApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import { ProductSelectorModal } from "@/components/promotion/ProductSelectorModal";
import { VariantSelectorModal } from "@/components/promotion/VariantSelectorModal";
import type {
  PromotionPayload,
  PromotionResponse,
  ApplyType,
} from "@/api/promotionApi";
import { formatNumberWithCommas, parseNumberFromCommas } from "@/utils/format";

interface PromotionFormValues {
  name: string;
  description: string;
  applyType: ApplyType;
  discountValue: string;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  categoryIds: number[];
  productIds: number[];
  variantIds: number[];
  status: "ACTIVE" | "CANCELLED";
}

const STATUS_MAP: Record<
  "UPCOMING" | "ACTIVE" | "ENDED" | "CANCELLED",
  {
    label: string;
    variant: "success" | "destructive" | "secondary" | "outline";
  }
> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "outline" },
  ACTIVE: { label: "Hoạt động", variant: "success" },
  ENDED: { label: "Đã kết thúc", variant: "secondary" },
  CANCELLED: { label: "Đã huỷ", variant: "destructive" },
};

const DEFAULT_VALUES: PromotionFormValues = {
  name: "",
  description: "",
  applyType: "PRODUCT",
  discountValue: "",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  categoryIds: [],
  productIds: [],
  variantIds: [],
  status: "ACTIVE",
};

function toFormValues(p: PromotionResponse): PromotionFormValues {
  return {
    name: p.name,
    description: p.description ?? "",
    applyType: p.applyType,
    discountValue: p.discountValue?.toString() ?? "",
    maxDiscountAmount: p.maxDiscountAmount?.toString() ?? "",
    startDate: p.startDate ? p.startDate.slice(0, 10) : "",
    endDate: p.endDate ? p.endDate.slice(0, 10) : "",
    categoryIds: p.categoryIds ?? [],
    productIds: p.productIds ?? [],
    variantIds: p.variantIds ?? [],
    status: p.status === "CANCELLED" ? "CANCELLED" : "ACTIVE",
  };
}

function toPayload(values: PromotionFormValues): PromotionPayload {
  return {
    name: values.name?.trim() ?? "",
    description: values.description?.trim() || undefined,
    applyType: values.applyType,
    discountType: "PERCENTAGE",
    discountValue: parseFloat(values.discountValue),
    maxDiscountAmount: values.maxDiscountAmount
      ? parseFloat(values.maxDiscountAmount)
      : undefined,
    startDate: values.startDate ? `${values.startDate}T00:00:00` : "",
    endDate: values.endDate ? `${values.endDate}T23:59:59` : "",
    categoryIds: values.applyType === "CATEGORY" ? values.categoryIds : [],
    productIds: values.applyType === "PRODUCT" ? values.productIds : [],
    variantIds: values.applyType === "VARIANT" ? values.variantIds : [],
    status: values.status,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

export function PromotionCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const promotionId = id ? Number(id) : undefined;
  const isEdit = !!promotionId;

  const { data: existing } = usePromotionById(promotionId ?? 0);
  const { mutate: create, isPending: isCreating } = useCreatePromotion();
  const { mutate: update, isPending: isUpdating } = useUpdatePromotion();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PromotionFormValues>({ defaultValues: DEFAULT_VALUES });

  const applyType = watch("applyType");
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const selectedProductIds = watch("productIds") || [];
  const selectedVariantIds = watch("variantIds") || [];
  const selectedCategoryIds = watch("categoryIds") || [];

  const getPreviewStatus = () => {
    if (isEdit && existing?.status === "CANCELLED") {
      return "CANCELLED";
    }
    if (!startDate || !endDate) return null;

    const today = dayjs();
    const startDateTime = dayjs(`${startDate}T00:00:00`);
    const endDateTime = dayjs(`${endDate}T23:59:59`);

    if (today.isAfter(endDateTime)) return "ENDED";
    if (today.isBefore(startDateTime)) return "UPCOMING";
    return "ACTIVE";
  };

  const previewStatus = getPreviewStatus();

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductResponse[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<ProductVariantResponse[]>([]);

  const { data: categoryData } = useCategoryList({ status: "ACTIVE", size: 100 });
  const categories = categoryData?.content ?? [];

  useEffect(() => {
    if (isEdit && existing) {
      reset(toFormValues(existing));
    }
  }, [isEdit, existing, reset]);

  useEffect(() => {
    if (isEdit && existing?.productIds && existing.productIds.length > 0) {
      const missingIds = existing.productIds.filter(
        (id) => !selectedProducts.some((p) => p.productId === id)
      );
      if (missingIds.length > 0) {
        Promise.all(missingIds.map((id) => productApi.getById(id)))
          .then((fetched) => {
            setSelectedProducts((prev) => {
              const combined = [...prev, ...fetched];
              return combined.filter((val, index, self) =>
                self.findIndex((t) => t.productId === val.productId) === index
              );
            });
          })
          .catch((err) => console.error("Error fetching initial products", err));
      }
    }
  }, [isEdit, existing?.productIds]);

  useEffect(() => {
    if (isEdit && existing?.variantIds && existing.variantIds.length > 0) {
      const missingIds = existing.variantIds.filter(
        (id) => !selectedVariants.some((v) => v.variantId === id)
      );
      if (missingIds.length > 0) {
        Promise.all(missingIds.map((id) => productVariantApi.getById(id)))
          .then((fetched) => {
            setSelectedVariants((prev) => {
              const combined = [...prev, ...fetched];
              return combined.filter((val, index, self) =>
                self.findIndex((t) => t.variantId === val.variantId) === index
              );
            });
          })
          .catch((err) => console.error("Error fetching initial variants", err));
      }
    }
  }, [isEdit, existing?.variantIds]);

  const handleRemoveProduct = (productId: number) => {
    setValue(
      "productIds",
      selectedProductIds.filter((id) => id !== productId)
    );
    setSelectedProducts((prev) => prev.filter((p) => p.productId !== productId));
  };

  const handleSelectProducts = (ids: number[]) => {
    setValue("productIds", ids);
    const missingIds = ids.filter(
      (id) => !selectedProducts.some((p) => p.productId === id)
    );
    if (missingIds.length > 0) {
      Promise.all(missingIds.map((id) => productApi.getById(id)))
        .then((fetched) => {
          setSelectedProducts((prev) => {
            const combined = [...prev.filter((p) => ids.includes(p.productId)), ...fetched];
            return combined.filter((val, index, self) =>
              self.findIndex((t) => t.productId === val.productId) === index
            );
          });
        })
        .catch((err) => console.error("Error fetching selected products", err));
    } else {
      setSelectedProducts((prev) => prev.filter((p) => ids.includes(p.productId)));
    }
  };

  const handleRemoveVariant = (variantId: number) => {
    setValue(
      "variantIds",
      selectedVariantIds.filter((id) => id !== variantId)
    );
    setSelectedVariants((prev) => prev.filter((v) => v.variantId !== variantId));
  };

  const handleSelectVariants = (ids: number[]) => {
    setValue("variantIds", ids);
    const missingIds = ids.filter(
      (id) => !selectedVariants.some((v) => v.variantId === id)
    );
    if (missingIds.length > 0) {
      Promise.all(missingIds.map((id) => productVariantApi.getById(id)))
        .then((fetched) => {
          setSelectedVariants((prev) => {
            const combined = [...prev.filter((v) => ids.includes(v.variantId)), ...fetched];
            return combined.filter((val, index, self) =>
              self.findIndex((t) => t.variantId === val.variantId) === index
            );
          });
        })
        .catch((err) => console.error("Error fetching selected variants", err));
    } else {
      setSelectedVariants((prev) => prev.filter((v) => ids.includes(v.variantId)));
    }
  };

  const onValid = (values: PromotionFormValues) => {
    if (!values.startDate || !values.endDate) {
      toast.error("Vui lòng chọn ngày bắt đầu và kết thúc");
      return;
    }
    if (values.endDate < values.startDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return;
    }
    if (values.applyType === "PRODUCT" && values.productIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }
    if (values.applyType === "CATEGORY" && values.categoryIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một danh mục");
      return;
    }
    if (values.applyType === "VARIANT" && values.variantIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một biến thể");
      return;
    }

    const payload = toPayload(values);

    if (isEdit && promotionId) {
      update(
        { id: promotionId, payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật chương trình khuyến mãi");
            navigate("/promotions");
          },
          onError: (err: any) =>
            toast.error(err?.apiMessage ?? "Cập nhật thất bại"),
        },
      );
    } else {
      create(payload, {
        onSuccess: () => {
          toast.success("Đã thêm chương trình khuyến mãi");
          navigate("/promotions");
        },
        onError: (err: any) =>
          toast.error(err?.apiMessage ?? "Thêm mới thất bại"),
      });
    }
  };

  return (
    <div className="space-y-6">
      { }
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/promotions")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">
              {isEdit ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}
            </h1>
            {isEdit && existing && (
              <Badge variant={STATUS_MAP[existing.status].variant}>
                {STATUS_MAP[existing.status].label}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Thiết lập chương trình giảm giá cho sản phẩm hoặc danh mục cụ thể
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onValid)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            { }
            <div className="grid gap-1">
              <Label htmlFor="name">
                Tên chương trình <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Giảm giá mùa hè 2026"
                {...register("name", {
                  required: "Vui lòng nhập tên chương trình",
                  maxLength: { value: 200, message: "Tối đa 200 ký tự" },
                })}
              />
              <div className="h-4">
                <FieldError message={errors.name?.message} />
              </div>
            </div>

            { }
            <div className={`grid ${isEdit ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
              <div className="grid gap-1">
                <Label htmlFor="applyType">
                  Áp dụng cho <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={control}

                  name="applyType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="applyType" className="w-full">
                        <SelectValue placeholder="Chọn phạm vi" className="w-full" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        <SelectItem value="PRODUCT">Sản phẩm cụ thể</SelectItem>
                        <SelectItem value="CATEGORY">Danh mục sản phẩm</SelectItem>
                        <SelectItem value="VARIANT">Biến thể sản phẩm</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {isEdit && (
                <div className="grid gap-1">
                  <Label htmlFor="status">
                    Trạng thái hoạt động <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Hoạt động (Bật)</SelectItem>
                          <SelectItem value="CANCELLED">Tạm ngưng/Đã huỷ (Tắt)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            { }
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="discountValue">
                  Giá trị giảm (%) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  min={0.01}
                  step="any"
                  placeholder="VD: 20"
                  {...register("discountValue", {
                    required: "Vui lòng nhập giá trị giảm",
                    validate: (val) => {
                      const num = parseFloat(val);
                      if (isNaN(num) || num <= 0)
                        return "Giá trị phải lớn hơn 0";
                      if (num > 100)
                        return "Phần trăm không được vượt quá 100%";
                      return true;
                    },
                  })}
                />
                <div className="h-4">
                  <FieldError message={errors.discountValue?.message} />
                </div>
              </div>

              <div className="grid gap-1">
                <Label htmlFor="maxDiscountAmount">Giảm tối đa (VNĐ)</Label>
                <Controller
                  name="maxDiscountAmount"
                  control={control}
                  rules={{
                    validate: (val) => {
                      if (!val) return true;
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
                        placeholder="VD: 100.000 (để trống = không giới hạn)"
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
            </div>

            { }
            {applyType === "CATEGORY" && (
              <div className="grid gap-2 border rounded-lg p-4 bg-muted/10">
                <Label className="font-semibold text-sm">
                  Chọn danh mục áp dụng <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 max-h-60 overflow-y-auto pr-2">
                  {categories.map((category) => {
                    const isChecked = selectedCategoryIds.includes(category.categoryId);
                    return (
                      <label
                        key={category.categoryId}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer hover:bg-accent/40 transition-all ${isChecked ? "border-primary bg-primary/5 text-primary" : "border-border"
                          }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setValue("categoryIds", [...selectedCategoryIds, category.categoryId]);
                            } else {
                              setValue(
                                "categoryIds",
                                selectedCategoryIds.filter((id) => id !== category.categoryId)
                              );
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{category.categoryName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            { }
            {applyType === "PRODUCT" && (
              <div className="grid gap-2 border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="font-semibold text-sm">
                      Sản phẩm áp dụng <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Chương trình sẽ áp dụng cho tất cả các biến thể của các sản phẩm được chọn dưới đây.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProductModalOpen(true)}
                  >
                    Chọn sản phẩm ({selectedProductIds.length})
                  </Button>
                </div>

                <div className="mt-2 border rounded-md overflow-hidden bg-background">
                  {selectedProducts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Chưa chọn sản phẩm nào. Nhấp nút "Chọn sản phẩm" ở trên để chọn.
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/40">
                            <TableHead className="w-16">Ảnh</TableHead>
                            <TableHead className="w-32">Mã sản phẩm</TableHead>
                            <TableHead>Tên sản phẩm</TableHead>
                            <TableHead>Danh mục</TableHead>
                            <TableHead className="w-16 text-right">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProducts.map((p) => {
                            const thumbnail =
                              p.images?.find((img) => img.isThumbnail) ?? p.images?.[0];
                            return (
                              <TableRow key={p.productId} className="hover:bg-muted/10">
                                <TableCell>
                                  {thumbnail ? (
                                    <img
                                      src={thumbnail.imageUrl}
                                      alt={p.productName}
                                      className="w-10 h-10 object-cover rounded-md border"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold text-xs">
                                  {p.productCode}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {p.productName}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {p.category?.categoryName ?? "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveProduct(p.productId)}
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}

            { }
            {applyType === "VARIANT" && (
              <div className="grid gap-2 border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="font-semibold text-sm">
                      Biến thể sản phẩm áp dụng <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Chương trình sẽ áp dụng duy nhất cho các biến thể (size, màu sắc) được chọn dưới đây.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVariantModalOpen(true)}
                  >
                    Chọn biến thể ({selectedVariantIds.length})
                  </Button>
                </div>

                <div className="mt-2 border rounded-md overflow-hidden bg-background">
                  {selectedVariants.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      Chưa chọn biến thể nào. Nhấp nút "Chọn biến thể" ở trên để chọn.
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/40">
                            <TableHead className="w-16">Ảnh</TableHead>
                            <TableHead className="w-32">Mã biến thể</TableHead>
                            <TableHead>Tên sản phẩm</TableHead>
                            <TableHead className="w-24">Màu sắc</TableHead>
                            <TableHead className="w-24">Kích cỡ</TableHead>
                            <TableHead className="w-32 text-right">Giá gốc</TableHead>
                            <TableHead className="w-16 text-right">Hành động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedVariants.map((v) => {
                            const imageUrl = v.image?.imageUrl;
                            return (
                              <TableRow key={v.variantId} className="hover:bg-muted/10">
                                <TableCell>
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={v.variantCode}
                                      className="w-10 h-10 object-cover rounded-md border"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                                      No image
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-semibold text-xs">
                                  {v.variantCode}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {v.productName || "—"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {v.color || "—"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {v.size || "—"}
                                </TableCell>
                                <TableCell className="text-sm font-semibold text-right">
                                  {v.price.toLocaleString("vi-VN")}đ
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveVariant(v.variantId)}
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}

            { }
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label htmlFor="startDate">
                  Ngày bắt đầu <span className="text-destructive">*</span>
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
                  Ngày kết thúc <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  min={startDate}
                  {...register("endDate", {
                    required: "Vui lòng chọn ngày kết thúc",
                    validate: (val) =>
                      val >= startDate || "Phải sau ngày bắt đầu",
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
                <Badge variant={STATUS_MAP[previewStatus].variant} className="text-[10px] px-2 py-0.5 font-semibold">
                  {STATUS_MAP[previewStatus].label}
                </Badge>
              </div>
            )}

            { }
            <div className="grid gap-1">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn gọn về chương trình khuyến mãi"
                {...register("description", {
                  maxLength: { value: 500, message: "Tối đa 500 ký tự" },
                })}
              />
              <div className="h-4">
                <FieldError message={errors.description?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/promotions")}
          >
            Huỷ
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Đang lưu…" : isEdit ? "Cập nhật" : "Thêm khuyến mãi"}
          </Button>
        </DialogFooter>
      </form>

      <ProductSelectorModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        selectedIds={selectedProductIds}
        onSelect={handleSelectProducts}
      />

      <VariantSelectorModal
        open={variantModalOpen}
        onOpenChange={setVariantModalOpen}
        selectedIds={selectedVariantIds}
        onSelect={handleSelectVariants}
      />
    </div>
  );
}
