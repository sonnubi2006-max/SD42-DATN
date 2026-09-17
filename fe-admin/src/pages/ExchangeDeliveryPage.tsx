import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  PackageCheck,
  Search,
  Truck,
  User,
  UserCheck,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Plus,
  UploadCloud,
  RotateCcw,
  Ban,
  History,
  Eye,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Mail,
  type LucideIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { exchangeDeliveryApi, type ExchangeDeliveryResponse, type ExchangeDeliveryStatus } from "@/api/exchangeDeliveryApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import Pagination from "@/components/Pagination";
import { cn } from "@/lib/utils";

import { useOrderDetail } from "@/hooks/useOrder";
import { useCustomerAddresses, useCreateCustomerAddress } from "@/hooks/useCustomer";
import { AddressFormDialog } from "@/components/customer/AddressFormDialog";
import type { AddressRequest, AddressResponse } from "@/api/customerApi";
import { useDebounce } from "@/hooks/useDebounce";

const labels: Record<ExchangeDeliveryStatus, string> = {
  PREPARING: "Chờ giao",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  FAILED_DELIVERY: "Giao thất bại",
  RETURNING: "Đang chuyển hoàn",
  RETURNED_TO_SHOP: "Đã hoàn về shop",
  CANCELLED: "Đã hủy",
  CANCELED_BY_DAMAGED: "Hủy do hàng hỏng",
  FAILED: "Giao thất bại",
};

const badgeStyles: Record<ExchangeDeliveryStatus, string> = {
  PREPARING: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
  SHIPPING: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50",
  DELIVERED: "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
  FAILED_DELIVERY: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
  RETURNING: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50",
  RETURNED_TO_SHOP: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  CANCELLED: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
  CANCELED_BY_DAMAGED: "bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-100",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
};

const statusIcons: Record<ExchangeDeliveryStatus, LucideIcon> = {
  PREPARING: Clock,
  SHIPPING: Truck,
  DELIVERED: CheckCircle2,
  FAILED_DELIVERY: AlertCircle,
  RETURNING: RotateCcw,
  RETURNED_TO_SHOP: PackageCheck,
  CANCELLED: Ban,
  CANCELED_BY_DAMAGED: AlertCircle,
  FAILED: AlertCircle,
};

const transitionConfirmation: Partial<Record<ExchangeDeliveryStatus, {
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
}>> = {
  PREPARING: {
    title: "Xác nhận chuẩn bị giao lại",
    description: "Hệ thống sẽ kiểm tra tồn kho, cấp lại hàng và mở một lượt giao mới cho khách hàng.",
    actionLabel: "Chuẩn bị giao lại",
  },
  SHIPPING: {
    title: "Xác nhận bắt đầu giao hàng",
    description: "Xác nhận sản phẩm đổi đã được bàn giao để giao đến khách hàng.",
    actionLabel: "Bắt đầu giao",
  },
  DELIVERED: {
    title: "Xác nhận giao hàng thành công",
    description: "Chỉ xác nhận khi khách hàng đã nhận đủ sản phẩm đổi. Phiếu giao đổi sẽ được hoàn thành.",
    actionLabel: "Xác nhận đã giao",
  },
  RETURNED_TO_SHOP: {
    title: "Xác nhận hàng đã về shop",
    description: "Xác nhận sản phẩm giao đổi đã được chuyển hoàn về cửa hàng. Số lượng hợp lệ sẽ được hoàn lại kho.",
    actionLabel: "Xác nhận đã nhận hàng",
  },
  CANCELLED: {
    title: "Xác nhận hủy giao hàng đổi",
    description: "Phiếu giao hàng đổi sẽ bị hủy và số lượng hàng đang giữ sẽ được hoàn lại kho.",
    actionLabel: "Xác nhận hủy",
    destructive: true,
  },
};

export default function ExchangeDeliveryPage() {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);
  const [status, setStatus] = useState<ExchangeDeliveryStatus | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [editing, setEditing] = useState<ExchangeDeliveryResponse | null>(null);
  const [address, setAddress] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [note, setNote] = useState("");

  const [transitionTarget, setTransitionTarget] = useState<ExchangeDeliveryStatus | null>(null);
  const [confirmTransition, setConfirmTransition] = useState<ExchangeDeliveryStatus | null>(null);
  const [transitionReason, setTransitionReason] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [damagedQuantities, setDamagedQuantities] = useState<Record<number, number>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);

  const query = useQuery({
    queryKey: ["exchange-deliveries", status, debouncedKeyword, fromDate, toDate, page, pageSize],
    queryFn: () => exchangeDeliveryApi.getAll({
      status: status || undefined,
      keyword: debouncedKeyword || undefined,
      fromDate: fromDate ? `${fromDate}T00:00:00` : undefined,
      toDate: toDate ? `${toDate}T23:59:59` : undefined,
      page,
      size: pageSize,
    }),
  });

  const filterCount = [fromDate !== "", toDate !== ""].filter(Boolean).length;

  const resetFilters = () => {
    setKeyword("");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  const refreshData = async () => {
    await query.refetch();
    toast.success("Làm mới dữ liệu thành công!");
  };

  const { data: orderDetail } = useOrderDetail(editing?.orderId ?? null);
  const { data: customerAddresses, isLoading: customerAddressesLoading } = useCustomerAddresses(
    orderDetail?.customerId ?? 0,
    !!orderDetail?.customerId && !!editing,
  );
  const createAddressMutation = useCreateCustomerAddress();

  const update = useMutation({
    mutationFn: async ({ id, nextStatus, reason, files, damagedItems }: {
      id: number;
      nextStatus?: ExchangeDeliveryStatus;
      reason?: string;
      files?: File[];
      damagedItems?: { variantId: number; damagedQuantity: number }[];
    }) => {
      return exchangeDeliveryApi.update(id, {
        status: nextStatus,
        note: reason,
        damagedItems,
      }, files);
    },
    onSuccess: (updatedDelivery) => {
      toast.success("Đã cập nhật phiếu giao hàng đổi");
      setEditing(updatedDelivery);
      setTransitionTarget(null);
      setConfirmTransition(null);
      setEvidenceFiles([]);
      setTransitionReason("");
      qc.invalidateQueries({ queryKey: ["exchange-deliveries"] });
    },
    onError: (error: unknown) => toast.error((error as { apiMessage?: string })?.apiMessage ?? "Không thể cập nhật giao hàng"),
  });

  const openEdit = (item: ExchangeDeliveryResponse) => {
    setEditing(item);
    setAddress(item.deliveryAddress ?? "");
    setReceiverName(item.receiverName ?? "");
    setReceiverPhone(item.receiverPhone ?? "");
    setShippingFee(item.shippingFee ?? 0);
    setNote(item.note ?? "");
    setTransitionTarget(null);
    setEvidenceFiles([]);
    setTransitionReason("");
    setDamagedQuantities(Object.fromEntries(item.items.map((line) => [line.variantId, 0])));
    setSelectedAddressId(null);
  };

  const getFormattedAddressStr = (addr: AddressResponse) => [
    addr.streetAddress,
    addr.wardName || addr.ward,
    addr.districtName || addr.district,
    addr.provinceName || addr.province,
  ].filter(Boolean).join(", ");

  const handleAddAddress = (payload: AddressRequest) => {
    if (!orderDetail?.customerId) return;
    createAddressMutation.mutate(
      { id: orderDetail.customerId, payload },
      {
        onSuccess: (newAddr) => {
          toast.success("Đã thêm địa chỉ giao hàng mới");
          setIsAddAddressOpen(false);
          setReceiverName(newAddr.consigneeName ?? "");
          setReceiverPhone(newAddr.phone ?? "");
          setAddress(getFormattedAddressStr(newAddr));
          setSelectedAddressId(newAddr.addressId);
        },
        onError: () => toast.error("Không thể thêm địa chỉ"),
      },
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const getLatestHandler = (delivery: ExchangeDeliveryResponse) => {
    const history = delivery.history ?? [];
    const latestEvent = history.length ? history[history.length - 1] : null;
    return latestEvent?.createdByName || delivery.processedByName || "Hệ thống";
  };

  const nextStatuses: ExchangeDeliveryStatus[] = editing?.status === "PREPARING"
    ? ["SHIPPING", "CANCELLED", "CANCELED_BY_DAMAGED"]
    : editing?.status === "SHIPPING"
      ? ["DELIVERED", "FAILED_DELIVERY", "RETURNING", "CANCELED_BY_DAMAGED"]
      : editing?.status === "FAILED_DELIVERY" || editing?.status === "FAILED"
        ? ["SHIPPING", "RETURNING", "CANCELED_BY_DAMAGED"]
        : editing?.status === "RETURNING"
          ? ["RETURNED_TO_SHOP", "CANCELED_BY_DAMAGED"]
          : ["RETURNED_TO_SHOP", "CANCELLED", "CANCELED_BY_DAMAGED"].includes(editing?.status ?? "")
            ? ["PREPARING"] : [];

  const evidenceRequired = new Set<ExchangeDeliveryStatus>([
    "FAILED_DELIVERY", "RETURNING", "CANCELED_BY_DAMAGED",
  ]);

  const beginTransition = (next: ExchangeDeliveryStatus) => {
    if (!editing) return;
    if (evidenceRequired.has(next)) {
      setTransitionTarget(next);
      setTransitionReason("");
      setEvidenceFiles([]);
      return;
    }
    setConfirmTransition(next);
  };

  const submitConfirmedTransition = () => {
    if (!editing || !confirmTransition) return;
    const nextStatus = confirmTransition;
    setConfirmTransition(null);
    update.mutate({
      id: editing.exchangeDeliveryId,
      nextStatus,
      reason: nextStatus === "PREPARING"
        ? "Mở lại phiếu để chuẩn bị giao sản phẩm đổi cho khách hàng"
        : undefined,
    });
  };

  const confirmContent = confirmTransition
    ? transitionConfirmation[confirmTransition]
    : undefined;

  const problemConfirmationDescription = transitionTarget === "FAILED_DELIVERY"
    ? "Xác nhận lần giao không thành công. Lý do và ảnh bằng chứng sẽ được lưu vào lịch sử xử lý."
    : transitionTarget === "RETURNING"
      ? "Xác nhận bắt đầu chuyển hoàn sản phẩm về cửa hàng. Lý do và ảnh bằng chứng sẽ được lưu lại."
      : "Xác nhận hủy giao do hàng hỏng. Khai báo số lượng hỏng và ảnh bằng chứng sẽ được lưu vào lịch sử.";

  const submitProblemTransition = () => {
    if (!editing || !transitionTarget) return;
    if (!transitionReason.trim()) return toast.error("Vui lòng nhập lý do xử lý");
    if (!evidenceFiles.length) return toast.error("Vui lòng chọn ít nhất một ảnh bằng chứng");
    const damagedItems = transitionTarget === "CANCELED_BY_DAMAGED"
      ? editing.items.map((item) => ({ variantId: item.variantId, damagedQuantity: damagedQuantities[item.variantId] ?? 0 }))
      : undefined;
    if (transitionTarget === "CANCELED_BY_DAMAGED" && !damagedItems?.some((item) => item.damagedQuantity > 0)) {
      return toast.error("Vui lòng khai báo ít nhất một sản phẩm bị hỏng");
    }
    update.mutate({
      id: editing.exchangeDeliveryId, nextStatus: transitionTarget,
      reason: transitionReason.trim(), files: evidenceFiles, damagedItems
    });
  };

  const statuses: { value: ExchangeDeliveryStatus | ""; label: string }[] = [
    { value: "", label: "Tất cả phiếu" },
    { value: "PREPARING", label: "Chờ giao" },
    { value: "SHIPPING", label: "Đang giao" },
    { value: "DELIVERED", label: "Đã giao" },
    { value: "FAILED_DELIVERY", label: "Giao thất bại" },
    { value: "RETURNING", label: "Đang hoàn" },
    { value: "RETURNED_TO_SHOP", label: "Đã về shop" },
    { value: "CANCELLED", label: "Đã hủy" },
    { value: "CANCELED_BY_DAMAGED", label: "Hỏng hàng" },
  ];

  const renderStatusTimeline = (currentStatus: ExchangeDeliveryStatus) => {
    const steps = [
      { key: "PREPARING", label: "Chờ giao", desc: "Chuẩn bị hàng" },
      { key: "SHIPPING", label: "Đang giao", desc: "Đã xuất kho" },
      { key: "DELIVERED", label: "Đã giao", desc: "Thành công" },
    ];

    if (!(["PREPARING", "SHIPPING", "DELIVERED"] as ExchangeDeliveryStatus[]).includes(currentStatus)) {
      steps[2] = { key: currentStatus, label: labels[currentStatus], desc: "Nhánh xử lý sự cố" };
    }

    const getStepIndex = (st: ExchangeDeliveryStatus) => {
      if (st === "PREPARING") return 0;
      if (st === "SHIPPING") return 1;
      return 2;
    };

    const currentIndex = getStepIndex(currentStatus);

    return (
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <div className="flex items-center justify-between relative max-w-md mx-auto py-2">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200/80 -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-300 -z-0"
            style={{ width: `${(Math.min(currentIndex, 2) / 2) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isCompleted = idx < currentIndex || (currentStatus === "DELIVERED" && idx === 2);
            const isCurrent = idx === currentIndex;
            const isFailed = !(["PREPARING", "SHIPPING", "DELIVERED"] as ExchangeDeliveryStatus[]).includes(currentStatus) && idx === 2;
            const StepIcon = idx === 0 ? Clock : idx === 1 ? Truck : isFailed ? AlertCircle : CheckCircle2;

            let circleStyle = "bg-slate-100 text-slate-400 border-slate-200";
            if (isCompleted) {
              circleStyle = "bg-blue-500 text-white border-blue-600";
            } else if (isCurrent) {
              if (isFailed) {
                circleStyle = "bg-rose-500 text-white border-rose-600 ring-4 ring-rose-100";
              } else {
                circleStyle = "bg-blue-600 text-white border-blue-700 ring-4 ring-blue-100";
              }
            }

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div className={cn("size-8 rounded-full flex items-center justify-center border shadow-sm transition-all", circleStyle)}>
                  <StepIcon className="size-4 shrink-0" />
                </div>
                <span className={cn("text-[11px] mt-1.5 font-bold", isCurrent ? (isFailed ? "text-rose-600" : "text-blue-600") : isCompleted ? "text-slate-800" : "text-slate-400")}>
                  {step.label}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:inline">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Quản lý giao đổi hàng</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Xử lý và theo dõi quá trình giao sản phẩm thay thế cho khách hàng
          </p>
        </div>
        <Button
          onClick={refreshData}
          disabled={query.isLoading || query.isFetching}
          variant="outline"
          className="border-gray-250 bg-white hover:bg-gray-50 text-gray-700 font-semibold h-10 px-4 text-xs gap-2 rounded-xl shadow-sm cursor-pointer"
        >
          <RefreshCw className={cn("size-3.5", (query.isLoading || query.isFetching) && "animate-spin")} />
          Tải lại
        </Button>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-6 pt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {statuses.map((tab) => {
            const isActive = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(0);
                }}
                className={cn("pb-3 text-sm font-medium border-b-2 px-3 transition-colors whitespace-nowrap shrink-0 cursor-pointer",
                  isActive ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900")}
              >
                <span>{tab.label}</span>
                {isActive && query.data !== undefined && (
                  <span className="ml-1 text-[10px] text-blue-500">({query.data.totalElements})</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-4 border-b">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(0); }}
                placeholder="Tìm mã phiếu, mã hóa đơn, tên hoặc SĐT khách..."
                className="pl-9 pr-8 text-xs h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" />
              {keyword && <button onClick={() => { setKeyword(""); setPage(0); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={14} /></button>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant={filtersOpen ? "secondary" : "outline"} size="sm" onClick={() => setFiltersOpen(!filtersOpen)}
                className="gap-2 h-9 text-xs border-gray-200 font-medium cursor-pointer">
                <SlidersHorizontal size={14} /> Bộ lọc nâng cao
                {filterCount > 0 && <Badge className="ml-0.5 size-4 p-0 flex items-center justify-center rounded-full text-[10px] bg-blue-600 text-white">{filterCount}</Badge>}
                {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
              {(filterCount > 0 || keyword) && <Button variant="ghost" size="sm" onClick={resetFilters}
                className="gap-1.5 h-9 text-xs text-gray-500 hover:text-gray-900 cursor-pointer">
                <RotateCcw size={13} /> Làm mới bộ lọc
              </Button>}
            </div>
          </div>

          {filtersOpen && <div className="rounded-xl border border-gray-150 bg-gray-50/50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Từ ngày</label>
                <Input type="date" value={fromDate} max={toDate || undefined}
                  onChange={(event) => { setFromDate(event.target.value); setPage(0); }}
                  className="h-9 text-xs bg-white border-gray-200 font-normal" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Đến ngày</label>
                <Input type="date" value={toDate} min={fromDate || undefined}
                  onChange={(event) => { setToDate(event.target.value); setPage(0); }}
                  className="h-9 text-xs bg-white border-gray-200 font-normal" />
              </div>
            </div>
          </div>}
        </div>
        {/* Main Table Grid Container */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse text-left">
              <thead className="bg-gray-50/50 text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 border-b border-gray-100">STT</th>
                  <th className="px-4 py-3 border-b border-gray-100">Mã phiếu giao</th>
                  <th className="px-4 py-3 border-b border-gray-100">Hóa đơn / Phiếu đổi</th>
                  <th className="px-4 py-3 border-b border-gray-100">Khách hàng</th>
                  <th className="px-4 py-3 border-b border-gray-100">Số lượng</th>
                  <th className="px-4 py-3 border-b border-gray-100">Trạng thái</th>
                  <th className="px-4 py-3 border-b border-gray-100">Người xử lý</th>
                  <th className="px-4 py-3 border-b border-gray-100"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-20 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="size-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        <span className="text-xs">Đang tải dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : !query.data?.content.length ? (
                  <tr>
                    <td colSpan={8} className="p-20 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2 py-6">
                        <Package className="size-10 text-slate-300" />
                        <span className="text-sm font-medium text-slate-500">Chưa có phiếu giao hàng đổi nào</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  query.data.content.map((item, index) => {
                    const StatusIcon = statusIcons[item.status];
                    return (
                      <tr key={item.exchangeDeliveryId} className="align-top hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-4 text-xs text-gray-700 ">
                          {index + page * pageSize + 1}
                        </td>
                        {/* Slip Code */}
                        <td className="px-4 py-4">
                          <span className=" font-semibold text-gray-900 text-xs select-all">
                            {item.deliveryCode}
                          </span>
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Calendar className="size-3" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                        </td>

                        {/* Source Orders & Returns */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <Link
                              className="group inline-flex items-center gap-1  text-xs font-semibold text-slate-700 hover:text-blue-600"
                              to={`/orders/${item.orderId}`}
                            >
                              <span className="group-hover:underline">{item.orderCode}</span>
                              <ExternalLink className="size-3 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </Link>
                            <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <span className="bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                Phiếu đổi #{item.returnId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Recipient Contact Card */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <User className="size-3.5 text-slate-400 shrink-0" />
                              <span>{item.receiverName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Phone className="size-3.5 text-slate-400 shrink-0" />
                              <span>{item.receiverPhone}</span>
                            </div>
                            <div className="flex items-start gap-1.5 mt-1 text-[11px] text-slate-400 max-w-56 leading-relaxed">
                              <MapPin className="size-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2" title={item.deliveryAddress || ""}>
                                {item.deliveryAddress || "Chưa cung cấp địa chỉ"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Quantity of products in order */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-900 text-xs">
                              {item.items?.reduce((sum, p) => sum + (p.quantity || 0), 0) ?? 0} sản phẩm
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {item.items?.length ?? 0} loại hàng
                            </span>
                          </div>
                        </td>

                        {/* Status pill badge */}
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={cn("gap-1 py-1 rounded-full text-[10px] font-bold border shadow-none", badgeStyles[item.status])}
                          >
                            <StatusIcon className="size-3 shrink-0" />
                            {labels[item.status]}
                          </Badge>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <UserCheck className="size-3.5" />
                            </div>
                            <span className="max-w-36 truncate" title={getLatestHandler(item)}>
                              {getLatestHandler(item)}
                            </span>
                          </div>
                        </td>

                        {/* Edit Trigger Action */}
                        <td className="px-4 py-4 text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                            className="h-8 w-8 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition rounded-full cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {query.data && (
            <div className="pb-4 border-t border-gray-100">
              <Pagination
                currentPage={query.data.number}
                totalPages={query.data.totalPages}
                totalElements={query.data.totalElements}
                first={query.data.first}
                last={query.data.last}
                onPageChange={setPage}
                onChangeSize={(size) => { setPageSize(size); setPage(0); }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redesigned Update Detail Modal */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto rounded-2xl p-6 border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <PackageCheck className="size-5.5 text-blue-500" />
              <span>Phiếu Giao Đổi: <span className=" text-blue-600">{editing?.deliveryCode}</span></span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 mt-1 text-xs">
              Xem thông tin phiếu và cập nhật trạng thái giao đổi.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <div className="space-y-6">
              {/* Stepper Status Progress timeline */}
              {renderStatusTimeline(editing.status)}

              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <UserCheck className="mt-0.5 size-4 shrink-0 text-blue-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Nhân viên xử lý yêu cầu đổi
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-800">
                      {editing.processedByName || "Chưa có nhân viên xử lý"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <History className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Cập nhật giao hàng gần nhất
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-800">
                      {getLatestHandler(editing)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer, Delivery Address & Shipping Fee Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Information */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <User className="size-3.5 text-blue-500" /> Thông tin khách hàng
                    </h3>
                    <Link
                      to={`/orders/${editing.orderId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      title="Xem chi tiết đơn hàng"
                    >
                      <span>Đơn #{editing.orderCode}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Khách hàng:</span>
                      <span className="font-bold text-slate-800">
                        {orderDetail?.customerName || editing.receiverName || "Khách hàng"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Số điện thoại:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Phone className="size-3 text-slate-400" />
                        {orderDetail?.customerPhone || editing.receiverPhone || "—"}
                      </span>
                    </div>

                    {orderDetail?.customerEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Email:</span>
                        <span className="text-slate-700 truncate max-w-[180px] flex items-center gap-1" title={orderDetail.customerEmail}>
                          <Mail className="size-3 text-slate-400 shrink-0" />
                          {orderDetail.customerEmail}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Yêu cầu đổi hàng:</span>
                      <Link
                        to={`/returns/${editing.returnId}`}
                        className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Phiếu #{editing.returnId}</span>
                        <ExternalLink className="size-3 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Delivery Address & Shipping Fee */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Truck className="size-3.5 text-indigo-500" /> Giao nhận & Phí vận chuyển
                    </h3>
                    <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {editing.receiverName}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="leading-relaxed min-w-0 flex-1">
                        <span className="text-slate-500 font-medium block text-[11px]">Địa chỉ giao hàng:</span>
                        <span className="font-semibold text-slate-800 break-words" title={editing.deliveryAddress || orderDetail?.shippingAddress || ""}>
                          {editing.deliveryAddress || orderDetail?.shippingAddress || "Chưa cung cấp địa chỉ"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-200/70 pt-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Phí giao đổi:</span>
                        <span className="font-bold text-slate-900">
                          {editing.shippingFee !== undefined && editing.shippingFee > 0
                            ? `${editing.shippingFee.toLocaleString("vi-VN")}₫`
                            : "0₫ (Miễn phí)"}
                        </span>
                      </div>

                      {orderDetail?.shippingFee !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Phí ship đơn hàng:</span>
                          <span className="font-semibold text-slate-700">
                            {orderDetail.shippingFee > 0
                              ? `${orderDetail.shippingFee.toLocaleString("vi-VN")}₫`
                              : "0₫ (Miễn phí)"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Note if available */}
              {editing.note && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs flex items-start gap-2">
                  <FileText className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-amber-900">Ghi chú phiếu giao đổi: </span>
                    <span className="text-amber-800">{editing.note}</span>
                  </div>
                </div>
              )}

              {/* Exchange items */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Package className="size-3.5 text-blue-500" /> Sản phẩm giao đổi trả ({editing.items.length})
                </h3>

                <div className="max-h-[220px] overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                  {editing.items.map((item) => (
                    <div key={item.exchangeItemId} className="flex justify-between items-center bg-white border border-slate-200/80 p-2.5 rounded-lg shadow-xs hover:border-slate-300 transition-colors">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate" title={item.productName}>
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Màu: <span className="text-slate-600">{item.color}</span> · Size: <span className="text-slate-600">{item.size}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">
                          SL: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <History className="size-3.5" /> Lịch sử xử lý giao hàng
                </h3>
                {editing.history?.length ? (
                  <div className="space-y-3">
                    {[...editing.history].reverse().map((event) => (
                      <div key={event.logId} className="border-l-2 border-blue-200 pl-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-slate-800">
                            {event.previousStatus ? `${labels[event.previousStatus]} → ` : ""}{labels[event.currentStatus]}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDate(event.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {event.createdByName || "Hệ thống"}{event.note ? ` · ${event.note}` : ""}
                        </p>
                        {!!event.evidenceImages?.length && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {event.evidenceImages.map((url, index) => (
                              <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt="Bằng chứng giao hàng" className="size-12 rounded-md border object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs italic text-slate-400">Chưa có lần chuyển trạng thái nào.</p>}
              </div>

              {/* Modal footer with action buttons */}
              <div className="border-t border-slate-100 pt-5 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="size-3" />
                  <span>Cập nhật gần nhất: {formatDate(editing.updatedAt)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setEditing(null)}
                    className="px-4 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-8 cursor-pointer"
                  >
                    Hủy
                  </Button>

                  {/* Transition status */}
                  {nextStatuses.map((next) => (
                    <Button
                      key={next}
                      variant={["FAILED_DELIVERY", "RETURNING", "CANCELLED", "CANCELED_BY_DAMAGED"].includes(next) ? "destructive" : "default"}
                      disabled={update.isPending}
                      onClick={() => beginTransition(next)}
                      className="px-4 text-xs font-bold h-8 cursor-pointer shadow-xs"
                    >
                      {next === "PREPARING" ? "Chuẩn bị giao lại" : labels[next]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!transitionTarget} onOpenChange={(open) => !open && setTransitionTarget(null)}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cập nhật: {transitionTarget ? labels[transitionTarget] : ""}</DialogTitle>
            <DialogDescription>
              {problemConfirmationDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600">Lý do xử lý</label>
              <textarea value={transitionReason} onChange={(event) => setTransitionReason(event.target.value)}
                rows={3} placeholder="Nhập lý do cụ thể..."
                className="w-full rounded-lg border border-slate-200 p-3 text-xs outline-none focus:border-blue-500" />
            </div>

            {transitionTarget === "CANCELED_BY_DAMAGED" && editing && (
              <div className="space-y-2 rounded-xl border border-red-100 bg-red-50/50 p-3">
                <p className="text-xs font-bold text-red-700">Số lượng hàng hỏng</p>
                {editing.items.map((item) => (
                  <div key={item.exchangeItemId} className="flex items-center justify-between gap-3 rounded-lg bg-white p-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{item.productName}</span>
                    <Input type="number" min={0} max={item.quantity}
                      value={damagedQuantities[item.variantId] ?? 0}
                      onChange={(event) => setDamagedQuantities((current) => ({
                        ...current,
                        [item.variantId]: Math.max(0, Math.min(item.quantity, Number(event.target.value) || 0))
                      }))}
                      className="h-8 w-20 text-xs" />
                    <span className="text-[10px] text-slate-400">/{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600">Ảnh bằng chứng</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                <UploadCloud className="size-4" /> Chọn ảnh ({evidenceFiles.length})
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={(event) => setEvidenceFiles(Array.from(event.target.files ?? []))} />
              </label>
              {!!evidenceFiles.length && <p className="text-[10px] text-slate-400">{evidenceFiles.map((file) => file.name).join(", ")}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setTransitionTarget(null)}>Đóng</Button>
            <Button variant="destructive" disabled={update.isPending} onClick={submitProblemTransition}>
              {update.isPending ? "Đang xử lý..." : `Xác nhận ${transitionTarget ? labels[transitionTarget].toLocaleLowerCase("vi-VN") : "cập nhật"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!confirmTransition}
        onOpenChange={(open) => !open && setConfirmTransition(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmContent?.title ?? "Xác nhận cập nhật trạng thái"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmContent?.description ?? "Bạn có chắc chắn muốn cập nhật trạng thái phiếu giao đổi?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={update.isPending}>Đóng</AlertDialogCancel>
            <AlertDialogAction
              disabled={update.isPending}
              onClick={submitConfirmedTransition}
              className={confirmContent?.destructive ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {update.isPending ? "Đang xử lý..." : (confirmContent?.actionLabel ?? "Xác nhận")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Address Form Dialog for adding customer address */}
      {orderDetail?.customerId && (
        <AddressFormDialog
          open={isAddAddressOpen}
          onOpenChange={setIsAddAddressOpen}
          isPending={createAddressMutation.isPending}
          onSubmit={handleAddAddress}
        />
      )}
    </div>
  );
}
