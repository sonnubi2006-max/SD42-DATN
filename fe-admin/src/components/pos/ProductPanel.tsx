import { useState, useMemo } from "react";
import { Plus, ShoppingBag, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { ProductResponse } from "@/api/productApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import { money, availableStock, variantMatchesKeyword } from "./posUtils";
import VariantPopup from "./VariantPopup";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategoryList } from "@/hooks/useCategory";
import { useBrandList } from "@/hooks/useBrand";
import { useProductList, useProductPriceRange } from "@/hooks/useProduct";
import { useAddPosItem } from "@/hooks/usePosDraft";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface Props {
  activeDraftId: number | null;
}

function getProductTotalStock(product: ProductResponse) {
  return product.variants.reduce((s, v) => s + availableStock(v), 0);
}

export default function ProductPanel({ activeDraftId }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricePopoverOpen, setPricePopoverOpen] = useState(false);

  const { data: priceRangeData } = useProductPriceRange();
  const minLimit = priceRangeData?.min ?? 0;
  const maxLimit = priceRangeData?.max ?? 10_000_000;

  const sliderMin = minPrice === "" ? minLimit : Number(minPrice);
  const sliderMax = maxPrice === "" ? maxLimit : Number(maxPrice);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);

  const { data: categoryList } = useCategoryList({ status: "ACTIVE", size: 80 });
  const { data: brandList } = useBrandList({ status: "ACTIVE", size: 80 });
  const { data: productPage, isLoading } = useProductList({
    categoryId: categoryId === "all" ? null : Number(categoryId),
    brandId: brandId === "all" ? null : Number(brandId),
    minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : null,
    maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : null,
    status: "ACTIVE",
    size: 200,
  });

  const { mutate: addItem } = useAddPosItem();

  const products = useMemo(() => {
    const q = debouncedSearch.trim();
    return (productPage?.content ?? [])
      .map((p) => ({
        ...p,
        variants: (p.variants ?? []).filter((v) => v.status === "ACTIVE"),
      }))
      .filter((p) => p.variants.length > 0)
      .filter((p) => p.variants.some((v) => variantMatchesKeyword(p, v, q)));
  }, [debouncedSearch, productPage]);

  const handleAddToCart = (v: ProductVariantResponse) => {
    if (!activeDraftId) {
      toast.error("Hãy tạo đơn chờ trước");
      return;
    }
    addItem(
      {
        orderId: activeDraftId,
        request: { variantId: v.variantId, quantity: 1 },
      },
      { onError: (e: any) => toast.error(e?.apiMessage ?? "Thêm thất bại") },
    );
  };

  const hasActiveFilter = categoryId !== "all" || brandId !== "all" || !!minPrice || !!maxPrice;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {}
      <div className="flex-shrink-0 space-y-3 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm, mã hàng, mã vạch..."
            className="pl-9 h-10 text-sm bg-muted/40 border-0 focus-visible:ring-1"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {}
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border bg-muted/20 p-3">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-9 w-40 text-xs bg-background border-border">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categoryList?.content.map((c) => (
                <SelectItem key={c.categoryId} value={String(c.categoryId)}>
                  {c.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger className="h-9 w-40 text-xs bg-background border-border">
              <SelectValue placeholder="Thương hiệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thương hiệu</SelectItem>
              {brandList?.content.map((b) => (
                <SelectItem key={b.brandId} value={String(b.brandId)}>
                  {b.brandName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {}
          <Popover open={pricePopoverOpen} onOpenChange={setPricePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs bg-background border-border cursor-pointer"
              >
                <SlidersHorizontal size={13} />
                Khoảng giá
                {(minPrice !== "" || maxPrice !== "") && (
                  <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>{money(sliderMin)}</span>
                  <span className="text-gray-300">—</span>
                  <span>{money(sliderMax)}</span>
                </div>

                <Slider
                  value={[sliderMin, sliderMax]}
                  onValueChange={(v) => {
                    setMinPrice(String(v[0]));
                    setMaxPrice(String(v[1]));
                  }}
                  min={minLimit}
                  max={maxLimit}
                  step={50_000}
                />

                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>{money(minLimit)}</span>
                  <span>{money(maxLimit)}</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-[11px] text-destructive hover:text-destructive cursor-pointer hover:bg-red-50/50"
              onClick={() => {
                setCategoryId("all");
                setBrandId("all");
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              <X size={13} className="mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto rounded-xl border bg-card">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground py-20">
            <ShoppingBag size={40} className="opacity-20 text-indigo-600" />
            <p className="text-sm font-semibold">Không tìm thấy sản phẩm</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const totalStock = getProductTotalStock(product);
              const img = product.images?.[0]?.imageUrl ?? "";

              const origPrices = product.variants.map((v) => v.price);
              const minOrig = Math.min(...origPrices);
              const maxOrig = Math.max(...origPrices);
              const origLabel = minOrig === maxOrig ? money(minOrig) : `${money(minOrig)} - ${money(maxOrig)}`;

              const salePrices = product.variants.map((v) => v.salePrice ?? v.price);
              const minSale = Math.min(...salePrices);
              const maxSale = Math.max(...salePrices);
              const saleLabel = minSale === maxSale ? money(minSale) : `${money(minSale)} - ${money(maxSale)}`;

              const discountPercents = product.variants
                .filter((v) => v.salePrice && v.salePrice < v.price && (v.discountPercentage ?? 0) > 0)
                .map((v) => v.discountPercentage!);
              const hasDiscount = discountPercents.length > 0;
              const minDiscountPercent = hasDiscount ? Math.min(...discountPercents) : 0;
              const maxDiscountPercent = hasDiscount ? Math.max(...discountPercents) : 0;
              const discountPercentLabel = minDiscountPercent === maxDiscountPercent
                ? `-${minDiscountPercent}%`
                : `-${minDiscountPercent}% ~ -${maxDiscountPercent}%`;

              return (
                <button
                  key={product.productId}
                  onClick={() => setSelectedProduct(product)}
                  disabled={totalStock <= 0}
                  className="group relative flex flex-col rounded-xl border border-border bg-background p-3.5 text-left shadow-xs transition-all hover:border-indigo-350 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {}
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-muted w-full">
                    {img ? (
                      <img
                        src={img}
                        alt={product.productName}
                        className="h-full w-full object-cover transition-transform duration-350 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/30">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                    {}
                    {totalStock > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/80 opacity-0 transition-opacity group-hover:opacity-100 rounded-lg">
                        <Plus size={28} className="text-white" />
                      </div>
                    )}
                    {}
                    {totalStock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45">
                        <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded shadow-sm">
                          Hết hàng
                        </span>
                      </div>
                    )}
                    {}
                    {hasDiscount && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded shadow-sm z-10">
                        {discountPercentLabel}
                      </span>
                    )}
                  </div>

                  {}
                  <p className="truncate font-bold leading-snug text-sm text-gray-900 w-full" title={product.productName}>
                    {product.productName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {product.variants.length} biến thể
                  </p>
                  <div className="mt-2.5 flex-1 flex flex-col justify-end w-full">
                    {hasDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground line-through leading-none">
                          {origLabel}
                        </span>
                        <span className="text-sm font-extrabold text-rose-600 leading-tight mt-0.5">
                          {saleLabel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-extrabold text-indigo-700 leading-tight">
                        {origLabel}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground border-t border-gray-50 pt-1.5">
                      <span>Kho: {totalStock}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <VariantPopup
        open={!!selectedProduct}
        onOpenChange={(o) => !o && setSelectedProduct(null)}
        product={selectedProduct}
        onSelectVariant={(v) => {
          handleAddToCart(v);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
