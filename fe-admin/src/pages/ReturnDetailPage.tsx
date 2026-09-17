import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  FileText,
  DollarSign,
  SlidersHorizontal,
  X,
  Camera,
  UploadCloud,
  UserCheck,
  Truck,
  History,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useReturnDetail,
  useApproveReturn,
  useRejectReturn,
  useCompleteReturn,
} from "@/hooks/useReturn";
import { toast } from "sonner";
import type { ReturnStatus } from "@/api/returnApi";
import { returnApi } from "@/api/returnApi";
import { useForm } from "@tanstack/react-form";
import { Input } from "@/components/ui/input";
import ReturnProcessTimeline from "@/components/return/ReturnProcessTimeline";
import { useQuery } from "@tanstack/react-query";
import {
  exchangeDeliveryApi,
  type ExchangeDeliveryStatus,
} from "@/api/exchangeDeliveryApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DELIVERY_STATUS_LABELS: Record<ExchangeDeliveryStatus, string> = {
  PREPARING: "Chờ giao hàng đổi",
  SHIPPING: "Đang giao hàng đổi",
  DELIVERED: "Đã giao hàng đổi",
  FAILED_DELIVERY: "Giao hàng đổi thất bại",
  RETURNING: "Đang hoàn về cửa hàng",
  RETURNED_TO_SHOP: "Đã hoàn về cửa hàng",
  CANCELLED: "Đã hủy giao hàng đổi",
  CANCELED_BY_DAMAGED: "Hủy do hàng đổi bị hư hỏng",
  FAILED: "Giao hàng đổi thất bại",
};

export default function ReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const returnId = id ? Number(id) : null;

  const { data: returnReq, isLoading } = useReturnDetail(returnId);
  const { mutate: approve, isPending: isApproving } = useApproveReturn();
  const { mutate: reject, isPending: isRejecting } = useRejectReturn();
  const { mutate: complete, isPending: isCompleting } = useCompleteReturn();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [adminFiles, setAdminFiles] = useState<File[]>([]);
  const [adminPreviews, setAdminPreviews] = useState<string[]>([]);
  const [isUploadingAdminImages, setIsUploadingAdminImages] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeliveryHistory, setShowDeliveryHistory] = useState(false);
  const [damagedQuantities, setDamagedQuantities] = useState<
    Record<number, number>
  >({});
  const exchangeDeliveryId = returnReq?.exchangeDelivery?.exchangeDeliveryId;
  const deliveryHistoryQuery = useQuery({
    queryKey: ["exchange-deliveries", "detail", exchangeDeliveryId],
    queryFn: () => exchangeDeliveryApi.getById(exchangeDeliveryId!),
    enabled: showDeliveryHistory && exchangeDeliveryId != null,
  });

  const getStatusLabel = (status: ReturnStatus) => {
    const map: Record<ReturnStatus, string> = {
      PENDING: "Chờ xử lý",
      APPROVED: "Đã duyệt / Chờ nhận hàng",
      REJECTED: "Từ chối đổi hàng",
      COMPLETED: "Đã hoàn thành",
    };
    return map[status] || status;
  };

  const getStatusColor = (status: ReturnStatus) => {
    const map: Record<ReturnStatus, string> = {
      PENDING:
        "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50",
      APPROVED: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
      REJECTED: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
      COMPLETED:
        "bg-green-50 text-green-700 border-green-200 hover:bg-green-50",
    };
    return map[status] || "bg-gray-50 text-gray-700";
  };

  const handleApprove = () => {
    if (!returnId) return;
    approve(returnId, {
      onSuccess: () => {
        toast.success("Duyệt yêu cầu thành công. Đang đợi nhận hàng hoàn trả.");
      },
      onError: (error: unknown) => {
        const apiError = error as {
          apiMessage?: string;
          message?: string;
        } | null;
        toast.error(
          apiError?.apiMessage ??
          apiError?.message ??
          "Không thể duyệt yêu cầu",
        );
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const remainingSlots = 5 - adminFiles.length;
    if (remainingSlots <= 0) return;

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const newFiles = [...adminFiles, ...filesToAdd];
    setAdminFiles(newFiles);

    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
    setAdminPreviews((prev) => [...prev, ...newPreviews].slice(0, 5));
  };

  const removeFile = (index: number) => {
    const newFiles = [...adminFiles];
    newFiles.splice(index, 1);
    setAdminFiles(newFiles);

    URL.revokeObjectURL(adminPreviews[index]);
    const newPreviews = [...adminPreviews];
    newPreviews.splice(index, 1);
    setAdminPreviews(newPreviews);
  };

  const handleCompleteSubmit = async () => {
    if (!returnId) return;
    if (adminFiles.length === 0) {
      toast.error(
        "Vui lòng tải lên ít nhất một ảnh xác nhận khi nhận hàng hoàn trả!",
      );
      return;
    }

    setIsUploadingAdminImages(true);
    let uploadedUrls: string[];
    try {
      uploadedUrls = await returnApi.uploadImages(adminFiles);
    } catch {
      toast.error("Tải ảnh xác nhận lên máy chủ thất bại, vui lòng thử lại");
      return;
    } finally {
      setIsUploadingAdminImages(false);
    }

    const payload = {
      items:
        returnReq?.items.map((item) => ({
          returnItemId: item.returnItemId,
          damagedQuantity: damagedQuantities[item.returnItemId] ?? 0,
        })) ?? [],
      processedImages: uploadedUrls.join(","),
    };
    complete(
      { id: returnId, payload },
      {
        onSuccess: () => {
          toast.success(
            returnReq?.returnType === "EXCHANGE"
              ? "Đã nhận hàng trả, xuất kho và tạo phiếu giao hàng đổi thành công!"
              : "Xác nhận đã nhận hàng hoàn trả và hoàn tiền cho khách thành công!",
          );
          setShowCompleteDialog(false);
          setAdminFiles([]);
          setAdminPreviews([]);
        },
        onError: (error: unknown) => {
          const apiError = error as {
            apiMessage?: string;
            message?: string;
          } | null;
          toast.error(
            apiError?.apiMessage ??
            apiError?.message ??
            "Không thể hoàn tất yêu cầu",
          );
        },
      },
    );
  };

  const rejectForm = useForm({
    defaultValues: {
      rejectReason: "",
    },
    onSubmit: async ({ value }) => {
      if (!returnId) return;
      reject(
        { id: returnId, rejectReason: value.rejectReason },
        {
          onSuccess: () => {
            toast.success("Đã từ chối yêu cầu đổi hàng của khách");
            setShowRejectForm(false);
          },
          onError: (error: unknown) => {
            const apiError = error as {
              apiMessage?: string;
              message?: string;
            } | null;
            toast.error(
              apiError?.apiMessage ?? apiError?.message ?? "Thao tác thất bại",
            );
          },
        },
      );
    },
  });

  if (!returnId) {
    return (
      <div className="p-6 text-center text-red-500">
        Mã yêu cầu đổi hàng không hợp lệ.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-9 h-9 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">
          Đang tải chi tiết yêu cầu đổi hàng...
        </p>
      </div>
    );
  }

  if (!returnReq) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-500">
          Không tìm thấy yêu cầu đổi hàng này trong hệ thống.
        </p>
        <Button
          onClick={() => navigate("/returns")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      { }
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/returns")}
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full border-gray-200"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-medium tracking-tight text-gray-900">
                {returnReq.returnType === "EXCHANGE"
                  ? "Chi tiết yêu cầu đổi hàng"
                  : "Chi tiết yêu cầu đổi hàng"}
              </h1>
              <Badge
                variant="outline"
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(returnReq.status)}`}
              >
                {getStatusLabel(returnReq.status)}
              </Badge>
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Yêu cầu #{returnReq.returnId} • Tạo ngày{" "}
              {new Date(returnReq.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-blue-600 px-4 py-3 text-right text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider">
            {returnReq.returnType === "EXCHANGE"
              ? "Giá trị hàng đổi"
              : "Số tiền hoàn"}
          </p>
          <p className="mt-0.5 text-xl font-medium">
            {returnReq.refundAmount.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {returnReq.returnType === "EXCHANGE" && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="size-5 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-blue-950">
                  {returnReq.exchangeFulfillmentMethod === "STORE_PICKUP"
                    ? "Đổi tại cửa hàng"
                    : "Trạng thái giao hàng đổi"}
                </p>
                <p className="mt-0.5 text-[11px] text-blue-700">
                  {returnReq.exchangeDelivery?.deliveryCode ??
                    "Phiếu giao sẽ được tạo sau khi kiểm nhận hàng lỗi"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {returnReq.exchangeDelivery && (
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-white text-blue-700"
                >
                  {DELIVERY_STATUS_LABELS[returnReq.exchangeDelivery.status]}
                </Badge>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-blue-200 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-100"
                onClick={() => setShowDeliveryHistory(true)}
              >
                <History size={14} /> Trạng thái
              </Button>
            </div>
          </div>
          {returnReq.exchangeFulfillmentMethod === "DELIVERY" && (
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <span>
                Người nhận:{" "}
                <strong>
                  {returnReq.exchangeReceiverName} ·{" "}
                  {returnReq.exchangeReceiverPhone}
                </strong>
              </span>
              <span>
                Phí giao:{" "}
                <strong>
                  {(returnReq.exchangeShippingFee ?? 0).toLocaleString("vi-VN")}
                  đ
                </strong>
              </span>
              <span className="sm:col-span-2">
                Địa chỉ: <strong>{returnReq.exchangeDeliveryAddress}</strong>
              </span>
            </div>
          )}
        </div>
      )}

      <ReturnProcessTimeline
        status={returnReq.status}
        createdAt={returnReq.createdAt}
        updatedAt={returnReq.updatedAt}
      />

      { }
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        { }
        <div className="lg:col-span-2 space-y-6">
          { }
          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-100/80 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <ShoppingBag size={16} className="text-gray-400" /> Danh sách
                sản phẩm trả lại
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-gray-100">
              {returnReq.items.map((item) => (
                <div
                  key={item.returnItemId}
                  className="p-5 hover:bg-gray-50/20 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                        <span className=" bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          Mã biến thể: {item.sku}
                        </span>
                        <span>
                          Màu:{" "}
                          <span className="text-gray-800">{item.color}</span>
                        </span>
                        <span>
                          Kích cỡ:{" "}
                          <span className="text-gray-800">{item.size}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 sm:text-right shrink-0">
                      <div>
                        <span className="text-[10px] text-gray-400 block mb-0.5">
                          Giá mua gốc / Giá hoàn
                        </span>
                        <div className="flex items-center gap-1 text-xs sm:justify-end">
                          <span className="line-through text-gray-400">
                            {item.originalPrice.toLocaleString("vi-VN")}đ
                          </span>
                          <ArrowRight size={10} className="text-gray-400" />
                          <span className="font-bold text-red-600">
                            {item.refundPrice.toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>
                      <div className="border-l border-gray-100 pl-4">
                        <span className="text-[10px] text-gray-400 block mb-0.5">
                          Số lượng trả
                        </span>
                        <span className="text-sm font-bold text-gray-800 ">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  {item.reason && (
                    <div className="bg-red-50/50 border border-red-100/30 rounded-lg px-3 py-2 text-xs text-red-800 mt-3 flex items-start gap-1.5">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      <p>
                        <span className="font-bold">Lý do đổi hàng:</span>{" "}
                        {item.reason}
                      </p>
                    </div>
                  )}
                  {item.damagedQuantity !== undefined &&
                    item.damagedQuantity > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 text-[11px] text-amber-800 rounded-lg px-3 py-2 mt-2.5 flex items-start gap-1.5">
                      <AlertTriangle
                        size={13}
                        className="mt-0.5 shrink-0 text-amber-600"
                      />
                      <p>
                        <span className="font-bold">Hàng lỗi/hỏng:</span> Phát
                        hiện{" "}
                        <span className="font-bold text-red-600 ">
                          {item.damagedQuantity}
                        </span>{" "}
                        sản phẩm lỗi trong quá trình vận chuyển (đã loại bỏ khỏi
                        tồn kho).
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          {returnReq.returnType === "EXCHANGE" && (
            <Card className="overflow-hidden border-blue-200 shadow-sm">
              <CardHeader className="border-b border-blue-100 bg-blue-50/70 px-6 py-4">
                <CardTitle className="flex items-center justify-between gap-3 text-sm font-bold text-blue-950">
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft size={16} className="text-blue-600" />
                    Sản phẩm giao đổi cho khách
                  </span>
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-white text-[10px] text-blue-700"
                  >
                    {returnReq.exchangeItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )}{" "}
                    sản phẩm
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-blue-50 p-0">
                {returnReq.exchangeItems.length ? (
                  returnReq.exchangeItems.map((item) => (
                    <div
                      key={item.exchangeItemId}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.productName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Màu: <strong>{item.color || "—"}</strong>
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-1">
                            Kích cỡ: <strong>{item.size || "—"}</strong>
                          </span>
                          <span className="rounded-md bg-blue-100 px-2 py-1 font-bold text-blue-700">
                            Số lượng sản phẩm đã được kiểm tra
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-5 sm:text-right">
                        <div className="border-slate-200 pl-5">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            Số lượng giao
                          </p>
                          <p className="mt-1  text-sm font-medium text-slate-900">
                            ×{item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 text-xs font-medium text-amber-700">
                    Yêu cầu đổi hàng chưa có biến thể thay thế. Không nên duyệt
                    trước khi kiểm tra lại dữ liệu.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          { }
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b border-gray-100/80 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <SlidersHorizontal size={16} className="text-gray-400" /> Thao
                tác xử lý yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {returnReq.status === "PENDING" && (
                  <>
                    <Button
                      onClick={handleApprove}
                      disabled={
                        isApproving ||
                        (returnReq.returnType === "EXCHANGE" &&
                          !returnReq.exchangeItems.length)
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle size={15} /> Duyệt yêu cầu & Chờ nhận hàng
                    </Button>
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      variant="destructive"
                      disabled={isRejecting || showRejectForm}
                      className="font-semibold flex items-center gap-1.5"
                    >
                      Từ chối yêu cầu trả
                    </Button>
                  </>
                )}

                {returnReq.status === "APPROVED" && (
                  <Button
                    onClick={() => {
                      const init: Record<number, number> = {};
                      returnReq.items.forEach((item) => {
                        init[item.returnItemId] = 0;
                      });
                      setDamagedQuantities(init);
                      setShowCompleteDialog(true);
                    }}
                    disabled={isCompleting}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw size={15} />{" "}
                    {returnReq.returnType === "EXCHANGE"
                      ? "Hoàn tất nhận hàng & xuất hàng đổi"
                      : "Hoàn tất nhận hàng & hoàn tiền"}
                  </Button>
                )}

                {returnReq.status === "REJECTED" && (
                  <p className="text-xs text-gray-500 italic">
                    Yêu cầu này đã bị từ chối.
                  </p>
                )}
                {returnReq.status === "COMPLETED" && (
                  <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={14} />{" "}
                    {returnReq.returnType === "EXCHANGE"
                      ? "Đã hoàn tất kiểm nhận và tạo phiếu giao sản phẩm đổi cho khách."
                      : "Hoàn tất quy trình hoàn đổi hàng thành công."}
                  </p>
                )}
              </div>

              { }
              {showRejectForm && (
                <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200 mt-4">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-red-700" /> Từ chối
                    yêu cầu đổi hàng
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      rejectForm.handleSubmit();
                    }}
                    className="space-y-3"
                  >
                    <rejectForm.Field
                      name="rejectReason"
                      validators={{
                        onChange: ({ value }) =>
                          !value || value.length < 5
                            ? "Lý do từ chối phải chứa tối thiểu 5 ký tự."
                            : undefined,
                      }}
                      children={(field) => (
                        <div>
                          <Label
                            htmlFor={field.name}
                            className="text-xs font-semibold text-red-700"
                          >
                            Lý do từ chối đổi hàng{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Nhập lý do chi tiết..."
                            className="bg-white border-red-200 focus-visible:ring-red-300 text-xs mt-1.5"
                            rows={3}
                          />
                          {field.state.meta.errors && (
                            <p className="text-xs text-destructive mt-1">
                              {field.state.meta.errors.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    />
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={isRejecting}
                      >
                        Xác nhận Từ chối
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRejectForm(false)}
                      >
                        Bỏ qua
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        { }
        <div className="space-y-6">
          { }
          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-100/80 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FileText size={16} className="text-gray-400" /> Thông tin liên
                quan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              { }
              <div className="space-y-1.5 pb-3 border-b border-gray-100">
                <span className="text-gray-400 block mb-0.5 flex items-center gap-1">
                  <User size={13} /> Khách hàng
                </span>
                <p className="text-sm font-bold text-gray-900">
                  {returnReq.customerName}
                </p>
                <p className="text-gray-500 flex items-center gap-1">
                  <Phone size={12} /> {returnReq.customerPhone}
                </p>
              </div>

              { }
              <div className="space-y-1.5">
                <span className="text-gray-400 block mb-0.5 flex items-center gap-1">
                  <FileText size={13} /> Đơn hàng đặt mua
                </span>
                <p className="text-sm  font-bold text-gray-900">
                  {returnReq.orderCode}
                </p>
                <Button
                  onClick={() => navigate(`/orders/${returnReq.orderId}`)}
                  variant="link"
                  className="p-0 h-auto text-xs text-blue-600 font-semibold gap-1"
                >
                  Xem chi tiết đơn hàng <ArrowRight size={12} />
                </Button>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <span className="text-gray-400 mb-0.5 flex items-center gap-1">
                  <UserCheck size={13} /> Nhân viên xử lý gần nhất
                </span>
                {returnReq.processedByName ? (
                  <>
                    <Link to={`/users/${returnReq.processedById}`}>
                      <Button
                        className="text-sm font-bold px-0 text-gray-900"
                        variant={"link"}
                      >
                        {" "}
                        {returnReq.processedByName}
                      </Button>
                    </Link>
                    {returnReq.processedById !== null && (
                      <p className="text-gray-500 ">
                        Mã nhân viên: #{returnReq.processedById}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic">
                    Chưa có nhân viên xử lý yêu cầu
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          { }
          <Card className="shadow-sm">
            <CardHeader className="border-b border-gray-100/80 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                {returnReq.returnType === "EXCHANGE" ? (
                  <ArrowRightLeft size={16} className="text-blue-500" />
                ) : (
                  <DollarSign size={16} className="text-gray-400" />
                )}
                {returnReq.returnType === "EXCHANGE"
                  ? "Giá trị đổi & Ghi chú"
                  : "Hoàn trả & Ghi chú"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div
                className={`space-y-1 rounded-xl border p-4 ${returnReq.returnType === "EXCHANGE" ? "border-blue-100 bg-blue-50/50" : "border-red-100/50 bg-red-50/30"}`}
              >
                <span
                  className={`mb-0.5 block text-[10px] font-semibold uppercase tracking-wider ${returnReq.returnType === "EXCHANGE" ? "text-blue-800" : "text-red-800"}`}
                >
                  {returnReq.returnType === "EXCHANGE"
                    ? "Giá trị hàng đổi ngang giá"
                    : "Số tiền hoàn trả dự kiến"}
                </span>
                <p
                  className={` text-2xl font-bold ${returnReq.returnType === "EXCHANGE" ? "text-blue-700" : "text-red-600"}`}
                >
                  {returnReq.refundAmount.toLocaleString("vi-VN")}đ
                </p>
              </div>

              {returnReq.note && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <span className="text-gray-400 text-xs block mb-1">
                    Ghi chú đổi hàng
                  </span>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100 italic leading-relaxed">
                    "{returnReq.note}"
                  </p>
                </div>
              )}

              {returnReq.images && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <span className="text-gray-450 text-xs block mb-1 font-semibold">
                    Hình ảnh xác nhận
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {returnReq.images
                      .split(",")
                      .filter(Boolean)
                      .map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative size-16 rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:border-blue-500 transition block"
                        >
                          <img
                            src={url}
                            alt={`Xác nhận ${idx + 1}`}
                            className="size-full object-cover"
                          />
                        </a>
                      ))}
                  </div>
                </div>
              )}

              {returnReq.processedImages && (
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <span className="text-gray-450 text-xs block mb-1 font-semibold text-green-700 flex items-center gap-1">
                    <CheckCircle size={12} /> Ảnh xác nhận nhận hàng
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {returnReq.processedImages
                      .split(",")
                      .filter(Boolean)
                      .map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative size-16 rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:border-green-500 transition block"
                        >
                          <img
                            src={url}
                            alt={`Nhận hàng ${idx + 1}`}
                            className="size-full object-cover"
                          />
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          { }
          {returnReq.status === "REJECTED" && returnReq.rejectReason && (
            <Card className="border-red-200 bg-red-50/30 shadow-sm">
              <CardHeader className="border-b border-red-100/50 px-6 py-4">
                <CardTitle className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle size={16} /> Từ chối yêu cầu đổi hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-xs text-red-700 leading-relaxed font-medium">
                  {returnReq.rejectReason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showDeliveryHistory} onOpenChange={setShowDeliveryHistory}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lịch sử xử lý đơn đổi hàng</DialogTitle>
            <DialogDescription>
              Yêu cầu #{returnReq.returnId}
              {returnReq.exchangeDelivery?.deliveryCode
                ? ` · Phiếu giao ${returnReq.exchangeDelivery.deliveryCode}`
                : " · Chưa tạo phiếu giao hàng đổi"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-blue-950">
                Tạo yêu cầu đổi hàng
              </p>
              <span className="text-[11px] text-blue-700">
                {new Date(returnReq.createdAt).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-blue-100 pt-2">
              <p className="text-sm font-bold text-blue-950">
                Trạng thái xử lý hiện tại: {getStatusLabel(returnReq.status)}
              </p>
              <span className="text-[11px] text-blue-700">
                {new Date(returnReq.updatedAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          <h3 className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Log giao sản phẩm đổi
          </h3>
          {!exchangeDeliveryId ? (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">
              Phiếu giao sản phẩm đổi sẽ được tạo sau khi cửa hàng kiểm nhận
              hàng khách gửi lại và hoàn tất yêu cầu.
            </p>
          ) : deliveryHistoryQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Đang tải lịch sử...
            </div>
          ) : deliveryHistoryQuery.isError ? (
            <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
              Không thể tải lịch sử trạng thái giao hàng đổi.
            </p>
          ) : deliveryHistoryQuery.data?.history?.length ? (
            <div className="space-y-3">
              {[...deliveryHistoryQuery.data.history].reverse().map((event) => (
                <div
                  key={event.logId}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">
                      {event.previousStatus
                        ? `${DELIVERY_STATUS_LABELS[event.previousStatus]} → `
                        : ""}
                      {DELIVERY_STATUS_LABELS[event.currentStatus]}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {new Date(event.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Người xử lý: {event.createdByName || "Hệ thống"}
                  </p>
                  {event.note && (
                    <p className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-700">
                      {event.note}
                    </p>
                  )}
                  {!!event.evidenceImages?.length && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.evidenceImages.map((url, index) => (
                        <a
                          key={`${event.logId}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={url}
                            alt={`Ảnh trạng thái ${index + 1}`}
                            className="size-16 rounded-lg border bg-white object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm italic text-slate-500">
              Chưa có lần chuyển trạng thái nào.
            </p>
          )}
        </DialogContent>
      </Dialog>

      { }
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="text-green-600 animate-spin" size={16} />
                {returnReq.returnType === "EXCHANGE"
                  ? "Nhận hàng trả & xác nhận xuất hàng đổi"
                  : "Xác nhận nhận hàng hoàn & kiểm kho"}
              </h3>
              <button
                onClick={() => setShowCompleteDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 max-h-[55vh] overflow-y-auto">
              <p className="text-[11px] text-gray-500 leading-relaxed bg-blue-50/40 p-3 rounded-lg border border-blue-100/30">
                {returnReq.returnType === "EXCHANGE"
                  ? "Kiểm tra hàng khách gửi lại và số lượng lỗi/hỏng. Khi hoàn tất, hệ thống nhập lại hàng đạt yêu cầu, trừ tồn sản phẩm thay thế và tự tạo phiếu trong mục Giao hàng đổi."
                  : "Vui lòng kiểm kho và nhập số lượng sản phẩm bị lỗi/hỏng (nếu có). Số lượng lỗi sẽ bị loại bỏ khỏi tồn kho hệ thống tự động, khách hàng vẫn được hoàn trả số tiền tương ứng."}
              </p>

              <div className="space-y-2.5">
                {returnReq.items.map((item) => (
                  <div
                    key={item.returnItemId}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                        Màu: {item.color} · Kích cỡ: {item.size} · Tổng nhận:{" "}
                        <span className="text-gray-700 font-bold">
                          x{item.quantity}
                        </span>
                      </p>
                    </div>
                    <div className="w-24 flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-red-600">
                        Lỗi:
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={damagedQuantities[item.returnItemId] ?? 0}
                        onChange={(e) => {
                          const val = Math.min(
                            item.quantity,
                            Math.max(0, Number(e.target.value) || 0),
                          );
                          setDamagedQuantities((prev) => ({
                            ...prev,
                            [item.returnItemId]: val,
                          }));
                        }}
                        className="h-8 text-xs text-center bg-white border-red-100 focus-visible:ring-red-300 rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {returnReq.returnType === "EXCHANGE" && (
                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <ArrowRightLeft size={13} /> Hàng sẽ xuất cho khách
                  </p>
                  {returnReq.exchangeItems.map((item) => (
                    <div
                      key={item.exchangeItemId}
                      className="flex items-center justify-between gap-3 text-[11px] text-blue-800"
                    >
                      <span className="truncate">
                        {item.productName} · {item.color || "—"} /{" "}
                        {item.size || "—"}
                      </span>
                      <strong className="shrink-0">×{item.quantity}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-gray-150">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Camera className="size-3.5 text-gray-400" /> Ảnh xác nhận
                  nhận hàng * (Bắt buộc)
                </Label>
                <p className="text-[10px] text-gray-450">
                  Vui lòng tải lên hình ảnh biên bản nhận hàng hoặc hiện trạng
                  thực tế sản phẩm hoàn trả.
                </p>
                <div className="flex flex-wrap gap-2.5 items-center pt-1">
                  { }
                  {adminPreviews.map((src, index) => (
                    <div
                      key={index}
                      className="relative size-14 rounded-lg border border-gray-200 overflow-hidden shadow-2xs group hover:border-red-500 transition"
                    >
                      <img
                        src={src}
                        alt="Ảnh xem trước"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 transition cursor-pointer"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}

                  { }
                  {adminFiles.length < 5 && (
                    <label className="flex flex-col items-center justify-center size-14 rounded-lg border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/10 cursor-pointer transition text-center p-1.5">
                      <UploadCloud className="size-4.5 text-gray-400" />
                      <span className="text-[8px] text-gray-400 mt-0.5 font-semibold">
                        Tải ảnh
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCompleteDialog(false);
                  setAdminFiles([]);
                  setAdminPreviews([]);
                }}
                className="rounded-lg h-8 text-xs font-semibold"
              >
                Bỏ qua
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg h-8 text-xs"
                onClick={handleCompleteSubmit}
                disabled={isCompleting || isUploadingAdminImages}
              >
                {(isCompleting || isUploadingAdminImages) && (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                )}
                {isUploadingAdminImages
                  ? "Đang tải ảnh..."
                  : returnReq.returnType === "EXCHANGE"
                    ? "Xác nhận & xuất hàng đổi"
                    : "Xác nhận nhận hàng hoàn"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
