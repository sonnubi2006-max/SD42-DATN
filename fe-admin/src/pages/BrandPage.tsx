import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBrandList, useBrandExportExcel } from "../hooks/useBrand";
import type { BrandParams, BrandStatus } from "../api/brandApi";
import CreateBrandModal from "@/components/brand/CreateBrandModal";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/Pagination";
import UpdateBrandModal from "@/components/brand/UpdateBrandModal";
import UpdateStatusBrand from "@/components/brand/UpdateStatusBrand";
import { Search, SortAsc, SortDesc, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function getStr(searchParams: URLSearchParams, key: string, fallback = "") {
  return searchParams.get(key) ?? fallback;
}

function getNum(searchParams: URLSearchParams, key: string, fallback: number) {
  const v = searchParams.get(key);
  return v != null ? Number(v) : fallback;
}

export default function BrandPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = getStr(searchParams, "keyword");
  const urlStatus = searchParams.get("status") as BrandStatus | null;
  const urlDirection = getStr(searchParams, "direction", "desc") as
    | "asc"
    | "desc";
  const urlPage = getNum(searchParams, "page", 0);
  const urlSize = getNum(searchParams, "size", 10);

  const [search, setSearch] = useState(urlKeyword);
  const debouncedSearch = useDebounce(search, 500);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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

  const queryParams: BrandParams = {
    page: urlPage,
    size: urlSize,
    sort: "brandId",
    direction: urlDirection,
    status: urlStatus,
    keyword: debouncedSearch || undefined,
  };

  const { data, isLoading } = useBrandList(queryParams);
  const { mutate: exportExcel, isPending: isExporting } = useBrandExportExcel();

  const handleExportExcel = (type: "selected" | "filtered" | "all") => {
    const ids = type === "selected" ? Array.from(selectedIds) : undefined;
    const params =
      type === "all"
        ? {}
        : {
          status: urlStatus,
          keyword: debouncedSearch || undefined,
        };
    exportExcel({ params, ids });
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: number[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const allPageIds = data?.content?.map((brand) => brand.brandId) ?? [];
  const isAllSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Thương hiệu sản phẩm
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý toàn bộ thương hiệu
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="gap-1.5"
                disabled={isExporting}
              >
                <Download size={15} />
                {isExporting ? "Đang xuất…" : "Xuất Excel"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem
                onClick={() => handleExportExcel("selected")}
                disabled={selectedIds.size === 0}
              >
                Thương hiệu đã chọn ({selectedIds.size})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel("filtered")}>
                Theo bộ lọc hiện tại
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel("all")}>
                Tất cả thương hiệu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateBrandModal />
        </div>
      </div>

      {}
      <Card className="shadow-sm">
        {}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 pb-3.5">
          <span className="text-sm font-medium">Danh sách thương hiệu</span>

          <div className="flex items-center gap-2 flex-wrap">
            {}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo mã, tên"
                className="pl-8 h-9 w-48 text-sm"
              />
            </div>

            {}
            <Select
              onValueChange={(val) =>
                updateParams({
                  status: val === "ALL" ? null : val,
                  page: null,
                })
              }
              value={urlStatus ?? "ALL"}
            >
              <SelectTrigger className="h-9 w-40 py-4">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Trạng thái</SelectItem>
                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
              </SelectContent>
            </Select>

            {}
            <Select
              onValueChange={(val) =>
                updateParams({
                  direction: val,
                  page: null,
                })
              }
              value={urlDirection ?? "desc"}
            >
              <SelectTrigger className="h-9 w-40 py-4">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  Mới nhất
                </SelectItem>
                <SelectItem value="asc">
                  Cũ nhất
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) =>
                      toggleSelectAll(allPageIds, !!checked)
                    }
                  />
                </TableHead>
                <TableHead className="w-20 text-center">STT</TableHead>
                <TableHead>
                  Mã
                </TableHead>
                <TableHead>Tên thương hiệu</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="flex justify-center">
                      <Skeleton className="h-10 w-10 rounded" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 mx-auto rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20 mx-auto rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-16 text-muted-foreground text-sm"
                  >
                    {search
                      ? `Không tìm thấy thương hiệu với từ khoá "${search}"`
                      : "Chưa có thương hiệu nào"}
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((brand, i) => (
                  <TableRow key={brand.brandId} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(brand.brandId)}
                        onCheckedChange={() => toggleSelectOne(brand.brandId)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {urlPage * urlSize + i + 1}
                    </TableCell>
                    <TableCell className="font-medium text-start">
                      {brand.brandCode}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        {brand.brandName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {brand.brandLogo ? (
                        <div className="flex items-center">
                          <img
                            src={brand.brandLogo}
                            alt={brand.brandName}
                            className="h-10 w-10 rounded-lg object-contain border border-border p-0.5"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-start">
                      <Badge
                        variant={
                          brand.brandStatus === "ACTIVE"
                            ? "success"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {brand.brandStatus === "ACTIVE"
                          ? "Hoạt động"
                          : "Tạm dừng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-start gap-1">
                        <UpdateBrandModal brand={brand} />
                        <UpdateStatusBrand brand={brand} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={urlPage}
            totalPages={data?.totalPages ?? 1}
            totalElements={data?.totalElements ?? 0}
            first={data?.first ?? false}
            last={data?.last ?? false}
            onPageChange={(page) => updateParams({ page: String(page) })}
            onChangeSize={(size) =>
              updateParams({ size: String(size), page: null })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
