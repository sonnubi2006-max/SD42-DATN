import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, Loader2, Minus, Plus, ShoppingBag, ShieldCheck, RefreshCw, Truck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ProductGallery from "@/components/product/ProductGallery";
import ProductReviews from "@/components/product/ProductReviews";
import RatingStars from "@/components/product/RatingStars";
import SimilarProductSlider from "@/components/product/SimilarProductSlider";
import { useProductByCode } from "@/hooks/useCatalog";
import { useAddToCart } from "@/hooks/useCart";
import { useToggleWishlist, useWishlistExists } from "@/hooks/useWishlist";
import useAuthStore from "@/store/authStore";
import useCheckoutStore from "@/store/checkoutStore";
import useGuestCartStore from "@/store/guestCartStore";
import {
  type ProductVariantResponse,
  variantEffectivePrice,
} from "@/api/productApi";
import { discountPercent, formatCurrency } from "@/utils/format";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { productCode, slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, refetch: refetchProduct } = useProductByCode(productCode);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const { mutate: addToCart, isPending: adding } = useAddToCart();
  const addGuestItem = useGuestCartStore((state) => state.addItem);
  const { mutate: toggleWishlist } = useToggleWishlist();

  const [color, setColor] = useState<string>();
  const [size, setSize] = useState<string>();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product && slug !== product.productSlug) {
      navigate(
        `/products/${encodeURIComponent(product.productCode)}/${product.productSlug}`,
        { replace: true },
      );
    }
  }, [navigate, product, slug]);

  const activeVariants = useMemo(
    () => (product?.variants ?? []).filter((v) => v.status === "ACTIVE"),
    [product],
  );

  const colors = useMemo(
    () =>
      [
        ...new Set(activeVariants.map((v) => v.color).filter(Boolean)),
      ] as string[],
    [activeVariants],
  );
  const sizes = useMemo(
    () =>
      [
        ...new Set(activeVariants.map((v) => v.size).filter(Boolean)),
      ] as string[],
    [activeVariants],
  );

  const selectedVariant: ProductVariantResponse | undefined = useMemo(() => {
    if (!activeVariants.length) return undefined;
    return activeVariants.find(
      (v) =>
        (colors.length === 0 || v.color === color) &&
        (sizes.length === 0 || v.size === size),
    );
  }, [activeVariants, color, size, colors.length, sizes.length]);

  const { data: inWishlist } = useWishlistExists(selectedVariant?.variantId);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const prodImgs = product.images.map((i) => i.imageUrl);
    if (selectedVariant && selectedVariant.image?.imageUrl) {
      return [selectedVariant.image.imageUrl, ...prodImgs];
    }
    return prodImgs;
  }, [product, selectedVariant]);

  const uniqueImages = useMemo(() => [...new Set(galleryImages)], [galleryImages]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng kinh doanh.
      </div>
    );
  }

  const price = selectedVariant
    ? variantEffectivePrice(selectedVariant)
    : activeVariants.length
      ? Math.min(...activeVariants.map(variantEffectivePrice))
      : null;
  const maxPrice = selectedVariant
    ? null
    : activeVariants.length
      ? Math.max(...activeVariants.map(variantEffectivePrice))
      : null;
  const originalMin = selectedVariant
    ? selectedVariant.price
    : activeVariants.length
      ? Math.min(...activeVariants.map((v) => v.price))
      : null;
  const originalMax = selectedVariant
    ? null
    : activeVariants.length
      ? Math.max(...activeVariants.map((v) => v.price))
      : null;

  const hasDiscount = selectedVariant
    ? (originalMin != null && price != null && originalMin > price)
    : (originalMin != null && price != null && originalMin > price) ||
      (originalMax != null && maxPrice != null && originalMax > maxPrice);

  const percent = (originalMin && price && originalMin > price) ? discountPercent(originalMin, price) : 0;
  const stock = selectedVariant
    ? Math.max(0, selectedVariant.availableStock ?? selectedVariant.stockQuantity ?? 0)
    : 0;
  const needsSelection =
    (colors.length > 0 && !color) || (sizes.length > 0 && !size);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    if (!isAuthenticated) {
      addGuestItem({
        cartItemId: selectedVariant.variantId,
        variantId: selectedVariant.variantId,
        productId: product.productId,
        productName: product.productName,
        imageUrl: selectedVariant.image?.imageUrl,
        color: selectedVariant.color,
        size: selectedVariant.size,
        price: variantEffectivePrice(selectedVariant),
        originalPrice: selectedVariant.price,
        quantity: qty,
        stockQuantity: stock,
      });
      toast.success("Đã thêm vào giỏ hàng dành cho khách vãng lai");
      return;
    }
    addToCart({ variantId: selectedVariant.variantId, quantity: qty });
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedVariant) return;
    toggleWishlist(selectedVariant.variantId);
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) return;

    const refreshed = await refetchProduct();
    const freshVariant = refreshed.data?.variants.find(
      (variant) => variant.variantId === selectedVariant.variantId,
    );
    if (!freshVariant || freshVariant.status !== "ACTIVE") {
      toast.error("Sản phẩm đã ngừng kinh doanh");
      return;
    }
    const freshAvailableStock = Math.max(
      0,
      freshVariant.availableStock ?? freshVariant.stockQuantity ?? 0,
    );
    if (qty > freshAvailableStock) {
      toast.error(
        `Sản phẩm không đủ hàng. Bạn chọn ${qty}, hiện chỉ còn ${freshAvailableStock}`,
      );
      return;
    }

    const checkoutItem = {
      cartItemId: 0,
      variantId: selectedVariant.variantId,
      productId: product.productId,
      productName: product.productName,
      imageUrl: freshVariant.image?.imageUrl,
      color: freshVariant.color,
      size: freshVariant.size,
      price: variantEffectivePrice(freshVariant),
      originalPrice: freshVariant.price,
      quantity: qty,
      stockQuantity: freshAvailableStock,
    };

    useCheckoutStore.getState().setItems([checkoutItem]);
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {}
      <nav className="mb-6 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="hover:text-foreground cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
        <ChevronRight className="size-3" />
        <span className="hover:text-foreground cursor-pointer" onClick={() => navigate("/products")}>Sản phẩm</span>
        {product.brand?.brandName && (
          <>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-semibold">{product.brand.brandName}</span>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-12">
        {}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <ProductGallery
              images={uniqueImages.length ? uniqueImages : [""]}
              alt={product.productName}
            />
          </div>
        </div>

        {}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            {product.brand?.brandName && (
              <Badge variant="outline" className="border-indigo-200 bg-indigo-50/50 text-indigo-700 font-semibold dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300">
                {product.brand.brandName}
              </Badge>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
              {product.productName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <RatingStars value={Number(product.averageRating ?? 0)} size={16} />
                <span className="font-semibold text-foreground">
                  {product.averageRating ? Number(product.averageRating).toFixed(1) : "0.0"}
                </span>
              </div>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground hover:text-foreground cursor-pointer underline transition-colors">
                Xem tất cả đánh giá
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground">
                Đã bán <span className="font-bold text-foreground">{product.totalSold ?? 0}</span> sản phẩm
              </span>
            </div>
          </div>

          {}
          <div className="rounded-2xl bg-slate-50/50 p-5 dark:bg-slate-900/20 border border-border/60">
            <div className="flex flex-col gap-1.5">
              <span className="text-3xl font-extrabold text-foreground tracking-tight">
                {price != null && maxPrice != null && price !== maxPrice
                  ? `${formatCurrency(price)} - ${formatCurrency(maxPrice)}`
                  : price != null
                  ? formatCurrency(price)
                  : "Liên hệ"}
              </span>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {selectedVariant
                      ? formatCurrency(originalMin!)
                      : originalMin != null && originalMax != null && originalMin !== originalMax
                      ? `${formatCurrency(originalMin)} - ${formatCurrency(originalMax)}`
                      : originalMin != null
                      ? formatCurrency(originalMin)
                      : null}
                  </span>
                  {percent > 0 && (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                      Giảm {percent}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {}
          <div className="space-y-5">
            {}
            {colors.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-foreground">
                  Màu sắc: {color ? <span className="text-indigo-600 dark:text-indigo-400 font-bold">{color}</span> : <span className="text-muted-foreground font-normal">Chưa chọn</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                        color === c
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {}
            {sizes.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-foreground">
                  Kích thước: {size ? <span className="text-indigo-600 dark:text-indigo-400 font-bold">{size}</span> : <span className="text-muted-foreground font-normal">Chưa chọn</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "cursor-pointer min-w-12 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200",
                        size === s
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-background text-foreground hover:bg-muted/50"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Số lượng mua</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl border border-border bg-background overflow-hidden shadow-2xs">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none h-10 w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-3.5" />
                </Button>
                <Input
                  className="w-12 rounded-none border-none text-center text-sm font-bold focus-visible:ring-0 h-10 p-0"
                  value={qty}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, "");
                    if (raw === "") return;
                    const parsed = Number(raw);
                    const next = Math.min(Math.max(Math.trunc(parsed), 1), selectedVariant ? stock : 999);
                    setQty(next);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-none h-10 w-10 text-muted-foreground hover:text-foreground"
                  disabled={!!selectedVariant && qty >= stock}
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
              {selectedVariant ? (
                <span className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full",
                  stock > 0
                    ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400"
                )}>
                  {stock > 0 ? `Còn ${stock} sản phẩm trong kho` : "Hết hàng tạm thời"}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Vui lòng chọn phân loại để xem tồn kho</span>
              )}
            </div>
          </div>

          {}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl cursor-pointer h-12 shadow-sm font-bold text-sm border-primary text-primary hover:bg-primary/5"
              size="lg"
              disabled={
                adding || needsSelection || !selectedVariant || stock <= 0
              }
              onClick={handleAddToCart}
            >
              {adding ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ShoppingBag className="mr-2 size-4" />
              )}
              {needsSelection
                ? "Thêm vào giỏ hàng"
                : stock <= 0
                ? "Hết hàng"
                : "Thêm vào giỏ hàng"}
            </Button>

            <Button
              className="flex-1 rounded-xl cursor-pointer h-12 shadow-sm font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              disabled={
                needsSelection || !selectedVariant || stock <= 0
              }
              onClick={handleBuyNow}
            >
              Mua ngay
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-xl cursor-pointer h-12 w-12 shrink-0 border-border hover:bg-muted/40 hover:text-rose-600 transition-colors"
              onClick={handleWishlist}
              disabled={!selectedVariant}
            >
              <Heart
                className={cn(
                  "size-5 transition-transform group-hover:scale-110",
                  inWishlist && "fill-rose-600 text-rose-600",
                )}
              />
            </Button>
          </div>

          {}
          <div className="grid grid-cols-3 gap-3 border-t border-b border-border/80 py-5">
            <div className="flex flex-col items-center text-center p-2 space-y-1.5">
              <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <ShieldCheck className="size-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">100% Chính Hãng</span>
              <span className="text-[10px] text-muted-foreground">Cam kết hoàn tiền x10</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 space-y-1.5">
              <div className="rounded-full bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <RefreshCw className="size-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Đổi Trả 7 Ngày</span>
              <span className="text-[10px] text-muted-foreground">Miễn phí đổi trả nhanh</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 space-y-1.5">
              <div className="rounded-full bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Truck className="size-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">Giao Hỏa Tốc</span>
              <span className="text-[10px] text-muted-foreground">Nhận hàng từ 2 - 3 ngày</span>
            </div>
          </div>

          {}
          {product.description && (
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-bold text-foreground">Mô tả sản phẩm</h3>
              <div className="rounded-2xl border border-border/60 bg-slate-50/20 p-5 dark:bg-slate-900/10">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="mt-16">
        <ProductReviews productId={product.productId} />
      </div>

      {/* Similar Products Slider */}
      <SimilarProductSlider
        currentProductId={product.productId}
        categoryId={product.category?.categoryId}
        categoryName={product.category?.categoryName}
        brandId={product.brand?.brandId}
      />
    </div>
  );
}
