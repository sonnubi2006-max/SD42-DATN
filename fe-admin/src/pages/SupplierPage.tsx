

import { useState } from "react";
import {
  useSupplierList,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  useSupplierStatistics,
} from "../hooks/useSupplier";
import type {
  Supplier,
  SupplierParams,
  SupplierStatus,
} from "../api/supplierApi";
import type { ModalMode } from "@/components/supplier/SupplierModal";
import SupplierModal from "@/components/supplier/SupplierModal";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import ConfirmModal from "@/components/ConfirmModal";
import { Badge } from "@/components/ui/badge";

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
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-medium ${color ?? "text-gray-900"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
export default function SupplierPage() {
  const [params, setParams] = useState<SupplierParams>({
    page: 0,
    size: 10,
    sort: "supplierId",
    direction: "desc",
    status: null,
  });
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useSupplierList({
    ...params,
    keyword: debouncedSearch,
  });
  const { data: stats } = useSupplierStatistics();
  const { mutate: create, isPending: isCreating } = useCreateSupplier();
  const { mutate: update, isPending: isUpdating } = useUpdateSupplier();
  const { mutate: remove, isPending: isDeleting } = useDeleteSupplier();

  const openCreate = () => {
    setEditing(null);
    setModalMode("create");
  };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setModalMode("edit");
  };
  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
  };

  const handleSubmit = (form: {
    supplierName: string;
    address: string;
    phone: string;
    email: string;
    status?: SupplierStatus;
  }) => {
    if (modalMode === "create") {
      create(
        {
          supplierName: form.supplierName,
          address: form.address,
          phone: form.phone,
          email: form.email,
        },
        {
          onSuccess: () => {
            toast.success("Tạo nhà cung cấp thành công");
            closeModal();
          },
          onError: (e: any) => toast.error(e?.apiMessage ?? "Tạo thất bại"),
        },
      );
    } else if (editing) {
      update(
        { id: editing.supplierId, payload: form },
        {
          onSuccess: () => {
            toast.success("Cập nhật thành công");
            closeModal();
          },
          onError: (e: any) =>
            toast.error(e?.apiMessage ?? "Cập nhật thất bại"),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove(deleting.supplierId, {
      onSuccess: () => {
        toast.success("Xoá thành công");
        setDeleting(null);
      },
      onError: (e: any) => toast.error(e?.apiMessage ?? "Xoá thất bại"),
    });
  };

  return (
    <div className="space-y-6">
      { }
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Nhà cung cấp</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý toàn bộ nhà cung cấp sản phẩm
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" size={"lg"}>
          <Plus size={16} /> Thêm nhà cung cấp
        </Button>
      </div>

      { }
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Tổng nhà cung cấp"
          value={stats?.totalSuppliers ?? 0}
        />
        <StatCard
          label="Đang hoạt động"
          value={stats?.activeSuppliers ?? 0}
          color="text-green-600"
        />
        <StatCard
          label="Tạm dừng"
          value={stats?.inactiveSuppliers ?? 0}
          color="text-red-500"
        />
      </div>

      { }
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Danh sách nhà cung cấp
            </span>
            <div className="flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setParams((p) => ({ ...p, page: 0 }));
                }}
                placeholder="Tìm kiếm..."
                className="w-48 h-9 text-sm"
              />

              <Select
                value={params.status ?? "ALL"}
                onValueChange={(v) =>
                  setParams((p) => ({
                    ...p,
                    status: v === "ALL" ? null : (v as SupplierStatus),
                    page: 0,
                  }))
                }
              >
                <SelectTrigger className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={params.direction ?? "desc"}
                onValueChange={(v) =>
                  setParams((p) => ({ ...p, direction: v as "asc" | "desc" }))
                }
              >
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mới nhất</SelectItem>
                  <SelectItem value="asc">Cũ nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                {[
                  "ID",
                  "Tên nhà cung cấp",
                  "Email",
                  "Số điện thoại",
                  "Địa chỉ",
                  "Trạng thái",
                  "",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="text-xs font-medium text-gray-400 uppercase tracking-wide"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    {search
                      ? `Không tìm thấy "${search}"`
                      : "Chưa có nhà cung cấp nào"}
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((supplier) => (
                  <TableRow
                    key={supplier.supplierId}
                    className="group hover:bg-gray-50"
                  >
                    <TableCell className=" text-xs text-gray-400">
                      #{String(supplier.supplierId).padStart(3, "0")}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {supplier.supplierName}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {supplier.email}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {supplier.phone}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[180px] truncate">
                      {supplier.address}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={supplier.status ? "success" : "destructive"}
                        className="p-3"
                      >
                        {supplier.status ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openEdit(supplier)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => setDeleting(supplier)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          { }
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-400">
                Trang {(data.number ?? 0) + 1} / {data.totalPages} —{" "}
                {data.totalElements} nhà cung cấp
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={data.first}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 0) - 1 }))
                  }
                >
                  ← Trước
                </Button>
                {Array.from(
                  { length: Math.min(data.totalPages, 5) },
                  (_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={data.number === i ? "default" : "outline"}
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setParams((p) => ({ ...p, page: i }))}
                    >
                      {i + 1}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  disabled={data.last}
                  onClick={() =>
                    setParams((p) => ({ ...p, page: (p.page ?? 0) + 1 }))
                  }
                >
                  Sau →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      { }
      <SupplierModal
        key={editing?.supplierId ?? "create"}
        mode={modalMode}
        initial={editing ?? undefined}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isPending={isCreating || isUpdating}
      />

      {deleting && (
        <ConfirmModal
          typeConfirm="DELETE"
          message={deleting?.supplierName}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
