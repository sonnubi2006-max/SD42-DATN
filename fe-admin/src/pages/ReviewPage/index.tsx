import { MessageSquare, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminReviews } from "@/hooks/useReview";
import ReviewFilters from "./ReviewFilters";
import ReviewItemCard from "./ReviewItemCard";

type StatusTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "DELETED";

const positiveNumber = (value: string | null) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export default function ReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const fromDate = searchParams.get("fromDate") ?? "";
  const toDate = searchParams.get("toDate") ?? "";
  const ratingValue = positiveNumber(searchParams.get("rating"));
  const selectedRating: number | "ALL" = ratingValue && ratingValue <= 5 ? ratingValue : "ALL";
  const statusValue = searchParams.get("status") as StatusTab | null;
  const statusTab: StatusTab = statusValue && ["PENDING", "APPROVED", "REJECTED", "HIDDEN", "DELETED"].includes(statusValue)
    ? statusValue
    : "ALL";
  const page = Math.max(0, Number(searchParams.get("page")) || 0);

  const updateParams = (updates: Record<string, string | number | undefined>, resetPage = true) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "ALL") next.delete(key);
        else next.set(key, String(value));
      });
      if (resetPage) next.delete("page");
      return next;
    }, { replace: true });
  };

  const { data: reviewPage, isLoading } = useAdminReviews({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    status: statusTab === "ALL" ? undefined : statusTab,
    rating: selectedRating === "ALL" ? undefined : selectedRating,
    keyword: keyword.trim() || undefined,
    page,
    size: 10,
  });

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          Quản lý Đánh giá & Bình luận
        </h1>
        <p className="mt-1 text-sm text-gray-500">Xem xét và kiểm duyệt đánh giá sản phẩm của khách hàng.</p>
      </div>

      <Card className="overflow-hidden border border-gray-150 bg-white shadow-sm">
        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 bg-gray-50/20 px-6 pt-3">
          {([
            ["ALL", "Tất cả đánh giá"], ["PENDING", "Chờ duyệt"], ["APPROVED", "Đã hiển thị"], ["HIDDEN", "Đã ẩn"],
            ["REJECTED", "Từ chối"], ["DELETED", "Người dùng đã xóa"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => updateParams({ status: key })}
              className={`shrink-0 whitespace-nowrap border-b-2 px-3 pb-3 text-sm font-semibold ${statusTab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <ReviewFilters
          keyword={keyword}
          fromDate={fromDate}
          toDate={toDate}
          selectedRating={selectedRating}
          onChange={(name, value) => updateParams({ [name]: value })}
          onReset={() => setSearchParams({}, { replace: true })}
        />

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-xs text-gray-400">Đang tải danh sách đánh giá...</p>
            </div>
          ) : !reviewPage?.content?.length ? (
            <div className="py-16 text-center text-xs text-gray-400">Không tìm thấy đánh giá phù hợp.</div>
          ) : (
            <div className="divide-y divide-gray-150 bg-white">
              {reviewPage.content.map((review) => <ReviewItemCard key={review.reviewId} review={review} />)}
            </div>
          )}
        </CardContent>

        {reviewPage && reviewPage.totalPages > 1 && (
          <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/20 p-4">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => updateParams({ page: page - 1 }, false)}>Trang trước</Button>
            <span className="self-center px-2 text-xs text-gray-400">Trang {page + 1} / {reviewPage.totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= reviewPage.totalPages - 1} onClick={() => updateParams({ page: page + 1 }, false)}>Trang sau</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
