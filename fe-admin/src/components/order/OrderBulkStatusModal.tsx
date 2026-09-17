import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  type OrderStatus,
  type OrderResponse,
  orderApi,
} from "@/api/orderApi";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import {
  QrCode,
  Search,
  Trash2,
  CheckCircle2,
  Truck,
  Check,
  Ban,
  Layers,
  Loader2,
  Camera,
  CameraOff,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import QrImageScanButton from "@/components/QrImageScanButton";

interface OrderBulkStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSelectedOrders?: OrderResponse[];
  onSuccess?: () => void;
}

export default function OrderBulkStatusModal({
  open,
  onOpenChange,
  initialSelectedOrders = [],
  onSuccess,
}: OrderBulkStatusModalProps) {
  const queryClient = useQueryClient();

  const [orders, setOrders] = useState<OrderResponse[]>(initialSelectedOrders);
  const [scanInput, setScanInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [targetStatus, setTargetStatus] = useState<OrderStatus>("SHIPPING");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setOrders(initialSelectedOrders);
      setScanInput("");
      setNote("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      stopCamera();
    }
  }, [open, initialSelectedOrders]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraActive(true);

      await new Promise((res) => setTimeout(res, 200));

      const scanner = new Html5Qrcode("order-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          await handleProcessCode(decodedText.trim());
        },
        () => { }
      );
    } catch (err) {
      console.error("Lỗi bật camera:", err);
      toast.error("Không thể mở Camera. Vui lòng cấp quyền truy cập Camera trên trình duyệt!");
      setCameraActive(false);
    }
  };

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn("Scanner stop error", e);
      }
      try {
        await scannerRef.current.clear();
      } catch (e) {
        console.warn("Scanner clear error", e);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleProcessCode = async (rawCode: string) => {
    if (!rawCode) return;

    let orderCodeOrId = rawCode;
    if (rawCode.includes("/")) {
      const parts = rawCode.split("/");
      orderCodeOrId = parts[parts.length - 1] || rawCode;
    }

    const exists = orders.some(
      (o) =>
        o.orderCode.toLowerCase() === orderCodeOrId.toLowerCase() ||
        String(o.orderId) === orderCodeOrId
    );

    if (exists) {
      toast.info(`Đơn hàng #${orderCodeOrId} đã có trong danh sách!`);
      setScanInput("");
      return;
    }

    setIsSearching(true);
    try {

      let foundOrder: OrderResponse | null = null;

      if (!isNaN(Number(orderCodeOrId))) {
        try {
          foundOrder = await orderApi.getById(Number(orderCodeOrId));
        } catch {
          // Không phải ID hợp lệ; tiếp tục tìm theo mã đơn hàng.
        }
      }

      if (!foundOrder) {
        const searchRes = await orderApi.getAll({
          keyword: orderCodeOrId,
          page: 0,
          size: 10,
        });
        const match = searchRes.content.find(
          (o) =>
            o.orderCode.toLowerCase() === orderCodeOrId.toLowerCase() ||
            o.orderCode.toLowerCase().includes(orderCodeOrId.toLowerCase())
        );
        if (match) {
          foundOrder = match;
        } else if (searchRes.content.length > 0) {
          foundOrder = searchRes.content[0];
        }
      }

      if (foundOrder) {
        if (foundOrder.status === "DRAFT") {
          toast.warning(`Đơn hàng ${foundOrder.orderCode} là đơn chờ tại quầy chưa thanh toán!`);
        } else {
          setOrders((prev) => [foundOrder!, ...prev]);
          toast.success(`Đã thêm đơn hàng ${foundOrder.orderCode} vào danh sách!`);
        }
      } else {
        toast.error(`Không tìm thấy đơn hàng có mã "${orderCodeOrId}"`);
      }
    } catch {
      toast.error(`Lỗi khi tra cứu mã đơn "${orderCodeOrId}"`);
    } finally {
      setIsSearching(false);
      setScanInput("");
      inputRef.current?.focus();
    }
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanInput.trim()) {
      handleProcessCode(scanInput.trim());
    }
  };

  const handleRemoveOrder = (id: number) => {
    setOrders((prev) => prev.filter((o) => o.orderId !== id));
  };

  const handleClearAll = () => {
    setOrders([]);
  };

  const handleSubmitBulk = async () => {
    if (orders.length === 0) {
      toast.error("Danh sách đơn hàng hiện tại đang trống!");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderIds = orders.map((o) => o.orderId);
      const res = await orderApi.bulkUpdateStatus({
        orderIds,
        status: targetStatus,
        note: note.trim() || undefined,
      });

      if (res.successCount === 0) {
        toast.error(
          `Cập nhật thất bại! Cả ${res.failedCount} đơn hàng không thể chuyển trạng thái. Chi tiết: ${res.errorMessages[0] || "không đúng quy trình"}`
        );
      } else if (res.failedCount > 0) {
        toast.warning(
          `Cập nhật thành công ${res.successCount} đơn. Thất bại ${res.failedCount} đơn (do không đúng quy trình). Chi tiết đơn lỗi: ${res.errorMessages[0] || ""}`
        );
      } else {
        toast.success(
          `Đã chuyển trạng thái "${getStatusLabel(targetStatus)}" thành công cho ${res.successCount} đơn hàng!`
        );
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error("Có lỗi xảy ra khi chuyển trạng thái hàng loạt. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      WAITING_PAYMENT: "Chờ thanh toán",
      DRAFT: "Chờ thanh toán tại quầy",
      PENDING: "Chờ xác nhận",
      WAITING_STOCK: "Chờ bổ sung hàng",
      CONFIRMED: "Đã xác nhận",
      PROCESSING: "Đang xử lý",
      SHIPPING: "Đang giao",
      RETURNING: "Đang chuyển hoàn",
      RETURNED_TO_SHOP: "Nhận lại hàng hoàn",
      CANCELED_BY_DAMAGED: "Hủy do hỏng hàng",
      FAILED_DELIVERY: "Giao thất bại",
      COMPLETED: "Đã hoàn thành",
      CANCELLED: "Đã hủy",
      REFUNDED: "Hoàn tiền",
    };
    return map[status] || status;
  };

  const getStatusBadgeVariant = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      WAITING_PAYMENT: "bg-amber-50 text-amber-700 border-amber-200",
      DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      WAITING_STOCK: "bg-orange-50 text-orange-700 border-orange-200",
      CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
      PROCESSING: "bg-cyan-50 text-cyan-700 border-cyan-200",
      SHIPPING: "bg-indigo-50 text-indigo-700 border-indigo-200",
      RETURNING: "bg-purple-50 text-purple-700 border-purple-200",
      RETURNED_TO_SHOP: "bg-emerald-50 text-emerald-700 border-emerald-200",
      CANCELED_BY_DAMAGED: "bg-zinc-100 text-zinc-700 border-zinc-300",
      FAILED_DELIVERY: "bg-rose-50 text-rose-700 border-rose-200",
      COMPLETED: "bg-green-50 text-green-700 border-green-200",
      CANCELLED: "bg-red-50 text-red-700 border-red-200",
      REFUNDED: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return map[status] || "bg-gray-50 text-gray-700";
  };

  const totalAmountSum = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        { }
        <DialogHeader className="p-5 pb-4 border-b bg-gray-50/70">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
              <QrCode className="size-5 text-blue-600" />
              Quét mã QR & Chuyển trạng thái đơn hàng hàng loạt
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Quét mã QR / Mã vạch trên hóa đơn hoặc nhập mã đơn để gom danh sách và đổi trạng thái đồng loạt.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          { }
          <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                Nhập hoặc Quét mã đơn hàng (Máy quét mã vạch / QR)
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                <QrImageScanButton
                  onDecoded={handleProcessCode}
                  disabled={isSearching}
                  label="Chọn ảnh QR"
                  className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
                />
                <Button
                  type="button"
                  variant={cameraActive ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleCamera}
                  className="h-8 gap-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {cameraActive ? (
                    <>
                      <CameraOff size={14} /> Tắt Camera Quét
                    </>
                  ) : (
                    <>
                      <Camera size={14} /> Mở Camera Quét QR
                    </>
                  )}
                </Button>
              </div>
            </div>

            <form onSubmit={handleManualAddSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Quét mã QR hoặc Nhập mã đơn (VD: ORD123456)..."
                  disabled={isSearching}
                  className="pl-9 text-xs h-10 bg-white border-blue-200 focus:border-blue-500 shadow-sm "
                />
                {scanInput && (
                  <button
                    type="button"
                    onClick={() => setScanInput("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSearching || !scanInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Thêm đơn
              </Button>
            </form>

            { }
            {cameraActive && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <div className="relative rounded-lg overflow-hidden border-2 border-blue-500 bg-black max-w-sm mx-auto shadow-md">
                  <div id="order-qr-reader" className="w-full h-56" />
                </div>
                <p className="text-[11px] text-center text-blue-700 font-medium">
                  Đưa mã QR trên đơn hàng vào khung hình Camera để quét tự động
                </p>
              </div>
            )}
          </div>

          { }
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Layers size={14} className="text-gray-500" />
                Danh sách đơn hàng chờ xử lý ({orders.length})
              </span>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                  Xóa tất cả
                </button>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden bg-white max-h-56 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold py-2.5 px-3">STT</TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3">Mã đơn hàng</TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3">Khách hàng</TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3">Tổng tiền</TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3">Trạng thái hiện tại</TableHead>
                    <TableHead className="text-xs font-semibold py-2.5 px-3 text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-10 text-gray-400 text-xs"
                      >
                        Chưa có đơn hàng nào trong danh sách. Quét mã QR hoặc nhập mã đơn ở trên để thêm vào!
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((o, index) => (
                      <TableRow key={o.orderId} className="hover:bg-gray-50/60 transition">
                        <TableCell className="py-2.5 px-3 text-xs text-gray-500 ">
                          {index + 1}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-xs font-bold text-gray-900 ">
                          {o.orderCode}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-xs text-gray-700">
                          <div>{o.customerName || "Khách vãng lai"}</div>
                          {o.customerPhone && (
                            <div className="text-[10px] text-gray-400 ">{o.customerPhone}</div>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-xs font-bold text-blue-600">
                          {o.totalAmount.toLocaleString("vi-VN")}đ
                        </TableCell>
                        <TableCell className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className={`px-2 py-0.5 rounded-full text-[10px] ${getStatusBadgeVariant(o.status)}`}
                          >
                            {getStatusLabel(o.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOrder(o.orderId)}
                            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full cursor-pointer"
                            title="Bỏ khỏi danh sách"
                          >
                            <X size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {orders.length > 0 && (
              <div className="flex items-center justify-between text-xs text-gray-500 pt-1 px-1">
                <span>Tổng giá trị đơn hàng gom chọn:</span>
                <span className="font-bold text-blue-600 text-sm">
                  {totalAmountSum.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}
          </div>

          { }
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              Chọn Trạng thái Mục tiêu cần chuyển sang:
            </label>

            { }
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetStatus("SHIPPING")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
                  targetStatus === "SHIPPING"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Truck size={14} className="text-indigo-600" />
                Đang giao hàng
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus("COMPLETED")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
                  targetStatus === "COMPLETED"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Check size={14} className="text-emerald-600" />
                Hoàn thành
              </button>

              <button
                type="button"
                onClick={() => setTargetStatus("CANCELLED")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer",
                  targetStatus === "CANCELLED"
                    ? "border-red-600 bg-red-50 text-red-700 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Ban size={14} className="text-red-600" />
                Hủy đơn hàng
              </button>
            </div>

            { }
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500 shrink-0">Hoặc chọn trạng thái khác:</span>
              <Select
                value={targetStatus}
                onValueChange={(val) => setTargetStatus(val as OrderStatus)}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-gray-200 flex-1">
                  <SelectValue placeholder="Chọn trạng thái..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHIPPING">Đang giao hàng</SelectItem>
                  <SelectItem value="RETURNED_TO_SHOP">Nhận lại hàng hoàn</SelectItem>
                  <SelectItem value="COMPLETED">Đã hoàn thành</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-[10px] text-amber-600">
              Giao thất bại, chuyển hoàn và hủy do hỏng hàng phải thao tác tại
              chi tiết từng đơn để tải ảnh xác nhận riêng.
            </p>

            { }
            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-gray-700">
                Ghi chú vết xử lý hàng loạt (Không bắt buộc)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lý do hoặc vết xử lý cho lượt đổi hàng loạt này..."
                className="w-full min-h-[60px] p-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        { }
        <DialogFooter className="p-4 bg-gray-50 border-t flex items-center justify-between sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs font-medium cursor-pointer"
          >
            Đóng
          </Button>

          <Button
            type="button"
            onClick={handleSubmitBulk}
            disabled={isSubmitting || orders.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 h-10 gap-2 rounded-xl cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang đổi trạng thái...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} />
                Thực hiện đổi sang "{getStatusLabel(targetStatus)}" ({orders.length} đơn)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
