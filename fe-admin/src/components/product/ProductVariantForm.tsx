import { useMemo, useState } from "react";
import { Trash2, ImagePlus, Save, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import VariantMatrixGenerator, {
  type GeneratedCombo,
} from "./VariantMatrixGenerator";
import PriceInput from "./PriceInput";
import ProductVariantEditModal from "./ProductVariantEditModal";
import {
  useBulkAddProductVariants,
  useChangeProductVariantStatus,
  useUpdateProductVariant,
} from "@/hooks/useProductVariant";
import type {
  BulkVariantItem,
  ProductVariantRequest,
  ProductVariantResponse,
  ProductVariantStatus,
} from "@/api/productVariantApi";
import { comboKey } from "./variant-matrix/types";
import {
  VARIANT_IMAGE_ACCEPT,
  validateVariantImage,
} from "./variantImageValidation";
import ProductVariantQrDialog from "./ProductVariantQrDialog";

export interface ProductVariantFormState extends ProductVariantRequest {
  variantId?: number;
  variantCode?: string;
  status?: ProductVariantStatus;
  dirty?: boolean;
}

interface ProductVariantFormProps {
  productId?: number;
  variants: ProductVariantFormState[];
  onChange: (variants: ProductVariantFormState[]) => void;
}

interface RowErrors {
  color?: boolean;
  size?: boolean;
  price?: boolean;
}

interface ConfirmState {
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

const STATUS_META: Record<
  ProductVariantStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Đang bán",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  INACTIVE: {
    label: "Ngừng bán",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

function StatusBadge({ status }: { status?: ProductVariantStatus }) {
  if (!status) return null;
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={`text-xs ${meta.className}`}>
      {meta.label}
    </Badge>
  );
}

const formatVnd = (value?: number) =>
  value == null ? "—" : `${value.toLocaleString("vi-VN")}₫`;

function toFormState(result: ProductVariantResponse): ProductVariantFormState {
  return {
    variantId: result.variantId,
    variantCode: result.variantCode,
    size: result.size ?? "",
    color: result.color ?? "",
    price: result.price,
    stockQuantity: result.stockQuantity,
    image: result.image ?? undefined,
    status: result.status,
    file: undefined,
    dirty: false,
  };
}

export default function ProductVariantForm({
  productId,
  variants,
  onChange,
}: ProductVariantFormProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedSaved, setSelectedSaved] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<number, RowErrors>>({});
  const [statusChanging, setStatusChanging] = useState<Set<number>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [savedSearch, setSavedSearch] = useState("");
  const [savedPage, setSavedPage] = useState(0);
  const [savedPageSize, setSavedPageSize] = useState(5);

  const [bulkPrice, setBulkPrice] = useState<number | "">("");
  const [bulkStock, setBulkStock] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<ProductVariantStatus | "">("");
  const [savedBulkPrice, setSavedBulkPrice] = useState<number | "">("");
  const [savedBulkStock, setSavedBulkStock] = useState<string>("");
  const [savedBulkStatus, setSavedBulkStatus] = useState<
    ProductVariantStatus | ""
  >("");

  const toBulkNumber = (val: number | string | undefined): number | "" =>
    typeof val === "number" ? val : "";

  const bulkAdd = useBulkAddProductVariants();
  const changeStatus = useChangeProductVariantStatus();
  const updateVariant = useUpdateProductVariant();

  const existingKeys = useMemo(
    () => new Set(variants.map((v) => comboKey(v.color ?? "", v.size ?? ""))),
    [variants],
  );

  const draftEntries = useMemo(
    () => variants.map((v, i) => ({ v, i })).filter((e) => !e.v.variantId),
    [variants],
  );
  const savedEntries = useMemo(
    () => variants.map((v, i) => ({ v, i })).filter((e) => !!e.v.variantId),
    [variants],
  );
  const filteredSavedEntries = useMemo(() => {
    const keyword = savedSearch.trim().toLowerCase();
    if (!keyword) return savedEntries;
    return savedEntries.filter(({ v }) =>
      (v.variantCode ?? "").toLowerCase().includes(keyword),
    );
  }, [savedEntries, savedSearch]);
  const savedTotalPages = Math.max(
    1,
    Math.ceil(filteredSavedEntries.length / savedPageSize),
  );
  const currentSavedPage = Math.min(savedPage, savedTotalPages - 1);
  const pagedSavedEntries = filteredSavedEntries.slice(
    currentSavedPage * savedPageSize,
    (currentSavedPage + 1) * savedPageSize,
  );
  const draftIndexes = useMemo(
    () => draftEntries.map((e) => e.i),
    [draftEntries],
  );

  const patchVariant = (
    idx: number,
    patch: Partial<ProductVariantFormState>,
  ) => {
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const buildRowErrors = (v: ProductVariantFormState): RowErrors => {
    const errs: RowErrors = {};
    if (!v.color?.trim()) errs.color = true;
    if (!v.size?.trim()) errs.size = true;
    if (v.price == null || v.price <= 0) errs.price = true;

    return errs;
  };

  const validateAndShow = (
    idx: number,
    v: ProductVariantFormState,
  ): boolean => {
    const errs = buildRowErrors(v);
    setErrors((prev) => {
      const next = { ...prev };
      if (Object.keys(errs).length > 0) next[idx] = errs;
      else delete next[idx];
      return next;
    });
    return Object.keys(errs).length === 0;
  };

  const validateDrafts = (): boolean => {
    let valid = true;
    const newErrors: Record<number, RowErrors> = {};
    draftEntries.forEach(({ v, i }) => {
      const errs = buildRowErrors(v);
      if (Object.keys(errs).length > 0) {
        valid = false;
        newErrors[i] = errs;
      }
    });
    setErrors(newErrors);
    return valid;
  };

  const handleGenerate = (combos: GeneratedCombo[]) => {
    const next: ProductVariantFormState[] = combos.map((c) => ({
      sku: "",
      barcode: "",
      size: c.size,
      color: c.color,
      price: c.price ?? 0,
      stockQuantity: c.stockQuantity ?? 0,
      status: (c.stockQuantity ?? 0) > 0 ? "ACTIVE" : "INACTIVE",
      file: c.file,
    }));
    onChange([...variants, ...next]);
    setErrors({});
  };

  const toggleSelect = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === draftIndexes.length) setSelected(new Set());
    else setSelected(new Set(draftIndexes));
  };

  const targetIndexes = () =>
    selected.size > 0 ? [...selected] : draftIndexes;

  const applyBulkEdit = () => {
    const targets = new Set(targetIndexes());
    onChange(
      variants.map((v, i) => {
        if (!targets.has(i) || v.variantId) return v;
        const patch: Partial<ProductVariantFormState> = {};
        if (bulkPrice !== "") patch.price = bulkPrice;
        if (bulkStock !== "") patch.stockQuantity = Number(bulkStock);
        if (bulkStatus !== "") patch.status = bulkStatus;
        return { ...v, ...patch };
      }),
    );
    setErrors({});
    toast.success("Đã áp dụng chỉnh sửa hàng loạt.");
  };

  const toggleSavedSelect = (variantId: number) => {
    setSelectedSaved((prev) => {
      const next = new Set(prev);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  };

  const toggleSelectAllSaved = () => {
    const ids = pagedSavedEntries.map(({ v }) => v.variantId!);
    setSelectedSaved((prev) =>
      ids.length > 0 && ids.every((id) => prev.has(id))
        ? new Set([...prev].filter((id) => !ids.includes(id)))
        : new Set([...prev, ...ids]),
    );
  };

  const requestBulkUpdateSaved = () => {
    if (selectedSaved.size === 0) {
      toast.error("Vui lòng chọn ít nhất một biến thể đã lưu.");
      return;
    }
    if (
      savedBulkPrice === "" &&
      savedBulkStock === "" &&
      savedBulkStatus === ""
    ) {
      toast.error("Vui lòng nhập ít nhất một giá trị cần cập nhật.");
      return;
    }

    const targets = savedEntries
      .map(({ v }) => v)
      .filter((v) => selectedSaved.has(v.variantId!));
    const invalidPrice = targets.some(
      (v) => (savedBulkPrice === "" ? v.price : savedBulkPrice) <= 0,
    );
    if (invalidPrice) {
      toast.error("Giá bán phải lớn hơn 0.");
      return;
    }

    setConfirm({
      title: "Cập nhật nhiều biến thể",
      description: `Áp dụng thay đổi cho ${targets.length} biến thể đã chọn?`,
      actionLabel: "Cập nhật",
      onConfirm: async () => {
        setSaving(true);
        try {
          const results = await Promise.all(
            targets.map((v) =>
              updateVariant.mutateAsync({
                variantId: v.variantId!,
                data: {
                  size: v.size,
                  color: v.color,
                  price: savedBulkPrice === "" ? v.price : savedBulkPrice,
                  stockQuantity:
                    savedBulkStock === ""
                      ? (v.stockQuantity ?? 0)
                      : Number(savedBulkStock),
                  status: savedBulkStatus === "" ? v.status : savedBulkStatus,
                },
              }),
            ),
          );
          const resultMap = new Map(
            results.map((item) => [item.variantId, item]),
          );
          onChange(
            variants.map((item) => {
              const result = item.variantId
                ? resultMap.get(item.variantId)
                : undefined;
              return result ? toFormState(result) : item;
            }),
          );
          setSelectedSaved(new Set());
          setSavedBulkPrice("");
          setSavedBulkStock("");
          setSavedBulkStatus("");
          toast.success(`Đã cập nhật ${results.length} biến thể.`);
        } catch (error) {
          const apiError = (error as { apiMessage?: string } | null) ?? null;
          toast.error(apiError?.apiMessage ?? "Cập nhật hàng loạt thất bại");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const removeDraft = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
    setSelected(new Set());
    setErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const handleVariantUpdated = (result: ProductVariantResponse) => {
    onChange(
      variants.map((item) =>
        item.variantId === result.variantId ? toFormState(result) : item,
      ),
    );
  };

  const requestChangeStatus = (
    v: ProductVariantFormState,
    next: ProductVariantStatus,
  ) => {
    setConfirm({
      title: next === "ACTIVE" ? "Mở bán biến thể" : "Ngừng bán biến thể",
      description: `Chuyển biến thể "${v.color} - ${v.size}" sang trạng thái "${STATUS_META[next].label}"?`,
      actionLabel: "Xác nhận",
      onConfirm: async () => {
        const variantId = v.variantId!;
        setStatusChanging((prev) => new Set(prev).add(variantId));
        try {
          const result = await changeStatus.mutateAsync({
            variantId,
            status: next,
          });
          onChange(
            variants.map((item) =>
              item.variantId === variantId ? toFormState(result) : item,
            ),
          );
          toast.success("Cập nhật trạng thái thành công.");
        } catch (error) {
          const apiError = (error as { apiMessage?: string } | null) ?? null;
          toast.error(apiError?.apiMessage ?? "Cập nhật trạng thái thất bại");
        } finally {
          setStatusChanging((prev) => {
            const n = new Set(prev);
            n.delete(variantId);
            return n;
          });
        }
      },
    });
  };

  const requestSaveDrafts = () => {
    if (!productId) {
      toast.error("Không thể lưu biến thể khi sản phẩm chưa được tạo.");
      return;
    }
    const drafts = draftEntries.map((e) => e.v);
    if (drafts.length === 0) {
      toast.info("Không có biến thể mới nào để lưu.");
      return;
    }
    if (!validateDrafts()) {
      toast.error("Vui lòng kiểm tra lại các trường bị lỗi trong bảng.");
      return;
    }
    const missingImage = drafts.filter((v) => !(v.file instanceof File));
    if (missingImage.length > 0) {
      toast.error(`Vui lòng thêm ảnh cho ${missingImage.length} biến thể.`);
      return;
    }

    setConfirm({
      title: "Lưu biến thể mới",
      description: `Xác nhận lưu ${drafts.length} biến thể mới vào sản phẩm?`,
      actionLabel: "Lưu",
      onConfirm: doSaveDrafts,
    });
  };

  const doSaveDrafts = async () => {
    if (!productId) return;
    const drafts = draftEntries.map((e) => e.v);
    setSaving(true);
    try {
      const items: BulkVariantItem[] = drafts.map((v) => ({
        data: {
          size: v.size,
          color: v.color,
          price: v.price,
          stockQuantity: v.stockQuantity,
          status: v.status,
        },
        file: v.file as File,
      }));

      const created = await bulkAdd.mutateAsync({ productId, items });

      let createdIdx = 0;
      const nextVariants = variants.map((v) =>
        !v.variantId ? toFormState(created[createdIdx++]) : v,
      );

      onChange(nextVariants);
      setSelected(new Set());
      setErrors({});
      toast.success("Lưu biến thể mới thành công.");
    } catch (error) {
      const apiError = (error as { apiMessage?: string } | null) ?? null;
      toast.error(apiError?.apiMessage ?? "Lưu biến thể thất bại");
    } finally {
      setSaving(false);
    }
  };

  const allDraftsSelected =
    draftIndexes.length > 0 && selected.size === draftIndexes.length;
  const allSavedSelected =
    pagedSavedEntries.length > 0 &&
    pagedSavedEntries.every(({ v }) => selectedSaved.has(v.variantId!));

  return (
    <div className="space-y-6">
      <VariantMatrixGenerator
        existingKeys={existingKeys}
        onGenerate={handleGenerate}
      />

      {variants.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
          Chưa có biến thể nào. Dùng công cụ phía trên để tạo tổ hợp size × màu.
        </p>
      )}

      { }
      {draftEntries.length > 0 && (
        <section className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/30 p-3">
          <div className="flex items-center gap-2">
            <Plus size={16} className="text-amber-600" />
            <h3 className="text-sm font-medium text-amber-800">
              Biến thể mới (chưa lưu)
            </h3>
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-600 border-amber-200"
            >
              {draftEntries.length}
            </Badge>
          </div>

          { }
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-xs text-gray-500 w-full">
              Sửa hàng loạt{" "}
              {selected.size > 0
                ? `(${selected.size} dòng đã chọn)`
                : "(áp dụng cho tất cả biến thể mới)"}
            </span>
            <PriceInput
              value={bulkPrice}
              onChange={(val) => setBulkPrice(toBulkNumber(val))}
              placeholder="Giá bán"
              className="h-8 w-28 text-sm"
            />
            <Input
              type="number"
              min={0}
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              placeholder="Tồn kho"
              className="h-8 w-28 text-sm"
            />
            <Select
              value={bulkStatus || undefined}
              onValueChange={(val) =>
                setBulkStatus(val as ProductVariantStatus)
              }
            >
              <SelectTrigger className="h-8 w-32 p-4 text-xs">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Đang bán</SelectItem>
                <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={applyBulkEdit}
              className="h-8"
            >
              Áp dụng
            </Button>
          </div>

          { }
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <Checkbox
                      checked={allDraftsSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Ảnh</th>
                  <th className="px-3 py-2 text-left">Màu</th>
                  <th className="px-3 py-2 text-left">Kích cỡ</th>
                  <th className="px-3 py-2 text-left">Giá bán</th>
                  <th className="px-3 py-2 text-left">Tồn kho</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {draftEntries.map(({ v, i: idx }) => {
                  const preview =
                    v.file instanceof File
                      ? URL.createObjectURL(v.file)
                      : v.image?.imageUrl;
                  const rowErr = errors[idx] || {};
                  return (
                    <tr key={`draft-${idx}`} className="bg-amber-50/40">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selected.has(idx)}
                          onCheckedChange={() => toggleSelect(idx)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <label className="relative block h-10 w-10 cursor-pointer rounded-md border border-gray-200 overflow-hidden">
                          {preview ? (
                            <img
                              src={preview}
                              alt={`${v.color}-${v.size}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-gray-300">
                              <ImagePlus size={16} />
                            </span>
                          )}
                          <input
                            type="file"
                            accept={VARIANT_IMAGE_ACCEPT}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const error = validateVariantImage(file);
                              if (error) {
                                toast.error(error);
                                e.target.value = "";
                                return;
                              }
                              patchVariant(idx, { file });
                            }}
                          />
                        </label>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={v.color ?? ""}
                          onChange={(e) =>
                            patchVariant(idx, { color: e.target.value })
                          }
                          className={`h-8 w-24 text-sm ${rowErr.color ? "border-red-400" : ""}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          value={v.size ?? ""}
                          onChange={(e) =>
                            patchVariant(idx, { size: e.target.value })
                          }
                          className={`h-8 w-20 text-sm ${rowErr.size ? "border-red-400" : ""}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <PriceInput
                          value={v.price ?? ""}
                          onChange={(val) =>
                            patchVariant(idx, {
                              price: val === "" ? 0 : (val as number),
                            })
                          }
                          onBlur={() => validateAndShow(idx, variants[idx])}
                          error={rowErr.price}
                          className="h-8 w-28 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={v.stockQuantity ?? 0}
                          onChange={(e) =>
                            patchVariant(idx, {
                              stockQuantity: Number(e.target.value),
                            })
                          }
                          className="h-8 w-20 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={v.status ?? "INACTIVE"}
                          onValueChange={(val) =>
                            patchVariant(idx, {
                              status: val as ProductVariantStatus,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-28 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Đang bán</SelectItem>
                            <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeDraft(idx)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-700">
              {productId
                ? `${draftEntries.length} biến thể chưa lưu.`
                : `${draftEntries.length} biến thể sẽ được lưu khi tạo sản phẩm.`}
            </p>
            {productId ? (
              <Button
                type="button"
                onClick={requestSaveDrafts}
                disabled={saving}
                className="gap-1.5"
              >
                <Save size={14} />
                {saving ? "Đang lưu..." : "Lưu biến thể mới"}
              </Button>
            ) : null}
          </div>
        </section>
      )}

      { }
      {savedEntries.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Biến thể đã lưu ({savedEntries.length})
          </h3>
          <p className="text-xs text-gray-400">
            Chọn nhiều biến thể để cập nhật đồng thời giá bán, tồn kho hoặc
            trạng thái. Trường để trống sẽ giữ nguyên giá trị hiện tại.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                value={savedSearch}
                onChange={(event) => {
                  setSavedSearch(event.target.value);
                  setSavedPage(0);
                }}
                placeholder="Tìm theo mã biến thể..."
                className="h-9 pl-9 text-sm"
              />
            </div>
            <span className="text-xs text-gray-500">
              {filteredSavedEntries.length}/{savedEntries.length} biến thể
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-blue-100 bg-blue-50/40 p-3">
            <span className="w-full text-xs text-blue-700">
              Cập nhật hàng loạt ({selectedSaved.size} biến thể đã chọn)
            </span>
            <PriceInput
              value={savedBulkPrice}
              onChange={(value) => setSavedBulkPrice(toBulkNumber(value))}
              placeholder="Giá bán mới"
              className="h-8 w-32 text-sm"
            />
            <Input
              type="number"
              min={0}
              value={savedBulkStock}
              onChange={(event) => setSavedBulkStock(event.target.value)}
              placeholder="Tồn kho mới"
              className="h-8 w-32 text-sm"
            />
            <Select
              value={savedBulkStatus || undefined}
              onValueChange={(value) =>
                setSavedBulkStatus(value as ProductVariantStatus)
              }
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Trạng thái mới" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Đang bán</SelectItem>
                <SelectItem value="INACTIVE">Ngừng bán</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="sm"
              onClick={requestBulkUpdateSaved}
              disabled={saving || selectedSaved.size === 0}
              className="h-8 gap-1.5"
            >
              <Save size={14} />
              {saving ? "Đang cập nhật..." : "Cập nhật đã chọn"}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <Checkbox
                      checked={allSavedSelected}
                      onCheckedChange={toggleSelectAllSaved}
                    />
                  </th>
                  <th className="px-3 py-2 text-left">Ảnh</th>
                  <th className="px-3 py-2 text-left">Mã biến thể</th>
                  <th className="px-3 py-2 text-left">Màu</th>
                  <th className="px-3 py-2 text-left">Kích cỡ</th>
                  <th className="px-3 py-2 text-left">Giá bán</th>
                  <th className="px-3 py-2 text-left">Tồn kho</th>
                  <th className="px-3 py-2 text-left">Trạng thái</th>
                  <th className="px-3 py-2 text-left">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedSavedEntries.map(({ v }) => {
                  const preview = v.image?.imageUrl;
                  const isActive = v.status === "ACTIVE";
                  const changing = statusChanging.has(v.variantId!);
                  return (
                    <tr key={v.variantId}>
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selectedSaved.has(v.variantId!)}
                          onCheckedChange={() =>
                            toggleSavedSelect(v.variantId!)
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="h-10 w-10 rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                          {preview ? (
                            <img
                              src={preview}
                              alt={`${v.color}-${v.size}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-gray-300">
                              <ImagePlus size={16} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2  text-xs font-semibold text-gray-700">
                        {v.variantCode || "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{v.color}</td>
                      <td className="px-3 py-2 text-gray-700">{v.size}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {formatVnd(v.price)}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {v.stockQuantity ?? 0}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-3 py-2 flex items-center gap-4">
                        {v.variantId != null && (
                          <ProductVariantQrDialog
                            variant={{ ...v, variantId: v.variantId }}
                          />
                        )}
                        <Switch
                          checked={isActive}
                          disabled={changing}
                          onCheckedChange={(checked) =>
                            requestChangeStatus(
                              v,
                              checked ? "ACTIVE" : "INACTIVE",
                            )
                          }
                        />
                        <ProductVariantEditModal
                          variant={v}
                          onSaved={handleVariantUpdated}
                        />
                      </td>
                    </tr>
                  );
                })}
                {pagedSavedEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-8 text-center text-sm text-gray-400"
                    >
                      Không tìm thấy biến thể có mã “{savedSearch}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Hiển thị</span>
              <Select
                value={String(savedPageSize)}
                onValueChange={(value) => {
                  setSavedPageSize(Number(value));
                  setSavedPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span>biến thể/trang</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentSavedPage === 0}
                onClick={() => setSavedPage((page) => Math.max(0, page - 1))}
              >
                Trước
              </Button>
              <span className="min-w-20 text-center text-xs text-gray-500">
                Trang {currentSavedPage + 1}/{savedTotalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentSavedPage >= savedTotalPages - 1}
                onClick={() =>
                  setSavedPage((page) =>
                    Math.min(savedTotalPages - 1, page + 1),
                  )
                }
              >
                Sau
              </Button>
            </div>
          </div>
        </section>
      )}

      { }
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm?.destructive ? "destructive" : "default"}
              onClick={() => confirm?.onConfirm()}
            >
              {confirm?.actionLabel ?? "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
