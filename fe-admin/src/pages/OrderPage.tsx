import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useOrderList } from "@/hooks/useOrder";
import {
  type OrderStatus,
  type OrderSearchParams,
  type PaymentMethod,
  type OrderResponse,
  orderApi,
  ORDER_MANAGEMENT_STATUSES,
  ORDER_STATUS_LABEL,
} from "@/api/orderApi";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import {
  Search,
  Eye,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  X,
  CheckCircle2,
  Truck,
  Check,
  Layers,
  Loader2,
  QrCode,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportOrdersToExcel } from "@/utils/exportOrderExcel";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import Pagination from "@/components/Pagination";
import OrderBulkStatusModal from "@/components/order/OrderBulkStatusModal";
import { cn } from "@/lib/utils";

function getStr(searchParams: URLSearchParams, key: string, fallback = "") {
  return searchParams.get(key) ?? fallback;
}

function getNum(searchParams: URLSearchParams, key: string, fallback: number) {
  const v = searchParams.get(key);
  return v != null ? Number(v) : fallback;
}

export default function OrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlKeyword = getStr(searchParams, "keyword");
  const urlStatus =
    (searchParams.get("status") as OrderStatus | "ALL" | null) ?? "ALL";
  const urlOrderType =
    (searchParams.get("orderType") as
      | "ONLINE"
      | "POS"
      | "POS_SHIP"
      | "ALL"
      | null) ?? "ALL";
  const urlPaymentMethod =
    (searchParams.get("paymentMethod") as PaymentMethod | "ALL" | null) ??
    "ALL";
  const urlFromDate = getStr(searchParams, "fromDate");
  const urlToDate = getStr(searchParams, "toDate");
  const urlPage = getNum(searchParams, "page", 0);
  const urlSize = getNum(searchParams, "size", 10);

  const [filtersOpen, setFiltersOpen] = useState(true);

  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkConfirmModalOpen, setBulkConfirmModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [bulkNote, setBulkNote] = useState("");

  const [qrModalOpen, setQrModalOpen] = useState(false);

  const filterCount = [
    urlOrderType !== "ALL",
    urlPaymentMethod !== "ALL",
    urlFromDate !== "",
    urlToDate !== "",
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearch("");
    updateParams({
      keyword: null,
      orderType: null,
      paymentMethod: null,
      fromDate: null,
      toDate: null,
      page: null,
    });
  };

  const [search, setSearch] = useState(urlKeyword);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    if (debouncedSearch !== urlKeyword) {
      updateParams({ keyword: debouncedSearch || null, page: null });
    }

  }, [debouncedSearch]);

  useEffect(() => {
    setSearch(urlKeyword);
  }, [urlKeyword]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "" || v === "ALL") next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
    setSelectedOrderIds([]);
  }

  const queryParams: OrderSearchParams = {
    keyword: urlKeyword || undefined,
    status: urlStatus === "ALL" ? undefined : urlStatus,
    orderType: urlOrderType === "ALL" ? undefined : urlOrderType,
    paymentMethod: urlPaymentMethod === "ALL" ? undefined : urlPaymentMethod,
    fromDate: urlFromDate ? `${urlFromDate}T00:00:00` : undefined,
    toDate: urlToDate ? `${urlToDate}T23:59:59` : undefined,
    page: urlPage,
    size: urlSize,
  };

  const {
    data: orderPage,
    isLoading,
    refetch,
    isFetching,
  } = useOrderList(queryParams);

  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Làm mới dữ liệu thành công!");
    } catch {
      toast.error("Có lỗi xảy ra khi tải lại dữ liệu.");
    }
  };

  const handleExportExcel = async (scope: "selected" | "filtered" | "all") => {
    try {
      setIsExporting(true);
      let rows: OrderResponse[] = [];

      if (scope === "selected") {
        if (selectedOrderIds.length === 0) {
          toast.error("Chưa chọn đơn hàng nào");
          return;
        }
        rows = currentOrders.filter((o) =>
          selectedOrderIds.includes(o.orderId),
        );
      } else if (scope === "filtered") {
        const res = await orderApi.getAll({
          ...queryParams,
          page: 0,
          size: 100000,
        });
        rows = res.content.filter((o) => o.status !== "DRAFT");
      } else {
        const res = await orderApi.getAll({
          page: 0,
          size: 100000,
        });
        rows = res.content.filter((o) => o.status !== "DRAFT");
      }

      if (rows.length === 0) {
        toast.info("Không có dữ liệu đơn hàng để xuất");
        return;
      }

      exportOrdersToExcel(rows);
      toast.success(`Đã xuất ${rows.length} đơn hàng ra file Excel`);
    } catch {
      toast.error("Xuất Excel thất bại");
    } finally {
      setIsExporting(false);
    }
  };

  const currentOrders =
    orderPage?.content.filter((o) => o.status !== "DRAFT") ?? [];

  const selectedStatus = currentOrders.find((order) =>
    selectedOrderIds.includes(order.orderId),
  )?.status;
  const selectableCurrentOrders = selectedStatus
    ? currentOrders.filter((order) => order.status === selectedStatus)
    : currentOrders;

  const allSelected =
    selectableCurrentOrders.length > 0 &&
    selectableCurrentOrders.every((o) => selectedOrderIds.includes(o.orderId));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrderIds([]);
    } else {
      const referenceStatus = selectedStatus ?? currentOrders[0]?.status;
      if (!referenceStatus) return;
      const compatibleOrders = currentOrders.filter(
        (order) => order.status === referenceStatus,
      );
      const incompatibleCount = currentOrders.length - compatibleOrders.length;
      setSelectedOrderIds(compatibleOrders.map((order) => order.orderId));
      if (incompatibleCount > 0) {
        toast.warning(
          `Chỉ chọn ${compatibleOrders.length} đơn ở trạng thái "${getStatusLabel(referenceStatus)}". Đã bỏ qua ${incompatibleCount} đơn khác trạng thái.`,
        );
      }
    }
  };

  const toggleSelectOrder = (order: OrderResponse) => {
    if (selectedOrderIds.includes(order.orderId)) {
      setSelectedOrderIds((current) =>
        current.filter((item) => item !== order.orderId),
      );
      return;
    }
    if (selectedStatus && order.status !== selectedStatus) {
      toast.error(
        `Chỉ được chọn các đơn cùng trạng thái "${getStatusLabel(selectedStatus)}". Đơn ${order.orderCode} đang ở trạng thái "${getStatusLabel(order.status)}".`,
      );
      return;
    }
    setSelectedOrderIds((current) => [...current, order.orderId]);
  };

  const handleOpenBulkConfirm = (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một đơn hàng");
      return;
    }
    setTargetStatus(status);
    setBulkNote("");
    setBulkConfirmModalOpen(true);
  };

  const handleExecuteBulkUpdate = async () => {
    if (!targetStatus || selectedOrderIds.length === 0) return;
    setBulkUpdating(true);
    try {
      const res = await orderApi.bulkUpdateStatus({
        orderIds: selectedOrderIds,
        status: targetStatus,
        note: bulkNote.trim() || undefined,
      });

      setBulkConfirmModalOpen(false);
      setSelectedOrderIds([]);

      if (res.successCount === 0) {
        toast.error(
          `Cập nhật thất bại! Cả ${res.failedCount} đơn hàng không thể chuyển trạng thái. Chi tiết: ${res.errorMessages[0] || "không đúng quy trình"}`,
        );
      } else if (res.failedCount > 0) {
        toast.warning(
          `Cập nhật thành công ${res.successCount} đơn. Thất bại ${res.failedCount} đơn (do không đúng quy trình). Chi tiết đơn lỗi: ${res.errorMessages[0] || ""}`,
        );
      } else {
        toast.success(
          `Cập nhật trạng thái "${getStatusLabel(targetStatus)}" thành công cho ${res.successCount} đơn hàng!`,
        );
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch {
      toast.error(
        "Có lỗi xảy ra khi chuyển trạng thái hàng loạt. Vui lòng thử lại!",
      );
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return ORDER_STATUS_LABEL[status] || status;
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    const map: Record<string, string> = {
      WAITING_PAYMENT:
        "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
      DRAFT: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100",
      PENDING:
        "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
      WAITING_STOCK:
        "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
      PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-50",
      SHIPPING:
        "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50",
      RETURNING:
        "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
      RETURNED_TO_SHOP:
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
      CANCELED_BY_DAMAGED:
        "bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-100",
      FAILED_DELIVERY:
        "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
      COMPLETED:
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
      CANCELLED: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
      REFUNDED:
        "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
    };
    return map[status] || "bg-gray-50 text-gray-700";
  };

  const getPayment = (payment: PaymentMethod) => {
    const map: Record<PaymentMethod, string> = {
      CASH: "Tiền mặt",
      BANK_TRANSFER: "Chuyển khoản",
      COD: "Thanh toán khi nhận hàng",
      MOMO: "Momo",
      VNPAY: "VNPay",
    };
    return map[payment] || payment;
  };

  return (
    <div className="space-y-6 pb-24">
      { }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Quản lý Đơn hàng
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Xử lý và theo dõi quá trình thực hiện đơn hàng của khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          { }
          <Button
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
            variant="outline"
            className="border-gray-250 bg-white hover:bg-gray-50 text-gray-700 font-semibold h-10 px-4 text-xs gap-2 rounded-xl shadow-sm cursor-pointer"
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                (isLoading || isFetching) && "animate-spin",
              )}
            />
            Tải lại
          </Button>

          { }
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isExporting}
                className="border-emerald-250 bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-700 font-semibold h-10 px-4 text-xs gap-2 rounded-xl shadow-sm cursor-pointer"
              >
                <Download size={15} />
                {isExporting ? "Đang xuất…" : "Xuất Excel"}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                disabled={selectedOrderIds.length === 0}
                onClick={() => handleExportExcel("selected")}
              >
                Đơn hàng đã chọn ({selectedOrderIds.length})
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel("filtered")}>
                Theo bộ lọc hiện tại
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportExcel("all")}>
                Tất cả đơn hàng
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          { }
          <Button
            onClick={() => setQrModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-4 text-xs gap-2 rounded-xl shadow-sm cursor-pointer"
          >
            <QrCode size={16} />
            Quét mã QR đơn hàng
          </Button>

          { }
          <Button
            onClick={() => {
              if (selectedOrderIds.length === 0) {
                toast.info(
                  "Vui lòng tích chọn các đơn hàng trên bảng hoặc dùng Quét QR!",
                );
                setQrModalOpen(true);
              } else {
                handleOpenBulkConfirm("CONFIRMED");
              }
            }}
            variant="outline"
            className="border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 font-bold h-10 px-4 text-xs gap-2 rounded-xl shadow-sm cursor-pointer"
          >
            <Layers size={16} />
            Chuyển trạng thái hàng loạt{" "}
            {selectedOrderIds.length > 0 && `(${selectedOrderIds.length})`}
          </Button>
        </div>
      </div>

      { }
      <Card className="shadow-sm">
        { }
        <div className="border-b border-gray-100 px-6 pt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              "ALL",
              ...ORDER_MANAGEMENT_STATUSES,
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                updateParams({ status: tab, page: null });
              }}
              className={`pb-3 text-sm font-medium border-b-2 px-3 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${urlStatus === tab
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
            >
              {tab === "ALL" ? "Tất cả đơn" : getStatusLabel(tab)}
            </button>
          ))}
        </div>

        { }
        <div className="p-5 space-y-4 border-b">
          { }
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm mã đơn hàng, tên hoặc SĐT khách..."
                className="pl-9 text-xs h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={filtersOpen ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="gap-2 h-9 text-xs border-gray-200 font-medium cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                Bộ lọc nâng cao
                {filterCount > 0 && (
                  <Badge className="ml-0.5 size-4 p-0 flex items-center justify-center rounded-full text-[10px] bg-blue-600 text-white">
                    {filterCount}
                  </Badge>
                )}
                {filtersOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </Button>

              {filterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-1.5 h-9 text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  Làm mới bộ lọc
                </Button>
              )}
            </div>
          </div>

          { }
          {filtersOpen && (
            <div className="rounded-xl border border-gray-150 bg-gray-50/50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                { }
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Loại đơn hàng
                  </label>
                  <Select
                    value={urlOrderType}
                    onValueChange={(val) =>
                      updateParams({
                        orderType: val === "ALL" ? null : val,
                        page: null,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue placeholder="Tất cả loại đơn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả loại đơn</SelectItem>
                      <SelectItem value="ONLINE">Trực tuyến</SelectItem>
                      <SelectItem value="POS">Tại quầy</SelectItem>
                      <SelectItem value="POS_SHIP">
                        Tại quầy - Giao hàng
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                { }
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Phương thức thanh toán
                  </label>
                  <Select
                    value={urlPaymentMethod}
                    onValueChange={(val) =>
                      updateParams({
                        paymentMethod: val === "ALL" ? null : val,
                        page: null,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs bg-white border-gray-200">
                      <SelectValue placeholder="Tất cả PT thanh toán" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tất cả PT thanh toán</SelectItem>
                      <SelectItem value="CASH">Tiền mặt</SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        Chuyển khoản
                      </SelectItem>
                      <SelectItem value="COD">Thanh toán khi nhận hàng</SelectItem>
                      <SelectItem value="MOMO">Momo</SelectItem>
                      <SelectItem value="VNPAY">VNPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                { }
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={urlFromDate}
                    onChange={(e) =>
                      updateParams({
                        fromDate: e.target.value || null,
                        page: null,
                      })
                    }
                    className="h-9 text-xs bg-white border-gray-200 font-normal"
                  />
                </div>

                { }
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={urlToDate}
                    onChange={(e) =>
                      updateParams({
                        toDate: e.target.value || null,
                        page: null,
                      })
                    }
                    className="h-9 text-xs bg-white border-gray-200 font-normal"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        { }
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-10 px-4 py-3 border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 accent-blue-600 size-4 cursor-pointer"
                  />
                </TableHead>
                {[
                  "STT",
                  "Mã đơn hàng",
                  "Khách hàng",
                  "Số điện thoại",
                  "Ngày đặt hàng",
                  "PT. Thanh toán",
                  "Loại đơn",
                  "Tổng tiền",
                  "Trạng thái",
                  "",
                ].map((header) => (
                  <TableHead
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 h-auto"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-20 text-gray-400 text-sm"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Đang tải danh sách đơn hàng...
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="text-center py-20 text-gray-400 text-sm"
                  >
                    Chưa có đơn hàng nào khớp với bộ lọc
                  </TableCell>
                </TableRow>
              ) : (
                currentOrders.map((order, i) => {
                  const isSelected = selectedOrderIds.includes(order.orderId);
                  return (
                    <TableRow
                      key={order.orderId}
                      className={cn(
                        "transition group",
                        isSelected
                          ? "bg-blue-50/40 hover:bg-blue-50/60"
                          : "hover:bg-gray-50",
                      )}
                    >
                      <TableCell className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order)}
                          className="rounded border-gray-300 accent-blue-600 size-4 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs text-gray-700 ">
                        {i + urlPage * urlSize + 1}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-semibold text-gray-900 ">
                        {order.orderCode}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-medium text-gray-900">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-gray-500  text-xs">
                        {order.customerPhone}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs text-gray-500 font-medium">
                        {getPayment(order.paymentMethod)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs text-gray-500 font-medium">
                        {order.orderType === "POS"
                          ? "Tại quầy"
                          : order.orderType === "POS_SHIP"
                            ? "Tại quầy - Giao hàng"
                            : "Trực tuyến"}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-bold text-blue-600">
                        {order.totalAmount.toLocaleString("vi-VN")}đ
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusBadgeVariant(order.status)}`}
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          onClick={() => navigate(`/orders/${order.orderId}`)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition rounded-full cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          { }
          <div className="pb-4">
            <Pagination
              currentPage={urlPage}
              totalPages={orderPage?.totalPages ?? 1}
              totalElements={orderPage?.totalElements ?? 0}
              first={orderPage?.first ?? false}
              last={orderPage?.last ?? false}
              onPageChange={(page) => updateParams({ page: String(page) })}
              onChangeSize={(size) =>
                updateParams({ size: String(size), page: null })
              }
            />
          </div>
        </CardContent>
      </Card>

      { }
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-full px-5 py-3 shadow-2xl flex flex-wrap items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 border border-gray-800">
          <div className="flex items-center gap-2 pr-3 border-r border-gray-700 text-xs font-semibold">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-500 text-white text-[11px] font-bold">
              {selectedOrderIds.length}
            </span>
            <span>Đơn được chọn</span>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-gray-400 hover:text-white transition ml-1 cursor-pointer"
              title="Xóa lựa chọn"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            { }
            <Button
              size="sm"
              onClick={() => setQrModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 rounded-full text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <QrCode size={13} />
              Mở Popup Quét QR / Đổi hàng loạt
            </Button>

            { }
            <Button
              size="sm"
              onClick={() => handleOpenBulkConfirm("CONFIRMED")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 rounded-full text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={13} />
              Xác nhận
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenBulkConfirm("SHIPPING")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 rounded-full text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Truck size={13} />
              Giao hàng
            </Button>

            <Button
              size="sm"
              onClick={() => handleOpenBulkConfirm("COMPLETED")}
              className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 rounded-full text-xs font-semibold gap-1.5 cursor-pointer"
            >
              <Check size={13} />
              Hoàn thành
            </Button>
          </div>
        </div>
      )}

      { }
      <Dialog
        open={bulkConfirmModalOpen}
        onOpenChange={setBulkConfirmModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Layers className="size-5 text-blue-600" />
              Xác nhận chuyển trạng thái hàng loạt
            </DialogTitle>
            <DialogDescription className="text-xs">
              Bạn có chắc chắn muốn chuyển trạng thái{" "}
              <span className="font-bold text-foreground">
                {selectedOrderIds.length} đơn hàng
              </span>{" "}
              đã chọn sang{" "}
              <span className="font-bold text-blue-600">
                "{targetStatus ? getStatusLabel(targetStatus) : ""}"
              </span>{" "}
              không?
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <label className="text-xs font-semibold text-gray-700">
              Ghi chú lý do / Vết xử lý (Không bắt buộc)
            </label>
            <textarea
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
              placeholder="Nhập ghi chú chung cho các đơn hàng này..."
              className="w-full min-h-[70px] p-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary bg-white text-gray-900"
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkConfirmModalOpen(false)}
              disabled={bulkUpdating}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              onClick={handleExecuteBulkUpdate}
              disabled={bulkUpdating}
              className="bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              {bulkUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Xác nhận chuyển {selectedOrderIds.length} đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      { }
      <OrderBulkStatusModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        initialSelectedOrders={currentOrders.filter((o) =>
          selectedOrderIds.includes(o.orderId),
        )}
        onSuccess={() => setSelectedOrderIds([])}
      />
    </div>
  );
}
