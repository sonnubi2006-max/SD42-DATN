import { useState } from "react";
import {
  useBannerList,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useBannerStatistics,
} from "../hooks/useBanner";
import type { Banner, BannerParams } from "../api/bannerApi";
import type { ModalMode } from "@/components/banner/BannerModal";
import BannerModal from "@/components/banner/BannerModal";
import ConfirmModal from "@/components/ConfirmModal";
import { Edit, Plus, Trash, Search, RefreshCw } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 shadow-xs">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Hoạt động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Tạm dừng
    </span>
  );
}

interface BannerForm {
  title: string;
  redirectUrl: string;
  startDate: Date;
  endDate: Date;
  file: File | null;
  isActive?: boolean;
}

export default function BannerPage() {
  const [params, setParams] = useState<BannerParams>({
    page: 0,
    size: 10,
    sort: "bannerId",
    direction: "desc",
    keyword: "",
    isActive: undefined,
  });
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const queryParams = { ...params, keyword: debouncedSearch };

  const { data, isLoading } = useBannerList(queryParams);
  const { data: stats, refetch: refetchStats } = useBannerStatistics();

  const { mutate: create, isPending: isCreating } = useCreateBanner();
  const { mutate: update, isPending: isUpdating } = useUpdateBanner();
  const { mutate: remove, isPending: isDeleting } = useDeleteBanner();

  const openCreate = () => {
    setEditing(null);
    setModalMode("create");
  };
  const openEdit = (banner: Banner) => {
    setEditing(banner);
    setModalMode("edit");
  };
  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
  };

  const handleSubmit = (form: BannerForm) => {
    if (modalMode === "create") {
      create(
        {
          title: form.title,
          redirectUrl: form.redirectUrl,
          startDate: form.startDate,
          endDate: form.endDate,
          file: form.file!,
        },
        {
          onSuccess: () => {
            toast.success("Tạo banner thành công");
            refetchStats();
            closeModal();
          },
          onError: (error: any) => {
            toast.error(error?.apiMessage ?? "Tạo thất bại");
          },
        },
      );
    } else if (editing) {
      update(
        {
          id: editing.bannerId,
          payload: {
            title: form.title,
            redirectUrl: form.redirectUrl,
            startDate: form.startDate,
            endDate: form.endDate,
            isActive: form.isActive,
            file: form.file ?? undefined,
          },
        },
        {
          onSuccess: () => {
            toast.success("Cập nhật banner thành công");
            refetchStats();
            closeModal();
          },
          onError: (error: any) => {
            toast.error(error?.apiMessage ?? "Cập nhật thất bại");
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove(deleting.bannerId, {
      onSuccess: () => {
        toast.success("Xoá banner thành công");
        refetchStats();
        setDeleting(null);
      },
      onError: (error: any) => {
        toast.error(error?.apiMessage ?? "Xoá thất bại");
      },
    });
  };

  const handleResetFilters = () => {
    setSearch("");
    setParams({
      page: 0,
      size: 10,
      sort: "bannerId",
      direction: "desc",
      keyword: "",
      isActive: undefined,
    });
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString("vi-VN");

  return (
    <div className="space-y-6">
      { }
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Ảnh quảng cáo
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý toàn bộ các banner hiển thị trên slideshow trang chủ Storefront
          </p>
        </div>
        <Button size="lg" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm banner
        </Button>
      </div>

      { }
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tổng banner" value={stats?.totalBanners ?? 0} />
        <StatCard
          label="Đang hoạt động"
          value={stats?.activeBanners ?? 0}
          color="text-emerald-600"
        />
        <StatCard
          label="Tạm dừng"
          value={stats?.inactiveBanners ?? 0}
          color="text-rose-500"
        />
      </div>

      { }
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base font-semibold">
            Tìm kiếm & Bộ lọc
            <div className="flex flex-wrap items-center gap-2 font-normal">
              { }
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setParams((p) => ({ ...p, page: 0 }));
                  }}
                  placeholder="Tìm kiếm tiêu đề..."
                  className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              { }
              <select
                value={params.isActive === undefined ? "" : params.isActive.toString()}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    isActive:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                    page: 0,
                  }))
                }
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="true">Đang hoạt động</option>
                <option value="false">Tạm dừng</option>
              </select>

              { }
              <select
                value={params.direction}
                onChange={(e) =>
                  setParams((p) => ({
                    ...p,
                    direction: e.target.value as "asc" | "desc",
                  }))
                }
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Mới nhất</option>
                <option value="asc">Cũ nhất</option>
              </select>

              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Khởi tạo lại
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 min-h-40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-24">Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Đường dẫn chuyển hướng</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Kết thúc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-16 text-slate-400 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-16 text-slate-400 text-sm"
                  >
                    {search ? `Không tìm thấy kết quả cho "${search}"` : "Chưa có banner nào được khởi tạo"}
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((banner, index) => (
                  <TableRow
                    key={banner.bannerId}
                    className="hover:bg-slate-50 transition group"
                  >
                    <TableCell className=" text-xs text-slate-400">
                      #{String(banner.bannerId).padStart(3, "0")}
                    </TableCell>
                    <TableCell>
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-16 h-9 object-cover rounded border border-slate-100 bg-slate-50"
                        />
                      ) : (
                        <div className="w-16 h-9 rounded bg-slate-100 border border-slate-200" />
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {banner.title}
                    </TableCell>
                    <TableCell className=" text-xs text-slate-500 max-w-48 truncate">
                      {banner.redirectUrl || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {formatDate(banner.startDate)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {formatDate(banner.endDate)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge isActive={banner.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(banner)}
                          className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(banner)}
                          className="h-8 w-8 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Xoá"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="py-3 border-t border-slate-100 bg-slate-50/50">
          {data && data.totalPages > 1 && (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Trang {data.number + 1} / {data.totalPages} — {data.totalElements}{" "}
                banner
              </span>
              <div className="flex items-center gap-1">
                <Button
                  disabled={data.first}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 0) - 1 }))
                  }
                  className="text-xs h-8 px-2.5 cursor-pointer"
                >
                  ← Trước
                </Button>
                {Array.from({ length: data.totalPages }, (_, i) => (
                  <Button
                    key={i}
                    onClick={() => setParams((p) => ({ ...p, page: i }))}
                    variant={data.number === i ? "default" : "outline"}
                    className={`w-8 h-8 p-0 text-xs cursor-pointer`}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  disabled={data.last}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 0) + 1 }))
                  }
                  className="text-xs h-8 px-2.5 cursor-pointer"
                >
                  Sau →
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      { }
      <BannerModal
        mode={modalMode}
        initial={editing ?? undefined}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />

      {deleting && (
        <ConfirmModal
          typeConfirm="DELETE"
          message={deleting.bannerId.toString()}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
