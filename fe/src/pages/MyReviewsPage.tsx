import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, Calendar, CheckCircle2, MessageSquare, PackageCheck, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/common/Pagination";
import RatingStars from "@/components/product/RatingStars";
import ReviewForm from "@/components/review/ReviewForm";
import {
  useCreateReview,
  useDeleteReview,
  useMyReviews,
  useMyUnreviewedProducts,
} from "@/hooks/useReview";
import { resolveImageUrl } from "@/utils/format";
import { formatDate } from "@/utils/dateUtils";
import AccountLayout from "@/components/account/AccountLayout";
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

export default function MyReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderDetailId = Number(searchParams.get("orderDetailId") ?? "0");
  const productNameParam = searchParams.get("productName") || "sản phẩm đã mua";

  const [page, setPage] = useState(0);
  const [unreviewedPage, setUnreviewedPage] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"unreviewed" | "reviewed">("unreviewed");
  const [hoveredStars, setHoveredStars] = useState<Record<number, number>>({});

  const { data, isLoading } = useMyReviews({ page, size: 10 });
  const { data: unreviewedData, isLoading: loadingUnreviewed } =
    useMyUnreviewedProducts({ page: unreviewedPage, size: 6 });
  const { mutate: remove } = useDeleteReview();
  const { mutate: createReview, isPending: creating } = useCreateReview();

  const reviews = data?.content ?? [];
  const unreviewedProducts = unreviewedData?.content ?? [];
  const reviewsTotal = data?.totalElements ?? 0;
  const unreviewedTotal = unreviewedData?.totalElements ?? 0;

  const openReviewForm = (item: (typeof unreviewedProducts)[number], ratingVal?: number) => {
    const params: Record<string, string> = {
      orderDetailId: String(item.orderDetailId),
      productName: item.productName,
    };
    if (ratingVal) {
      params.rating = String(ratingVal);
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    searchParams.delete("orderDetailId");
    searchParams.delete("productName");
    searchParams.delete("rating");
    setSearchParams(searchParams);
  };

  const initialRatingParam = Number(searchParams.get("rating") ?? "0");

  const reviewForm = orderDetailId > 0 && (
    <div className="mb-6">
      <ReviewForm
        key={orderDetailId}
        orderDetailId={orderDetailId}
        productName={productNameParam}
        initialRating={initialRatingParam}
        isPending={creating}
        onCancel={closeForm}
        onSubmit={(payload, files) =>
          createReview(
            { payload, files },
            {
              onSuccess: () => {
                closeForm();
                setActiveTab("reviewed");
              },
            },
          )
        }
      />
    </div>
  );

  return (
    <AccountLayout>
      <div className="space-y-6">
        <div className="border-b border-border/50 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Đánh giá của tôi</h1>
          <p className="text-sm text-muted-foreground">Xem lại và quản lý lịch sử đánh giá sản phẩm của bạn</p>
        </div>

        {reviewForm}

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("unreviewed")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === "unreviewed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <PackageCheck className="size-4" />
            Chờ đánh giá
            {unreviewedTotal > 0 && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold transition-all",
                activeTab === "unreviewed"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {unreviewedTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("reviewed")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer",
              activeTab === "reviewed"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="size-4" />
            Lịch sử đánh giá
            {reviewsTotal > 0 && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold transition-all",
                activeTab === "reviewed"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {reviewsTotal}
              </span>
            )}
          </button>
        </div>

        {activeTab === "unreviewed" && (
          <section className="space-y-4">
            {loadingUnreviewed ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : unreviewedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-12 px-4 text-center bg-muted/5">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <PackageCheck className="size-8" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">Tuyệt vời!</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Bạn đã hoàn thành đánh giá cho tất cả các sản phẩm đã mua.
                </p>
                <Button size="sm" className="mt-4 rounded-xl cursor-pointer" onClick={() => navigate("/")}>
                  Tiếp tục mua sắm
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {unreviewedProducts.map((item) => {
                    const image = resolveImageUrl(item.imageUrl);
                    return (
                      <Card key={item.orderDetailId} className="shadow-2xs border border-border/60 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 bg-card group rounded-2xl">
                        <CardContent className="flex gap-4 p-4">
                          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                            {image ? (
                              <img
                                src={image}
                                alt={item.productName}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="size-full bg-muted flex items-center justify-center text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <Link
                                to={`/products/${encodeURIComponent(item.productCode)}/${item.productSlug}`}
                                className="line-clamp-2 text-sm font-semibold hover:text-primary transition-colors leading-snug"
                              >
                                {item.productName}
                              </Link>

                              <div className="mt-1.5 flex flex-wrap gap-1 text-xs">
                                {item.color && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/40">
                                    Màu: {item.color}
                                  </span>
                                )}
                                {item.size && (
                                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/40">
                                    Kích cỡ: {item.size}
                                  </span>
                                )}
                                <Link to={`/orders/${item.orderId}`}>
                                  <span className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10 border border-primary/10 transition-colors">
                                    Đơn hàng: #{item.orderCode}
                                  </span>
                                </Link>
                              </div>

                              {item.completedAt && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                                  <Calendar className="size-3" />
                                  <span>Nhận hàng ngày: {formatDate(item.completedAt)}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
                              {/* Quick interactive rating stars */}
                              <div
                                className="flex items-center gap-0.5"
                                onMouseLeave={() => setHoveredStars(prev => ({ ...prev, [item.orderDetailId]: 0 }))}
                              >
                                <span className="text-[10px] font-medium text-muted-foreground mr-1.5">Đánh giá nhanh:</span>
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const isHovered = star <= (hoveredStars[item.orderDetailId] || 0);
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onMouseEnter={() => setHoveredStars(prev => ({ ...prev, [item.orderDetailId]: star }))}
                                      onClick={() => openReviewForm(item, star)}
                                      className="p-0.5 transition-transform hover:scale-115 active:scale-90 cursor-pointer animate-in fade-in duration-150"
                                    >
                                      <Star
                                        className={cn(
                                          "size-4.5 transition-all duration-150",
                                          isHovered
                                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                            : "text-muted-foreground/35 hover:text-amber-300"
                                        )}
                                      />
                                    </button>
                                  );
                                })}
                              </div>

                              <Button
                                size="sm"
                                className="h-8 cursor-pointer rounded-xl font-semibold bg-primary hover:bg-primary/90 text-xs px-4"
                                onClick={() => openReviewForm(item)}
                              >
                                Đánh giá ngay
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {unreviewedData && unreviewedData.totalPages > 1 && (
                  <Pagination
                    className="pt-4"
                    currentPage={unreviewedData.number}
                    totalPages={unreviewedData.totalPages}
                    onPageChange={setUnreviewedPage}
                  />
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "reviewed" && (
          <section className="space-y-4 animate-in fade-in duration-250">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 w-full animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 py-12 text-center bg-muted/5">
                <div className="rounded-full bg-muted p-3 text-muted-foreground">
                  <MessageSquare className="size-8" />
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground">Bạn chưa gửi đánh giá nào.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => {
                  const img = resolveImageUrl(r.productImageUrl);
                  return (
                    <Card key={r.reviewId} className="border border-border/60 hover:border-border transition-colors rounded-2xl shadow-2xs bg-card">
                      <CardContent className="flex gap-4 p-4">
                        {img ? (
                          <Link
                            to={`/products/${encodeURIComponent(r.productCode)}/${r.productSlug}`}
                            className="size-16 shrink-0 overflow-hidden rounded-xl border bg-muted group"
                          >
                            <img src={img} alt={r.productName} className="size-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </Link>
                        ) : (
                          <div className="size-16 shrink-0 rounded-xl border bg-muted" />
                        )}
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/products/${encodeURIComponent(r.productCode)}/${r.productSlug}`}
                              className="font-bold text-sm hover:text-primary transition-colors leading-snug truncate"
                            >
                              {r.productName}
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(r.reviewId)}
                              className="cursor-pointer h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {r.orderId && r.orderCode && (
                              <Link to={`/orders/${r.orderId}`}>
                                <span className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 font-semibold text-primary hover:bg-primary/10 border border-primary/10 transition-colors">
                                  Đơn hàng: #{r.orderCode}
                                </span>
                              </Link>
                            )}
                            {r.color && (
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground border border-border/40">
                                Màu: {r.color}
                              </span>
                            )}
                            {r.size && (
                              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground border border-border/40">
                                Kích cỡ: {r.size}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-2">
                            <RatingStars value={r.rating} size={13} />
                            <span className="text-[10px] text-muted-foreground">
                              {formatDate(r.createdAt)}
                            </span>
                            {r.verifiedPurchase && (
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/50">
                                ✓ Đã mua hàng
                              </span>
                            )}
                            {r.status === "PENDING" ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                <AlertTriangle className="size-3" /> Chờ duyệt
                              </span>
                            ) : r.status === "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                <CheckCircle2 className="size-3" /> Đã hiển thị
                              </span>
                            ) : r.status === "HIDDEN" ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                <AlertTriangle className="size-3" /> Đã ẩn
                              </span>
                            ) : null}
                          </div>

                          {r.sizeFeedback && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Phản hồi kích cỡ: <span className="text-foreground">{r.sizeFeedback}</span>
                            </p>
                          )}
                          <p className="text-xs text-foreground leading-relaxed pt-0.5 bg-muted/20 p-2.5 rounded-xl border border-border/30">{r.comment}</p>

                          {r.images && r.images.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {r.images.map((src, index) => (
                                <a
                                  key={index}
                                  href={resolveImageUrl(src)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="size-12 overflow-hidden rounded-lg border border-border hover:opacity-90 transition shrink-0"
                                >
                                  <img src={resolveImageUrl(src)} alt="Ảnh đính kèm đánh giá" className="size-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {data && data.totalPages > 1 && (
              <Pagination
                className="mt-6"
                currentPage={data.number}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            )}
          </section>
        )}
      </div>

      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đánh giá của bạn?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này sẽ ẩn đánh giá khỏi cửa hàng và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId !== null) {
                  remove(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-red-650 hover:bg-red-700 text-white"
            >
              Xóa đánh giá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AccountLayout>
  );
}
