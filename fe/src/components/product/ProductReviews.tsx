import { useState, useRef } from "react";
import { useProductReviews, useReviewSummary } from "@/hooks/useReview";
import RatingStars from "@/components/product/RatingStars";
import type { ReviewSummaryResponse } from "@/api/reviewApi";
import { resolveImageUrl } from "@/utils/format";
import { formatDate } from "@/utils/dateUtils";
import Pagination from "@/components/common/Pagination";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  CheckCircle2,
  ImageIcon,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STAR_ROWS: {
  star: number;
  countKey: keyof ReviewSummaryResponse;
}[] = [
  { star: 5, countKey: "fiveStar" },
  { star: 4, countKey: "fourStar" },
  { star: 3, countKey: "threeStar" },
  { star: 2, countKey: "twoStar" },
  { star: 1, countKey: "oneStar" },
];

export default function ProductReviews({ productId }: { productId: number }) {
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);

  const { data: summary } = useReviewSummary(productId);
  const { data: reviews, isLoading } = useProductReviews(productId, {
    size: 5,
    rating: activeRating ?? undefined,
    page: currentPage,
  });

  const handleRatingFilter = (star: number | null) => {
    setActiveRating(star);
    setCurrentPage(0);
    scrollToReviews();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToReviews();
  };

  const scrollToReviews = () => {
    if (reviewsContainerRef.current) {
      reviewsContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  const totalReviews = summary?.reviewCount ?? 0;

  return (
    <div
      ref={reviewsContainerRef}
      className="space-y-8 border-t border-border/80 pt-10"
    >
      {}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Đánh giá từ khách hàng
        </h3>
        <p className="text-xs text-muted-foreground">
          Ý kiến nhận xét khách quan từ khách hàng đã mua sản phẩm này.
        </p>
      </div>

      {}
      <Card className="overflow-hidden border border-border/60 bg-gradient-to-br from-slate-50/40 to-indigo-50/10 dark:from-slate-900/10 dark:to-slate-900/5">
        <CardContent className="p-6 grid gap-6 md:grid-cols-3">
          {}
          <div className="flex flex-col items-center justify-center text-center md:border-r md:border-border/60 py-2">
            <p className="text-6xl font-medium tracking-tight text-foreground bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {summary?.averageRating
                ? Number(summary.averageRating).toFixed(1)
                : "0.0"}
            </p>
            <div className="mt-2 flex items-center justify-center">
              <RatingStars value={summary?.averageRating ?? 0} size={20} />
            </div>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              {totalReviews} đánh giá thực tế
            </p>
          </div>

          {}
          <div className="flex flex-col justify-center space-y-2 md:col-span-2 md:pl-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Chi tiết đánh giá
            </p>
            <div className="space-y-1.5">
              {STAR_ROWS.map((row) => {
                const count = Number(summary?.[row.countKey] ?? 0);
                const percent =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div
                    key={row.star}
                    className="flex items-center gap-2.5 text-xs text-foreground/80"
                  >
                    <span className="w-8 font-semibold flex items-center gap-0.5 justify-end shrink-0">
                      {row.star}{" "}
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative shadow-inner">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="w-12 text-muted-foreground font-medium shrink-0">
                      {count} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Lọc theo số sao
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeRating === null ? "default" : "outline"}
            onClick={() => handleRatingFilter(null)}
            className={cn(
              "rounded-full text-xs font-semibold h-8.5 px-4 shadow-2xs",
              activeRating === null &&
                "bg-primary hover:bg-primary/95 text-primary-foreground shadow-sm",
            )}
          >
            Tất cả ({totalReviews})
          </Button>
          {STAR_ROWS.map((row) => {
            const count = Number(summary?.[row.countKey] ?? 0);
            const isActive = activeRating === row.star;
            return (
              <Button
                key={row.star}
                size="sm"
                variant={isActive ? "default" : "outline"}
                disabled={count === 0}
                onClick={() => handleRatingFilter(row.star)}
                className={cn(
                  "rounded-full text-xs font-semibold h-8.5 px-4 shadow-2xs gap-1",
                  isActive &&
                    "bg-amber-500 hover:bg-amber-500/90 text-white shadow-sm",
                )}
              >
                {row.star}{" "}
                <Star
                  className={cn(
                    "h-3.5 w-3.5 fill-current",
                    isActive ? "text-white" : "text-amber-500",
                  )}
                />
                <span>({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4 py-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="space-y-3 rounded-2xl border border-border/80 p-5 bg-white"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !reviews?.content?.length ? (
          <Card className="border border-dashed border-border/80 py-16 text-center bg-slate-50/10">
            <CardContent className="flex flex-col items-center justify-center p-0">
              <div className="rounded-full bg-muted p-4 text-muted-foreground/60">
                <Star className="size-6 text-gray-300" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                Không tìm thấy đánh giá nào
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thử điều chỉnh bộ lọc khác để hiển thị thêm bình luận.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.content.map((r) => {
              const nameInitial = r.userName
                ? r.userName.charAt(0).toUpperCase()
                : "?";
              return (
                <Card
                  key={r.reviewId}
                  className="rounded-2xl border border-border/60 bg-white p-5 shadow-2xs hover:shadow-xs transition duration-200 hover:border-gray-300/85"
                >
                  <CardContent className="p-0 space-y-3.5">
                    <div className="flex items-start justify-between gap-4">
                      {}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border border-indigo-50 shrink-0 select-none">
                          <AvatarImage src={resolveImageUrl(r.userAvatar)} />
                          <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-sm">
                            {nameInitial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <p className="font-bold text-xs text-gray-800">
                              {r.userName || "Khách hàng"}
                            </p>
                            {r.verifiedPurchase && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-50 rounded px-1.5 py-0"
                              >
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 mr-0.5" />{" "}
                                Đã mua hàng
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <RatingStars value={r.rating} size={12} />
                          </div>
                          {(r.color || r.size) && (
                            <p className="text-[10px] text-muted-foreground font-semibold">
                              Phân loại:{" "}
                              {[
                                r.color && `Màu ${r.color}`,
                                r.size && `Kích thước ${r.size}`,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      {}
                      <span className="text-[10px] text-muted-foreground font-semibold bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>

                    {}
                    {r.sizeFeedback && (
                      <div className="inline-flex items-center gap-1 rounded bg-slate-50 border border-slate-100 px-2.5 py-1 text-[10px] text-muted-foreground">
                        <span>Cảm nhận kích cỡ:</span>
                        <span className="font-bold text-gray-700">
                          {r.sizeFeedback}
                        </span>
                      </div>
                    )}

                    {}
                    <p className="text-xs leading-relaxed text-gray-700 font-sans font-medium whitespace-pre-line">
                      {r.comment}
                    </p>

                    {}
                    {r.images?.length ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {r.images.map((img) => (
                          <div
                            key={img}
                            onClick={() =>
                              setZoomImage(resolveImageUrl(img) ?? null)
                            }
                            className="relative size-16 shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-border transition duration-200 hover:scale-102 hover:border-gray-400"
                          >
                            <img
                              src={resolveImageUrl(img)}
                              alt="Ảnh đánh giá"
                              className="size-full object-cover"
                            />
                            <div className="absolute right-1 bottom-1 rounded bg-black/50 p-0.5 text-[8px] text-white backdrop-blur-xs">
                              <ImageIcon className="h-2.5 w-2.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}

            {}
            {reviews.totalPages > 1 && (
              <div className="mt-6 border-t border-border/60 pt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={reviews.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {}
      <Dialog
        open={!!zoomImage}
        onOpenChange={(open) => !open && setZoomImage(null)}
      >
        <DialogContent className="max-w-[90vw] md:max-w-3xl overflow-hidden p-0 border-none bg-transparent shadow-none [&>button]:text-white [&>button]:bg-black/40 [&>button]:hover:bg-black/60 [&>button]:rounded-full [&>button]:size-8">
          <DialogTitle className="sr-only">Phóng to ảnh đánh giá</DialogTitle>
          <DialogDescription className="sr-only">
            Xem ảnh đánh giá chi tiết chất lượng sản phẩm
          </DialogDescription>
          {zoomImage && (
            <div className="flex items-center justify-center p-4">
              <img
                src={zoomImage}
                alt="Ảnh đánh giá phóng to"
                className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
