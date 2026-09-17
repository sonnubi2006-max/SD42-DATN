import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  useProductList,
  useBulkDeleteProducts,
  useBulkUpdateStatus,
  useExportProducts,
} from "@/hooks/useProduct";
import type {
  ProductFilterParams,
  ProductStatus,
} from "@/api/productApi";
import { useDebounce } from "@/hooks/useDebounce";

import ProductToolbar from "@/components/product/ProductToolbar";
import ProductTable from "@/components/product/ProductTable";
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
import { useCategoryList } from "@/hooks/useCategory";
import { useBrandList } from "@/hooks/useBrand";
import Pagination from "@/components/Pagination";

function getStr(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key) ?? fallback;
}

function getNum(params: URLSearchParams, key: string, fallback: number) {
  const v = params.get(key);
  return v != null ? Number(v) : fallback;
}

export default function ProductPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = getStr(searchParams, "keyword");
  const urlStatus = getStr(searchParams, "status") as ProductStatus | "";
  const urlCategoryId = getNum(searchParams, "categoryId", 0) || null;
  const urlBrandId = getNum(searchParams, "brandId", 0) || null;
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
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("INACTIVE");

  const exportMutation = useExportProducts();

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

  const queryParams: ProductFilterParams = {
    page: urlPage,
    size: urlSize,
    sort: "createdAt",
    direction: urlDirection,
    status: urlStatus || null,
    categoryId: urlCategoryId,
    brandId: urlBrandId,
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    keyword: debouncedSearch || undefined,
  };

  const { data, isLoading } = useProductList(queryParams);
  const { data: categories } = useCategoryList();
  const { data: brands } = useBrandList();
  useBulkDeleteProducts();
  const { mutate: bulkUpdate, isPending: isBulkUpdating } =
    useBulkUpdateStatus();

  const handleBulkStatus = () => {
    bulkUpdate(
      { ids: selectedIds, status: bulkStatus },
      {
        onSuccess: () => {
          toast.success(`Đã cập nhật ${selectedIds.length} sản phẩm`);
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
        <h1 className="text-xl font-semibold text-foreground">Sản phẩm</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Quản lý toàn bộ sản phẩm</p>
      </div>

      {}
      <ProductToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        status={urlStatus}
        onStatusChange={(v) => updateParams({ status: v || null, page: null })}
        direction={urlDirection}
        onDirectionChange={(v) => updateParams({ direction: v })}
        categoryId={urlCategoryId}
        onCagegoryChange={(c) =>
          updateParams({ categoryId: c ? String(c) : null, page: null })
        }
        brandId={urlBrandId}
        onBrandChange={(b) =>
          updateParams({ brandId: b ? String(b) : null, page: null })
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
        onCreate={() => navigate("/products/create")}
        categories={categories?.content || []}
        brands={brands?.content || []}
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
              Đã chọn {selectedIds.length} sản phẩm
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

        <ProductTable
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
              Đổi trạng thái {selectedIds.length} sản phẩm
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Select
            value={bulkStatus}
            onValueChange={(v) => setBulkStatus(v as ProductStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Đang bán</SelectItem>
              <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
              <SelectItem value="OUT_OF_STOCK">Hết hàng</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkStatus}
              disabled={isBulkUpdating}
            >
              {isBulkUpdating ? "Đang cập nhật..." : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
