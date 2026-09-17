import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  useReturnDetail,
  useApproveReturn,
  useRejectReturn,
  useCompleteReturn,
} from "@/hooks/useReturn";
import { toast } from "sonner";
import type { ReturnStatus } from "@/api/returnApi";

import ReturnDetailsInfo from "./ReturnDetailsInfo";
import ReturnDetailsItems from "./ReturnDetailsItems";

interface ReturnDetailsModalProps {
  returnId: number | null;
  onClose: () => void;
}

export default function ReturnDetailsModal({ returnId, onClose }: ReturnDetailsModalProps) {
  const activeReturnId = returnId ?? 0;
  const { data: returnReq, isLoading } = useReturnDetail(returnId);
  const { mutate: approve, isPending: isApproving } = useApproveReturn();
  const { mutate: reject, isPending: isRejecting } = useRejectReturn();
  const { mutate: complete, isPending: isCompleting } = useCompleteReturn();

  const [showRejectForm, setShowRejectForm] = useState(false);

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
      PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
      APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
      REJECTED: "bg-red-50 text-red-700 border-red-200",
      COMPLETED: "bg-green-50 text-green-700 border-green-200",
    };
    return map[status] || "bg-gray-50 text-gray-700";
  };

  const handleApprove = () => {
    approve(activeReturnId, {
      onSuccess: () => {
        toast.success("Duyệt yêu cầu thành công. Đang đợi nhận hàng hoàn trả.");
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Không thể duyệt yêu cầu");
      },
    });
  };

  const handleComplete = () => {
    complete({ id: activeReturnId }, {
      onSuccess: () => {
        toast.success("Xác nhận đã nhận hàng hoàn trả và hoàn tiền cho khách thành công!");
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Không thể hoàn tất yêu cầu");
      },
    });
  };

  const rejectForm = useForm({
    defaultValues: {
      rejectReason: "",
    },
    onSubmit: async ({ value }) => {
      reject(
        { id: activeReturnId, rejectReason: value.rejectReason },
        {
          onSuccess: () => {
            toast.success("Đã từ chối yêu cầu đổi hàng của khách");
            setShowRejectForm(false);
          },
          onError: (err: any) => {
            toast.error(err?.message ?? "Thao tác thất bại");
          },
        }
      );
    },
  });

  if (!returnId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        { }
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Chi tiết yêu cầu đổi hàng</h2>
              {returnReq && (
                <Badge variant="outline" className={getStatusColor(returnReq.status)}>
                  {getStatusLabel(returnReq.status)}
                </Badge>
              )}
            </div>
            {returnReq && (
              <p className="text-xs text-gray-400  mt-0.5">Yêu cầu #{returnReq.returnId}</p>
            )}
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <X size={18} />
          </Button>
        </div>

        { }
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Đang tải chi tiết yêu cầu...</p>
            </div>
          ) : !returnReq ? (
            <p className="text-center py-10 text-gray-400 text-sm">Không tìm thấy yêu cầu đổi hàng</p>
          ) : (
            <>
              { }
              <ReturnDetailsInfo
                customerName={returnReq.customerName}
                customerPhone={returnReq.customerPhone}
                orderCode={returnReq.orderCode}
                createdAt={returnReq.createdAt}
              />

              { }
              <ReturnDetailsItems items={returnReq.items} />

              { }
              <div className="bg-blue-50/20 border border-blue-100/50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Số tiền đề nghị hoàn trả</span>
                  <span className="text-lg font-bold text-red-600 ">
                    {returnReq.refundAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                {returnReq.note && (
                  <div className="text-right text-xs max-w-xs text-gray-500 italic">
                    "{returnReq.note}"
                  </div>
                )}
              </div>

              { }
              {returnReq.status === "REJECTED" && returnReq.rejectReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                  <h4 className="text-xs font-bold text-red-800 flex items-center gap-1">
                    <AlertTriangle size={14} /> Lý do từ chối đổi hàng:
                  </h4>
                  <p className="text-xs text-red-700 leading-relaxed">{returnReq.rejectReason}</p>
                </div>
              )}

              { }
              {showRejectForm && (
                <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <h4 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle size={16} /> Từ chối yêu cầu đổi hàng
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
                          <Label htmlFor={field.name} className="text-xs font-medium text-red-700">
                            Lý do từ chối đổi hàng <span className="text-destructive">*</span>
                          </Label>
                          <Textarea
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            placeholder="Nhập lý do chi tiết để thông báo khách hàng..."
                            className="bg-white border-red-200 focus-visible:ring-red-300 text-xs mt-1"
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
                    <div className="flex gap-2">
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
            </>
          )}
        </div>

        { }
        {returnReq && !isLoading && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
            <div>
              {returnReq.status === "PENDING" && (
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="destructive"
                  disabled={isRejecting || showRejectForm}
                >
                  Từ chối yêu cầu
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onClose} variant="outline">
                Đóng
              </Button>

              {returnReq.status === "PENDING" && (
                <Button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" /> Duyệt & Nhận hàng
                </Button>
              )}

              {returnReq.status === "APPROVED" && (
                <Button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" /> Hoàn thành nhận hàng & Hoàn tiền
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
