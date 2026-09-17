import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useProductVariantList,
  useBulkUpdateVariantStatus,
  useExportProductVariants,
} from "@/hooks/useProductVariant";
import type {
  ProductVariantFilterParams,
  ProductVariantStatus,
} from "@/api/productVariantApi";
import { useDebounce } from "@/hooks/useDebounce";

import ProductVariantToolbar from "@/components/product/ProductVariantToolbar";
import ProductVariantTable from "@/components/product/ProductVariantTable";
import ProductVariantCreateModal from "@/components/product/ProductVariantCreateModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductById, useProductList } from "@/hooks/useProduct";
import Pagination from "@/components/Pagination";

function getStr(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key) ?? fallback;
}

function getNum(params: URLSearchParams, key: string, fallback: number) {
  const v = params.get(key);
  return v != null ? Number(v) : fallback;
}

export default function ProductVariantPage() {
  const { id } = useParams<{ id: string }>();
  const urlProductId = Number(id);

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: product } = useProductById(urlProductId || null);

  const urlKeyword = getStr(searchParams, "keyword");
  const urlStatus = getStr(searchParams, "status") as ProductVariantStatus | "";
  const urlDirection = getStr(searchParams, "direction", "desc") as
    | "asc"
    | "desc";
  const urlMinPrice = getNum(searchParams, "minPrice", 0) || null;
  const urlMaxPrice = getNum(searchParams, "maxPrice", 0) || null;
  const urlPage = getNum(searchParams, "page", 0);
  const urlSize = getNum(searchParams, "size", 10);

  const [searchInput, setSearchInput] = useState(urlKeyword);
  const debouncedSearch = useDebounce(searchInput, 500);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkStatus, setBulkStatus] =
    useState<ProductVariantStatus>("INACTIVE");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const exportMutation = useExportProductVariants();

  const handleExport = (type: "selected" | "filtered" | "all") => {
    const ids = type === "selected" ? selectedIds : undefined;
    const params = type === "filtered" ? queryParams : {};
    exportMutation.mutate({ params, ids });
  };

  useEffect(() => {
    if (debouncedSearch !== urlKeyword) {
      updateParams({ keyword: debouncedSearch || null, page: null });
    }
  }, [debouncedSearch]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  }

  const queryParams: ProductVariantFilterParams = {
    page: urlPage,
    size: urlSize,
    sort: `${"createdAt"},${urlDirection}`,
    status: urlStatus || null,
    productId: urlProductId,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    keyword: debouncedSearch || undefined,
  };

  const { data, isLoading } = useProductVariantList(queryParams);
  const { data: products } = useProductList({ page: 0, size: 1000 });

  const { mutate: bulkUpdate, isPending: isBulkUpdating } =
    useBulkUpdateVariantStatus();

  const handleBulkStatus = () => {
    bulkUpdate(
      { ids: selectedIds, status: bulkStatus },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật biến thể sản phẩm");
          setSelectedIds([]);
          setBulkStatusOpen(false);
        },
        onError: (e: any) => toast.error(e?.apiMessage ?? "Cập nhật thất bại"),
      },
    );
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-lg font-medium text-gray-900">
          Quản lý sản phẩm / Chi tiết biến thể {product?.productCode}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Quản lý toàn bộ biến thể sản phẩm
        </p>
      </div>

      <ProductVariantToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={urlStatus}
        onStatusChange={(v) => updateParams({ status: v || null, page: null })}
        direction={urlDirection}
        onDirectionChange={(v) => updateParams({ direction: v })}
        productId={urlProductId}
        onProductChange={(p) =>
          updateParams({ productId: p ? String(p) : null, page: null })
        }
        minPrice={urlMinPrice}
        onPriceChange={(min, max) => {
          updateParams({
            minPrice: min ? String(min) : null,
            maxPrice: max ? String(max) : null,
            page: null,
          });
        }}
        maxPrice={urlMaxPrice}
        onCreate={() => setIsCreateOpen(true)}
        products={products?.content || []}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        hasSelection={selectedIds.length > 0}
      />

      {}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm text-blue-700 font-medium">
              Đã chọn {selectedIds.length} biến thể sản phẩm
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => setBulkStatusOpen(true)}
            >
              Đổi trạng thái
            </Button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
            >
              Bỏ chọn
            </button>
          </div>
        )}

        <ProductVariantTable
          data={data?.content ?? []}
          isLoading={isLoading}
          search={searchInput}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
        />

        <Pagination
          currentPage={data?.number ?? 1}
          totalPages={data?.totalPages ?? 1}
          totalElements={data?.totalElements ?? 0}
          first={data?.first ?? false}
          last={data?.last ?? false}
          onPageChange={(v) => updateParams({ page: v.toString() })}
          onChangeSize={(v) => updateParams({ size: v.toString(), page: null })}
        />
      </div>

      {}
      <AlertDialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Đổi trạng thái {selectedIds.length} biến thể sản phẩm
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Select
            value={bulkStatus}
            onValueChange={(v) => setBulkStatus(v as ProductVariantStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Đang bán</SelectItem>
              <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkUpdating}
              onClick={(e) => {
                e.preventDefault();
                handleBulkStatus();
              }}
            >
              {isBulkUpdating ? "Đang cập nhật..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <ProductVariantCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        products={products?.content || []}
        defaultProductId={urlProductId}
      />
    </div>
  );
}
