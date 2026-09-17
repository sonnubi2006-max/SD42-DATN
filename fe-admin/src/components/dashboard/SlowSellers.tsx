import { ShoppingBag, ArrowUpRight, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface ProductItem {
  productId: number;
  productName: string;
  quantity: number;
  revenue: number;
}

interface SlowSellersProps {
  slowProducts: ProductItem[] | undefined;
  isLoading: boolean;
}

export default function SlowSellers({
  slowProducts,
  isLoading,
}: SlowSellersProps) {
  const money = (n: number) => {
    return (n ?? 0).toLocaleString("vi-VN") + "đ";
  };

  return (
    <Card className="h-full flex flex-col justify-between border border-gray-100 bg-white">
      <CardHeader className="flex flex-row justify-between items-start space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
            <TrendingDown className="size-4.5 text-rose-500" />
            Sản phẩm bán chậm
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            5 sản phẩm thời trang có doanh số thấp nhất
          </CardDescription>
        </div>
        <Link
          to="/products"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
        >
          Kho hàng
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-start pt-0 pb-5">
        {isLoading || !slowProducts ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex gap-4 items-center">
                <div className="size-6 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/65 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-muted/40 rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : slowProducts.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg text-xs text-muted-foreground">
            Chưa có dữ liệu sản phẩm
          </div>
        ) : (
          <div className="divide-y divide-border w-full">
            {slowProducts.map((p, index) => (
              <div
                key={p.productId}
                className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-muted/30 px-2 rounded-xl transition-all duration-200"
              >
                <div className="shrink-0">
                  <span className="flex items-center justify-center size-6 rounded-full bg-rose-100 text-rose-700 font-bold text-xs">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${p.productId}`}
                    className="block truncate text-sm font-semibold text-foreground transition hover:text-primary hover:underline"
                    title={`Mở sản phẩm ${p.productName}`}
                  >
                    {p.productName}
                  </Link>
                  <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                    <ShoppingBag className="size-3 text-rose-500" />
                    Bán được {p.quantity} chiếc
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    {money(p.revenue)}
                  </span>
                  <p className="text-xs text-rose-500 font-bold mt-0.5">
                    Doanh thu thấp
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
