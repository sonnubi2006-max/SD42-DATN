import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmModal from "@/components/ConfirmModal";
import { CustomerToolbar } from "@/components/customer/CustomerToolbar";
import type { ExportScope } from "@/components/customer/CustomerToolbar";
import { CustomerTable } from "@/components/customer/CustomerTable";
import { CustomerAddressDialog } from "@/components/customer/CustomerAddressDialog";
import { useCustomerList, useSetCustomerStatus } from "@/hooks/useCustomer";
import { useDebounce } from "@/hooks/useDebounce";
import { customerApi } from "@/api/customerApi";
import type { CustomerResponse, CustomerStatus } from "@/api/customerApi";
import { exportCustomersToExcel } from "@/utils/exportCustomerExcel";
import Pagination from "@/components/Pagination";

export default function CustomerPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const keyword = params.get("keyword") ?? "";
  const direction = params.get("direction") ?? "desc";
  const status = (params.get("status") as CustomerStatus | null) ?? null;
  const page = Number(params.get("page") ?? 0);
  const size = Number(params.get("size") ?? 10);

  const [searchInput, setSearchInput] = useState(keyword);
  const debounced = useDebounce(searchInput, 500);

  useEffect(() => {
    if (debounced !== keyword) {
      updateParams({ keyword: debounced || null, page: null });
    }

  }, [debounced]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setParams(next, { replace: true });
  }

  const { data, isLoading } = useCustomerList({
    keyword: keyword || undefined,
    status: status || undefined,
    page,
    size,
    sort: "createdAt",
    direction: direction === "asc" ? "asc" : "desc",
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const rowCache = useRef<Map<number, CustomerResponse>>(new Map());
  useEffect(() => {
    data?.content.forEach((c) => rowCache.current.set(c.customerId, c));
  }, [data]);

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  };

  const togglePage = (ids: number[], checked: boolean) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });

  const [addressOf, setAddressOf] = useState<CustomerResponse | null>(null);

  const [statusTarget, setStatusTarget] = useState<CustomerResponse | null>(
    null,
  );
  const { mutate: setStatusMut, isPending: statusPending } =
    useSetCustomerStatus();

  const confirmToggleStatus = () => {
    if (!statusTarget) return;
    const next: CustomerStatus =
      statusTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatusMut(
      { id: statusTarget.customerId, status: next },
      {
        onSuccess: () => {
          toast.success("Cập nhật trạng thái thành công");
          setStatusTarget(null);
        },
        onError: (err: any) =>
          toast.error(err?.apiMessage ?? "Thao tác thất bại"),
      },
    );
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async (scope: ExportScope) => {
    try {
      setExporting(true);
      let rows: CustomerResponse[] = [];

      if (scope === "selected") {
        rows = [...selectedIds]
          .map((id) => rowCache.current.get(id))
          .filter((c): c is CustomerResponse => Boolean(c));
        if (rows.length === 0) {
          toast.error("Chưa chọn khách hàng nào");
          return;
        }
      } else if (scope === "filtered") {
        const res = await customerApi.getList({
          keyword: keyword || undefined,
          status: status ?? undefined,
          page: 0,
          size: data?.totalElements || 1000,
          sort: "customerId",
          direction: "desc",
        });
        rows = res.content;
      } else {
        const res = await customerApi.getList({
          page: 0,
          size: 100000,
          sort: "customerId",
          direction: "desc",
        });
        rows = res.content;
      }

      exportCustomersToExcel(rows);
      toast.success(`Đã xuất ${rows.length} khách hàng`);
    } catch (err: any) {
      toast.error(err?.apiMessage ?? "Xuất Excel thất bại");
    } finally {
      setExporting(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Quản lý khách hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Khách online & khách mua tại quầy
          </p>
        </div>
        <Button size="lg" onClick={() => navigate("/customers/create")}>
          <Plus className="mr-2 h-4 w-4" /> Thêm khách hàng
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <CustomerToolbar
            search={searchInput}
            direction={direction}
            onSearchChange={setSearchInput}
            status={status}
            onStatusChange={(v) => updateParams({ status: v, page: null })}
            onDirectionChange={(v) => updateParams({ direction: v, page: null })}
            onReset={() => {
              setSearchInput("");
              setParams(new URLSearchParams(), { replace: true });
            }}
            selectedCount={selectedCount}
            exporting={exporting}
            onExport={handleExport}
          />

          <CustomerTable
            data={data?.content ?? []}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleOne={toggleOne}
            onTogglePage={togglePage}
            onViewAddresses={setAddressOf}
            onEdit={(c) => navigate(`/customers/${c.customerId}/edit`)}
            onToggleStatus={setStatusTarget}
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

      <CustomerAddressDialog
        customerId={addressOf?.customerId ?? null}
        customerName={addressOf?.fullName}
        open={addressOf != null}
        onOpenChange={(o) => !o && setAddressOf(null)}
      />

      {statusTarget && (
        <ConfirmModal
          typeConfirm="UPDATE"
          message={
            statusTarget.status === "ACTIVE"
              ? `Ngừng hoạt động khách "${statusTarget.fullName ?? statusTarget.email ?? statusTarget.customerId}"?`
              : `Kích hoạt lại khách "${statusTarget.fullName ?? statusTarget.email ?? statusTarget.customerId}"?`
          }
          onConfirm={confirmToggleStatus}
          onCancel={() => setStatusTarget(null)}
          isPending={statusPending}
        />
      )}
    </div>
  );
}
