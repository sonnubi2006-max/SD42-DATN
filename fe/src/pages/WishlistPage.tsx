import { Link } from "react-router-dom";
import { Heart, ImageOff, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "@/components/common/Pagination";
import { useState } from "react";
import {
  useClearWishlist,
  useRemoveWishlist,
  useWishlist,
} from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { formatCurrency, resolveImageUrl } from "@/utils/format";

export default function WishlistPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useWishlist({ page, size: 12 });
  const { mutate: remove } = useRemoveWishlist();
  const { mutate: clear, isPending: clearing } = useClearWishlist();
  const { mutate: addToCart } = useAddToCart();

  const items = data?.content ?? [];

  if (!isLoading && !items.length) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20 text-center">
        <Heart className="size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Chưa có sản phẩm yêu thích</h1>
        <Button asChild className="mt-6">
          <Link to="/products">Khám phá sản phẩm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sản phẩm yêu thích</h1>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={clearing}
            onClick={() => clear()}
          >
            <Trash2 className="mr-1 size-4" /> Xoá tất cả
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const img = resolveImageUrl(item.imageUrl);
          const isDiscontinued = item.productStatus === "INACTIVE" || item.variantStatus === "INACTIVE";
          const isOutOfStock = !isDiscontinued && (item.stockQuantity === undefined || item.stockQuantity <= 0);
          const hasDiscount = item.salePrice !== undefined && item.salePrice < item.price;

          return (
            <Card key={item.wishlistId} className={`overflow-hidden relative group transition-all duration-300 hover:shadow-md ${isDiscontinued ? 'opacity-75' : ''}`}>
              <div className="relative aspect-square overflow-hidden bg-slate-50">
                <Link to={isDiscontinued ? "#" : `/products/${encodeURIComponent(item.productCode)}/${item.productSlug}`} className={isDiscontinued ? "pointer-events-none" : ""}>
                  {img ? (
                    <img
                      src={img}
                      alt={item.productName}
                      className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${isDiscontinued ? "grayscale blur-[1px]" : ""}`}
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-slate-400 bg-slate-100">
                      <ImageOff className="size-8" />
                    </div>
                  )}
                </Link>

                {}
                {isDiscontinued && (
                  <div className="absolute top-2 right-2 z-10 rounded bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Ngừng bán
                  </div>
                )}
                {isOutOfStock && (
                  <div className="absolute top-2 right-2 z-10 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    Hết hàng
                  </div>
                )}
                {hasDiscount && !isDiscontinued && item.discountPercentage !== undefined && item.discountPercentage > 0 && (
                  <div className="absolute top-2 left-2 z-10 rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                    -{item.discountPercentage}%
                  </div>
                )}
              </div>

              <CardContent className="space-y-2 p-3.5">
                <Link
                  to={isDiscontinued ? "#" : `/products/${encodeURIComponent(item.productCode)}/${item.productSlug}`}
                  className={`line-clamp-2 text-xs font-semibold hover:text-indigo-600 transition-colors ${
                    isDiscontinued ? "text-slate-400 pointer-events-none" : "text-slate-800"
                  }`}
                >
                  {item.productName}
                </Link>

                <p className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded w-fit font-medium">
                  {[item.color, item.size].filter(Boolean).join(" • ")}
                </p>

                {}
                <div className="flex items-baseline gap-1.5 h-6">
                  {hasDiscount && !isDiscontinued ? (
                    <>
                      <span className="text-sm font-bold text-rose-600">
                        {formatCurrency(item.salePrice!)}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through">
                        {formatCurrency(item.price)}
                      </span>
                    </>
                  ) : (
                    <span className={`text-sm font-bold ${isDiscontinued ? "text-slate-400" : "text-slate-900"}`}>
                      {formatCurrency(item.price)}
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 text-xs cursor-pointer"
                    disabled={isDiscontinued || isOutOfStock}
                    onClick={() =>
                      addToCart({ variantId: item.variantId, quantity: 1 })
                    }
                  >
                    <ShoppingBag className="mr-1 size-3.5" />
                    {isDiscontinued ? "Ngừng bán" : isOutOfStock ? "Hết hàng" : "Thêm"}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-8 cursor-pointer text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                    onClick={() => remove(item.variantId)}
                    title="Xóa khỏi danh sách yêu thích"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data && (
        <Pagination
          className="mt-8"
          currentPage={data.number}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
