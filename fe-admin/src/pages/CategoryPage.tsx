import useCategoryPage from "@/hooks/useCategoryPage";
import CategoryTable from "@/components/category/CategoryTable";
import CategoryToolbar from "@/components/category/CategoryToolbar";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/Pagination";
import CreateCategoryModal from "@/components/category/CreateCategoryModal";
import { Button } from "@/components/ui/button";
import { Download, LayoutGrid, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CategoryPage() {
  const {
    params,
    search,
    isLoading,
    data,
    selectedIds,
    isExporting,
    setSearch,
    updateParams,
    handleExportExcel,
    toggleSelectOne,
    toggleSelectAll,
    setSelectedIds,
  } = useCategoryPage();

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            Danh mục sản phẩm
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý toàn bộ danh mục
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
                Danh mục đã chọn ({selectedIds.size})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel("filtered")}>
                Theo bộ lọc hiện tại
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel("all")}>
                Tất cả danh mục
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateCategoryModal />
        </div>
      </div>

      {}
      <Card className="shadow-sm">
        {}
        <div className="flex items-center justify-between gap-3 border-b px-5 pb-3.5 flex-wrap">
          <span className="text-sm font-medium">Danh sách danh mục</span>
          <CategoryToolbar
            search={search}
            onSearchChange={setSearch}
            status={params.status ?? null}
            onStatusChange={(val) =>
              updateParams({ status: val || null, page: null })
            }
            direction={params.direction ?? "asc"}
            onDirectionChange={(dir) => updateParams({ direction: dir })}
          />
        </div>

        <CardContent className="p-0">
          <CategoryTable
            categories={data?.content ?? []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            toggleSelectOne={toggleSelectOne}
            toggleSelectAll={toggleSelectAll}
          />
          <Pagination
            currentPage={data?.number ?? 0}
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
