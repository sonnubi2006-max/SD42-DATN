import React, { useRef, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Layers } from "lucide-react";
import { type ProductResponse } from "@/api/productApi";
import { useProducts, useTopRatedProducts } from "@/hooks/useCatalog";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SimilarProductSliderProps {
  currentProductId: number;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
}

export default function SimilarProductSlider({
  currentProductId,
  categoryId,
  categoryName,
  brandId,
}: SimilarProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch products by category
  const { data: categoryData, isLoading: loadingCat } = useProducts({
    categoryId: categoryId || undefined,
    size: 12,
  });

  // Fallback to top rated products if category has few items
  const { data: topRatedData, isLoading: loadingTop } = useTopRatedProducts(8);

  const products: ProductResponse[] = useMemo(() => {
    const list = (categoryData?.content ?? []).filter(
      (p) => p.productId !== currentProductId,
    );

    if (list.length >= 4) return list;

    // Supplement with top rated products if needed
    const topList = (topRatedData ?? []).filter(
      (p) =>
        p.productId !== currentProductId &&
        !list.some((existing) => existing.productId === p.productId),
    );

    return [...list, ...topList];
  }, [categoryData, topRatedData, currentProductId]);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [products]);

  const slide = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.75;
    const offset = direction === "left" ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const isLoading = loadingCat && loadingTop;

  if (isLoading) {
    return (
      <div className="mt-16 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-60 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[240px] shrink-0 space-y-3">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-border/80">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Sản phẩm tương tự
            </h2>
          </div>
          {categoryName && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 ml-3 flex items-center gap-1.5 font-medium">
              <Layers className="size-3.5 text-primary" />
              <span>Gợi ý các sản phẩm cùng danh mục</span>
              <span className="font-semibold text-foreground">"{categoryName}"</span>
            </p>
          )}
        </div>

        {/* Counter Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border/60">
          <Sparkles className="size-3.5 text-amber-500" />
          <span>{products.length} sản phẩm tương tự</span>
        </div>
      </div>

      {/* Slider Track Container with Centered Left/Right Navigation Buttons */}
      <div className="relative group/slider">
        {/* Left Side Navigation Button */}
        {products.length > 3 && (
          <button
            type="button"
            onClick={() => slide("left")}
            disabled={!canScrollLeft}
            className={cn(
              "absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/95 hover:bg-background shadow-lg border border-border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md hover:scale-110 active:scale-95 text-foreground hover:text-primary",
              canScrollLeft
                ? "opacity-95 hover:opacity-100"
                : "opacity-0 pointer-events-none"
            )}
            title="Xem sản phẩm trước"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}

        {/* Right Side Navigation Button */}
        {products.length > 3 && (
          <button
            type="button"
            onClick={() => slide("right")}
            disabled={!canScrollRight}
            className={cn(
              "absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-background/95 hover:bg-background shadow-lg border border-border flex items-center justify-center transition-all cursor-pointer backdrop-blur-md hover:scale-110 active:scale-95 text-foreground hover:text-primary",
              canScrollRight
                ? "opacity-95 hover:opacity-100"
                : "opacity-0 pointer-events-none"
            )}
            title="Xem sản phẩm tiếp theo"
          >
            <ChevronRight className="size-5" />
          </button>
        )}

        {/* Horizontal Slider Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((item) => (
            <div
              key={item.productId}
              className="w-[200px] sm:w-[220px] md:w-[240px] shrink-0 snap-start flex flex-col h-full self-stretch"
            >
              <ProductCard product={item} className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
