import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useUserList,
  useUpdateUserStatus,
  useExportUsers,
} from "@/hooks/useUser";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Plus, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserToolbar } from "@/components/user/UserToolbar";
import { UserTable } from "@/components/user/UserTable";
import type { UserListParams, UserRole, UserStatus } from "@/api/userApi";
import Pagination from "@/components/Pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getStr(params: URLSearchParams, key: string, fallback = "") {
  return params.get(key) ?? fallback;
}

function getNum(params: URLSearchParams, key: string, fallback: number) {
  const v = params.get(key);
  return v != null ? Number(v) : fallback;
}

export default function UserPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = getStr(searchParams, "keyword");
  const urlStatus = getStr(searchParams, "status") as UserStatus | null;
  const urlRole = getStr(searchParams, "role") as UserRole | null;
  const urlDirection = getStr(searchParams, "direction", "desc") as
    | "asc"
    | "desc";
  const urlPage = getNum(searchParams, "page", 0);
  const urlSize = getNum(searchParams, "size", 10);

  const [searchInput, setSearchInput] = useState(urlKeyword);

  const debouncedSearch = useDebounce(searchInput, 500);

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

  const queryParams: UserListParams = {
    page: urlPage,
    size: urlSize,
    sort: `createdAt,${urlDirection}`,
    status: urlStatus,
    role: urlRole,
    keyword: debouncedSearch || undefined,
  };

  const { data, isLoading } = useUserList(queryParams);
  const { mutate: updateStatus } = useUpdateUserStatus();
  const exportMutation = useExportUsers();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleStatusChange = (id: number) => {
    updateStatus(
      { id },
      {
        onSuccess: () => toast.success("Cập nhật trạng thái thành công"),
        onError: (err: any) =>
          toast.error(err?.apiMessage ?? "Thao tác thất bại"),
      },
    );
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handleExport = (type: "selected" | "filtered" | "all") => {
    const ids = type === "selected" ? Array.from(selectedIds) : undefined;
    const params =
      type === "all"
        ? {}
        : {
            keyword: debouncedSearch || undefined,
            status: urlStatus,
            role: urlRole,
          };
    exportMutation.mutate({ params, ids });
  };

  const togglePage = (ids: number[], checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Quản lý người dùng
          </h1>
          <p className=" text-muted-foreground mt-0.5">
            Quản lý tài khoản và phân quyền
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Download size={14} /> Xuất Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44">
              <DropdownMenuItem
                onClick={() => handleExport("selected")}
                disabled={selectedIds.size === 0}
              >
                Người dùng đã chọn
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("filtered")}>
                Theo bộ lọc hiện tại
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("all")}>
                Tất cả người dùng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="lg" onClick={() => navigate("/users/create")}>
            <Plus className="mr-2 h-4 w-4" /> Thêm nhân viên
          </Button>
        </div>
      </div>

      {}
      <Card>
        <CardContent className="p-0">
          <UserToolbar
            search={searchInput}
            onSearchChange={(v) => setSearchInput(v)}
            direction={urlDirection}
            onDirectionChange={(v) => updateParams({ direction: v })}
            status={urlStatus}
            onStatusChange={(v) =>
              updateParams({ status: v || null, page: null })
            }
            role={urlRole}
            onRoleChange={(v) => updateParams({ role: v || null, page: null })}
            onResetFilters={handleResetFilters}
            onExport={handleExport}
            hasSelection={selectedIds.size > 0}
          />

          <UserTable
            data={data?.content ?? []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onStatusChange={handleStatusChange}
            onTogglePage={togglePage}
            onToggleOne={toggleOne}
          />

          <Pagination
            currentPage={data?.number ?? 1}
            totalPages={data?.totalPages ?? 1}
            totalElements={data?.totalElements ?? 0}
            first={data?.first ?? false}
            last={data?.last ?? false}
            onPageChange={(v) => updateParams({ page: v.toString() })}
            onChangeSize={(v) =>
              updateParams({ size: v.toString(), page: null })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
