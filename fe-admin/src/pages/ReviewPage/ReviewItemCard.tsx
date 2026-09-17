import { useState } from "react";
import {
  Star,
  CheckCircle,
  EyeOff,
  Calendar,
  AlertTriangle,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  useApproveReview,
  useHideReview,
} from "@/hooks/useReview";
import { type ReviewResponse } from "@/api/reviewApi";
import { resolveImageUrl } from "@/utils/format";

interface ReviewItemCardProps {
  review: ReviewResponse;
}

export default function ReviewItemCard({ review }: ReviewItemCardProps) {
  const { mutate: approve, isPending: approving } = useApproveReview();
  const { mutate: hide, isPending: hiding } = useHideReview();

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (config: {
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
  }) => {
    setConfirmConfig({
      ...config,
      isOpen: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Chờ duyệt</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-50 text-green-700 border-green-200">Đã phê duyệt</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-50 text-red-700 border-red-200">Bị từ chối</Badge>;
      case "HIDDEN":
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Đã ẩn</Badge>;
      case "DELETED":
        return <Badge className="bg-red-50 text-red-600 border-red-100">Đã bị người dùng xóa</Badge>;
      default:
        return null;
    }
  };

  const handleApprove = () => {
    approve(review.reviewId);
  };

  const handleHide = () => {
    triggerConfirm({
      title: "Ẩn đánh giá công khai",
      description: "Đánh giá này sẽ bị ẩn khỏi trang chi tiết sản phẩm. Bạn có chắc chắn muốn ẩn?",
      confirmText: "Ẩn đánh giá",
      onConfirm: () => hide(review.reviewId),
    });
  };

  const requiresModeration = review.status === "PENDING";

  return (
    <div className="p-6 hover:bg-gray-50/50 transition duration-150 flex flex-col md:flex-row justify-between gap-6 items-start">
      {}
      <div className="flex-1 space-y-3 min-w-0">
        {}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 border border-gray-100 shrink-0">
            <AvatarImage src={resolveImageUrl(review.userAvatar)} />
            <AvatarFallback className="bg-blue-50 text-blue-600 font-semibold text-xs">
              {review.userName?.charAt(0) || <UserIcon className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              {review.userName || "Khách hàng"}
              {review.verifiedPurchase && (
                <span className="text-[10px] bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.2 rounded font-semibold">
                  Đã mua hàng
                </span>
              )}
            </p>
            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        {}
        <div className="text-xs text-gray-500 font-medium">
          Sản phẩm:{" "}
          <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
            {review.productName}
          </span>
          {(review.color || review.size) && (
            <span className="text-gray-400 font-normal">
              {" • "}
              {review.color && `Màu: ${review.color}`}
              {review.size && ` - Kích cỡ: ${review.size}`}
            </span>
          )}
        </div>

        {}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-4 w-4 ${
                s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
              }`}
            />
          ))}
        </div>

        {}
        <div className="space-y-1">
          <p className="text-xs text-gray-800 leading-relaxed font-sans whitespace-pre-line">
            {review.comment || <span className="text-gray-400 italic">Không có bình luận chữ</span>}
          </p>

          {}
          {requiresModeration && (
            <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1.5 rounded-lg w-fit">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Hệ thống phát hiện nội dung nhạy cảm. Đánh giá đang chờ quản trị viên xem xét.</span>
            </div>
          )}

          {review.sizeFeedback && (
            <p className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
              Thông tin kích thước: <b>{review.sizeFeedback}</b>
            </p>
          )}
        </div>

        {}
        {review.images && review.images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {review.images.map((img, idx) => (
              <img
                key={idx}
                src={resolveImageUrl(img)}
                alt="Review attachment"
                className="h-16 w-16 object-cover rounded-lg border border-gray-200 hover:scale-105 active:scale-95 transition cursor-pointer shadow-sm"
              />
            ))}
          </div>
        )}
      </div>

      {}
      <div className="flex flex-col items-end gap-3 shrink-0 self-stretch md:self-auto justify-between">
        {getStatusBadge(review.status)}

        <div className="flex gap-2">
          {}
          {review.status !== "APPROVED" && review.status !== "DELETED" && (
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={approving}
              className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs h-8 px-3 flex items-center gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Duyệt
            </Button>
          )}

          {}
          {}
          {review.status === "APPROVED" && (
            <Button
              size="sm"
              onClick={handleHide}
              disabled={hiding}
              variant="outline"
              className="border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-xs h-8 px-3 flex items-center gap-1"
            >
              <EyeOff className="h-3.5 w-3.5" /> Ẩn
            </Button>
          )}

        </div>
      </div>

      {}
      <AlertDialog
        open={confirmConfig.isOpen}
        onOpenChange={(open) => setConfirmConfig((prev) => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmConfig.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                confirmConfig.onConfirm();
                setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {confirmConfig.confirmText || "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
