import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import ProductVariantForm, {
  type ProductVariantFormState,
} from "./ProductVariantForm";
import ProductImageUpload from "./ProductImageUpload";
import ConfirmModal from "../ConfirmModal";
import type { ProductResponse, ProductStatus } from "@/api/productApi";
import type { ProductImageResponse } from "@/api/productVariantApi";
import { useBrandList } from "@/hooks/useBrand";
import { useCategoryList } from "@/hooks/useCategory";
import CreateCategoryModal from "../category/CreateCategoryModal";
import CreateBrandModal from "../brand/CreateBrandModal";

export interface ProductFormData {
  productName: string;
  description: string;
  categoryId: number;
  brandId: number;
  status: ProductStatus;
  files: File[];
  imagesDelete: number[];
  variants: ProductVariantFormState[];
}

interface ProductFormProps {
  initial?: ProductResponse;
  onSubmit: (data: ProductFormData) => void;
  isPending: boolean;

  createdProduct?: ProductResponse;

  onFinish?: () => void;
}

export default function ProductForm({
  initial,
  onSubmit,
  isPending,
  createdProduct,
  onFinish,
}: ProductFormProps) {
  const navigate = useNavigate();
  const isEdit = !!initial;

  const variantSource = initial ?? createdProduct;
  const variantUnlocked = isEdit || !!createdProduct || !initial;

  const baseInfoLocked = !isEdit && !!createdProduct;

  const { data: brandList } = useBrandList({ status: "ACTIVE", size: 1000 });
  const { data: categoryList } = useCategoryList({
    status: "ACTIVE",
    size: 1000,
  });

  const [productName, setProductName] = useState(initial?.productName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ProductStatus>(
    initial?.status ?? "ACTIVE",
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initial?.category.categoryId ?? undefined,
  );
  const [brandId, setBrandId] = useState<number | undefined>(
    initial?.brand.brandId ?? undefined,
  );

  const [errors, setErrors] = useState<{
    productName?: string;
    categoryId?: string;
    brandId?: string;
    files?: string;
    variants?: string;
  }>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [variants, setVariants] = useState<ProductVariantFormState[]>(
    initial?.variants?.map((v) => ({
      variantId: v.variantId,
      variantCode: v.variantCode,
      size: v.size ?? "",
      color: v.color ?? "",
      price: v.price,
      stockQuantity: v.stockQuantity,
      image: v.image ?? undefined,
      status: v.status,
    })) ?? [],
  );
  const [files, setFiles] = useState<File[]>([]);
  const [imagesDelete, setImagesDelete] = useState<number[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImageResponse[]>(
    initial?.images ?? [],
  );

  const handleDeleteExisting = (id: number) => {
    setImagesDelete((prev) => [...prev, id]);
    setExistingImages((prev) => prev.filter((img) => img.imageId !== id));
    setErrors((prev) => ({ ...prev, files: undefined }));
  };

  const handleFilesChange = (nextFiles: File[]) => {
    setFiles(nextFiles);
    setErrors((prev) => ({ ...prev, files: undefined }));
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!productName.trim()) {
      nextErrors.productName = "Tên sản phẩm là bắt buộc.";
    }

    if (!categoryId) {
      nextErrors.categoryId = "Chưa thêm danh mục sản phẩm.";
    }

    if (!brandId) {
      nextErrors.brandId = "Chưa thêm thương hiệu sản phẩm.";
    }

    if (!isEdit && files.length === 0) {
      nextErrors.files = "Vui lòng thêm ít nhất 1 ảnh sản phẩm.";
    }

    if (isEdit && existingImages.length === 0 && files.length === 0) {
      nextErrors.files = "Sản phẩm cần ít nhất 1 ảnh.";
    }

    if (existingImages.length + files.length > 5) {
      nextErrors.files = "Mỗi sản phẩm chỉ được có tối đa 5 ảnh.";
    }

    if (!isEdit && variants.length > 0) {
      const invalidVariant = variants.some(
        (variant) =>
          !variant.color?.trim() ||
          !variant.size?.trim() ||
          !variant.price ||
          variant.price <= 0 ||
          variant.stockQuantity == null ||
          variant.stockQuantity < 0 ||
          !(variant.file instanceof File),
      );
      if (invalidVariant) {
        nextErrors.variants =
          "Mỗi biến thể cần đủ màu, size, giá hợp lệ, tồn kho và ảnh.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitData = () => {
    onSubmit({
      productName,
      description,
      categoryId: categoryId!,
      brandId: brandId!,
      status,
      files,
      imagesDelete,
      variants,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setShowConfirm(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      { }
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/products")}
            className="h-9 w-9"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              {isEdit ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEdit
                ? initial.productCode
                : createdProduct
                  ? createdProduct.productCode
                  : "Điền thông tin sản phẩm"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 items-start">
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="productName">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    setErrors((prev) => ({ ...prev, productName: undefined }));
                  }}
                  placeholder="Nhập tên sản phẩm..."
                  required
                  disabled={baseInfoLocked}
                />
                {errors.productName ? (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.productName}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Mô tả (không bắt buộc)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Có thể để trống mô tả sản phẩm..."
                  rows={4}
                  disabled={baseInfoLocked}
                  className="resize-none"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Danh mục (chọn một)</Label>
                    <CreateCategoryModal
                      className="h-7"
                      onCreated={(category) => {
                        setCategoryId(category.categoryId);
                        setErrors((prev) => ({ ...prev, categoryId: undefined }));
                      }}
                    />
                  </div>
                  <div
                    role="group"
                    aria-label="Danh mục sản phẩm"
                    className="max-h-64 space-y-2 grid grid-cols-3 gap-3 overflow-y-auto rounded-lg bg-muted/30 p-2"
                  >
                    {!categoryList ? (
                      <p className="px-2 py-1 text-sm text-muted-foreground">
                        Đang tải danh mục...
                      </p>
                    ) : null}
                    {initial?.category &&
                      !categoryList?.content.some(
                        (category) =>
                          category.categoryId === initial.category.categoryId,
                      ) && (
                        <label
                          htmlFor={`category-${initial.category.categoryId}`}
                          className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 shadow-sm transition-all hover:border-primary/60 hover:shadow ${categoryId === initial.category.categoryId
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border"
                            }`}
                        >
                          <Checkbox
                            id={`category-${initial.category.categoryId}`}
                            checked={categoryId === initial.category.categoryId}
                            onCheckedChange={(checked) => {
                              setCategoryId(
                                checked
                                  ? initial.category.categoryId
                                  : undefined,
                              );
                              setErrors((prev) => ({
                                ...prev,
                                categoryId: undefined,
                              }));
                            }}
                            disabled={baseInfoLocked}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {initial.category.categoryName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {initial.category.categoryCode} · Hiện tại
                            </span>
                          </span>
                        </label>
                      )}
                    {categoryList?.content.map((category) => (
                      <label
                        htmlFor={`category-${category.categoryId}`}
                        key={category.categoryId}
                        className={`flex h-16 cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 shadow-sm transition-all hover:border-primary/60 hover:shadow ${categoryId === category.categoryId
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border"
                          }`}
                      >
                        <Checkbox
                          id={`category-${category.categoryId}`}
                          checked={categoryId === category.categoryId}
                          onCheckedChange={(checked) => {
                            setCategoryId(
                              checked ? category.categoryId : undefined,
                            );
                            setErrors((prev) => ({
                              ...prev,
                              categoryId: undefined,
                            }));
                          }}
                          disabled={baseInfoLocked}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {category.categoryName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {category.categoryCode}
                          </span>
                        </span>
                      </label>
                    ))}
                    {categoryList?.content.length === 0 &&
                      !initial?.category ? (
                      <p className="px-2 py-1 text-sm text-muted-foreground">
                        Chưa có danh mục hoạt động
                      </p>
                    ) : null}
                  </div>

                  {errors.categoryId ? (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.categoryId}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label>Thương hiệu (chọn một)</Label>
                    <CreateBrandModal
                      className="h-7"
                      onCreated={(brand) => {
                        setBrandId(brand.brandId);
                        setErrors((prev) => ({ ...prev, brandId: undefined }));
                      }}
                    />
                  </div>
                  <div
                    role="group"
                    aria-label="Thương hiệu sản phẩm"
                    className="max-h-64 space-y-2 grid grid-cols-3 gap-2 overflow-y-auto rounded-lg bg-muted/30 p-2"
                  >
                    {!brandList ? (
                      <p className="px-2 py-1 text-sm text-muted-foreground">
                        Đang tải thương hiệu...
                      </p>
                    ) : null}
                    {initial?.brand &&
                      !brandList?.content.some(
                        (brand) => brand.brandId === initial.brand.brandId,
                      ) && (
                        <label
                          htmlFor={`brand-${initial.brand.brandId}`}
                          className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 shadow-sm transition-all hover:border-primary/60 hover:shadow ${brandId === initial.brand.brandId
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border"
                            }`}
                        >
                          <Checkbox
                            id={`brand-${initial.brand.brandId}`}
                            checked={brandId === initial.brand.brandId}
                            onCheckedChange={(checked) => {
                              setBrandId(
                                checked ? initial.brand.brandId : undefined,
                              );
                              setErrors((prev) => ({
                                ...prev,
                                brandId: undefined,
                              }));
                            }}
                            disabled={baseInfoLocked}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {initial.brand.brandName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {initial.brand.brandCode} · Hiện tại
                            </span>
                          </span>
                        </label>
                      )}
                    {brandList?.content.map((brand) => (
                      <label
                        htmlFor={`brand-${brand.brandId}`}
                        key={brand.brandId}
                        className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-lg border bg-background p-3 shadow-sm transition-all hover:border-primary/60 hover:shadow ${brandId === brand.brandId
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border"
                          }`}
                      >
                        <Checkbox
                          id={`brand-${brand.brandId}`}
                          checked={brandId === brand.brandId}
                          onCheckedChange={(checked) => {
                            setBrandId(checked ? brand.brandId : undefined);
                            setErrors((prev) => ({
                              ...prev,
                              brandId: undefined,
                            }));
                          }}
                          disabled={baseInfoLocked}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {brand.brandName}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {brand.brandCode}
                          </span>
                        </span>
                      </label>
                    ))}
                    {brandList?.content.length === 0 && !initial?.brand ? (
                      <p className="px-2 py-1 text-sm text-muted-foreground">
                        Chưa có thương hiệu hoạt động
                      </p>
                    ) : null}
                  </div>

                  {errors.brandId ? (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.brandId}
                    </p>
                  ) : null}
                </div>
                {initial && (
                  <div className="space-y-1.5">
                    <Label>Trạng thái</Label>
                    <Select
                      value={status != null ? status : "ACTIVE"}
                      onValueChange={(value) =>
                        setStatus(value as ProductStatus)
                      }
                      disabled={baseInfoLocked}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          { }
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">
                Ảnh sản phẩm{" "}
                {!isEdit && <span className="text-red-500">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageUpload
                existingImages={existingImages}
                onDeleteExisting={handleDeleteExisting}
                files={files}
                onFilesChange={handleFilesChange}
              />
              {errors.files ? (
                <p className="text-xs text-red-500 mt-2">{errors.files}</p>
              ) : null}
            </CardContent>
          </Card>

          {variantUnlocked ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Biến thể sản phẩm
                </CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  Thêm các biến thể như màu sắc, kích cỡ, v.v.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isEdit && createdProduct ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    Sản phẩm đã được khởi tạo. Hãy thêm các biến thể bên dưới!
                  </div>
                ) : null}
                <ProductVariantForm
                  productId={variantSource?.productId}
                  variants={variants}
                  onChange={setVariants}
                />
                {errors.variants ? (
                  <p className="text-xs text-red-500">{errors.variants}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700">
                  Biến thể sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Biến thể sẽ được tạo ngay sau khi bạn nhấn "Tạo sản phẩm". Mục
                  này sẽ tự động mở để bạn thêm biến thể mà không cần chuyển
                  trang.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/products")}
        >
          Huỷ
        </Button>
        {!isEdit && createdProduct ? (
          <Button
            type="button"
            onClick={() => (onFinish ? onFinish() : navigate("/products"))}
            className="min-w-28"
          >
            Hoàn tất
          </Button>
        ) : (
          <Button type="submit" disabled={isPending} className="min-w-28">
            {isPending
              ? "Đang lưu..."
              : isEdit
                ? "Lưu thay đổi"
                : "Tạo sản phẩm"}
          </Button>
        )}
      </div>

      {showConfirm && (
        <ConfirmModal
          typeConfirm={isEdit ? "UPDATE" : "CREATE"}
          message={
            isEdit
              ? "Bạn có chắc muốn lưu các thay đổi của sản phẩm này không?"
              : "Bạn có chắc muốn tạo sản phẩm này không?"
          }
          isPending={isPending}
          onCancel={() => setShowConfirm(false)}
          onConfirm={submitData}
        />
      )}
    </form>
  );
}
