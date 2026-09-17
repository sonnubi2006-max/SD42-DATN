import type { ProductResponse } from "@/api/productApi";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products?: ProductResponse[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyText?: string;
}

export default function ProductGrid({
  products,
  isLoading,
  skeletonCount = 8,
  emptyText = "Không tìm thấy sản phẩm nào.",
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.productId} product={p} />
      ))}
    </div>
  );
}
