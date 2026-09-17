import { ArrowUpRight, MessageSquareText, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { TopRatedProductStatistic } from "@/api/orderApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  items?: TopRatedProductStatistic[];
  isLoading: boolean;
}

const rankClass = (rank: number) => {
  if (rank === 1) return "bg-amber-500 text-white";
  if (rank === 2) return "bg-slate-300 text-slate-800";
  if (rank === 3) return "bg-amber-700 text-amber-50";
  return "bg-slate-100 text-slate-500";
};

export default function TopRatedProducts({ items, isLoading }: Props) {
  return (
    <Card className="flex h-full flex-col border border-gray-100 bg-white">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-extrabold text-gray-900">
            Sản phẩm được đánh giá cao nhất
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Xếp theo điểm trung bình, ưu tiên sản phẩm có nhiều đánh giá
          </CardDescription>
        </div>
        <Link
          to="/reviews"
          className="flex items-center gap-0.5 text-xs font-bold text-primary hover:underline"
        >
          Đánh giá
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 pt-0 pb-5">
        {isLoading || !items ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4">
                <div className="size-6 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted/65" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-xs text-muted-foreground">
            Chưa có đánh giá đã duyệt trong khoảng thời gian này
          </div>
        ) : (
          <div className="w-full divide-y divide-border">
            {items.map((item, index) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-xl px-2 py-3 first:pt-0 last:pb-0 hover:bg-muted/30"
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium shadow-xs ${rankClass(index + 1)}`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/reviews?keyword=${encodeURIComponent(item.productName)}`}
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <MessageSquareText className="size-3 text-primary" />
                    {item.reviewCount.toLocaleString("vi-VN")} lượt đánh giá
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center justify-end gap-1 text-base font-medium text-amber-600">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    {item.averageRating.toFixed(1)}
                  </p>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    trên 5 sao
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
