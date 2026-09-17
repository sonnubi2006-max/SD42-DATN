import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import {
  type ProductResponse,
  productMinPrice,
  productMaxPrice,
  productOriginalPrice,
  productMaxOriginalPrice,
  productThumbnail,
} from "@/api/productApi";
import {
  discountPercent,
  formatCurrency,
  resolveImageUrl,
} from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import RatingStars from "./RatingStars";
import { cn } from "@/lib/utils";

export default function ProductCard({
  product,
  className,
}: {
  product: ProductResponse;
  className?: string;
}) {
  const price = productMinPrice(product);
  const maxPrice = productMaxPrice(product);
  const originalMin = productOriginalPrice(product);
  const originalMax = productMaxOriginalPrice(product);

  const hasDiscount =
    (originalMin != null && price != null && originalMin > price) ||
    (originalMax != null && maxPrice != null && originalMax > maxPrice);

  const percent =
    originalMin && price && originalMin > price
      ? discountPercent(originalMin, price)
      : 0;
  const img = resolveImageUrl(productThumbnail(product));

  const priceText =
    price != null && maxPrice != null && price !== maxPrice
      ? `${formatCurrency(price)} - ${formatCurrency(maxPrice)}`
      : price != null
        ? formatCurrency(price)
        : "Liên hệ";

  const discountText = hasDiscount
    ? originalMin != null && originalMax != null && originalMin !== originalMax
      ? `${formatCurrency(originalMin)} - ${formatCurrency(originalMax)}`
      : originalMin != null
        ? formatCurrency(originalMin)
        : null
    : null;

  return (
    <Link
      to={`/products/${encodeURIComponent(product.productCode)}/${product.productSlug}`}
      className={cn(
        "group flex flex-col h-full overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={product.productName}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        {percent > 0 && (
          <Badge className="absolute left-2 top-2 bg-destructive text-white text-[10px] font-extrabold px-1.5 py-0.5">
            -{percent}%
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1 p-3">
        <div>
          {/* Brand Row - Uniform height */}
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground truncate h-4 leading-4 block font-medium">
            {product.brand?.brandName || "\u00A0"}
          </span>

          {/* Product Title - Uniform 2-line height */}
          <h3
            className="line-clamp-2 text-sm font-medium leading-snug h-10 text-foreground group-hover:text-primary transition-colors mt-0.5"
            title={product.productName}
          >
            {product.productName}
          </h3>

          {/* Rating Row - Uniform height */}
          <div className="flex items-center gap-1.5 h-5 mt-1">
            <RatingStars value={Number(product.averageRating ?? 0)} />
            {product.averageRating ? (
              <span className="text-xs text-muted-foreground font-medium">
                {Number(product.averageRating).toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Price & Sold Row - Perfectly aligned at bottom */}
        <div className="mt-2 pt-2 border-t border-border/40 flex items-end justify-between gap-1.5">
          <div className="flex flex-col min-w-0 flex-1">
            <span
              className="font-bold text-foreground text-xs sm:text-sm leading-tight truncate"
              title={priceText}
            >
              {priceText}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground line-through h-4 leading-4 truncate block font-normal">
              {discountText || "\u00A0"}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 pb-0.5 font-medium">
            Đã bán {product.totalSold ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
