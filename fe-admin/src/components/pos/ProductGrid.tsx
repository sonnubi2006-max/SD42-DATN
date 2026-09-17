import { useState } from "react";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProductResponse } from "@/api/productApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import { money, availableStock, unitPrice } from "./posUtils";
import VariantPopup from "./VariantPopup";

interface Props {
  products: (ProductResponse & { variants: ProductVariantResponse[] })[];
  isLoading: boolean;
  onAddToCart: (variant: ProductVariantResponse) => void;
}

function getProductTotalStock(product: ProductResponse) {
  return product.variants.reduce((sum, v) => sum + availableStock(v), 0);
}

function getProductMinPrice(product: ProductResponse) {
  return Math.min(...product.variants.map((v) => unitPrice(v)));
}

export default function ProductGrid({ products, isLoading, onAddToCart }: Props) {
  const [variantPopupOpen, setVariantPopupOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);

  const handleProductClick = (product: ProductResponse) => {
    setSelectedProduct(product);
    setVariantPopupOpen(true);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto rounded-xl border bg-white p-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            Dang tai...
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">Khong tim thay san pham</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

              const hasDiscount = product.variants.some((v) => v.salePrice && v.salePrice < v.price);
              const maxDiscountPercent = Math.max(...product.variants.map((v) => v.discountPercentage ?? 0));

              return (
                <button key={product.productId} onClick={() => handleProductClick(product)} disabled={totalStock <= 0}
                  className="group flex flex-col rounded-xl border border-gray-100 p-2 text-left transition hover:border-blue-300 hover:shadow-sm disabled:opacity-40">
                  <div className="relative mb-2 aspect-square overflow-hidden rounded-lg bg-gray-100 w-full">
                    {img ? <img src={img} alt={product.productName} className="h-full w-full object-cover transition group-hover:scale-105" />
                      : <div className="flex h-full items-center justify-center text-gray-300"><Package size={28} /></div>}
                    {hasDiscount && maxDiscountPercent > 0 && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded shadow-sm">
                        -{maxDiscountPercent}%
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs font-semibold text-gray-800" title={product.productName}>{product.productName}</p>

                  <div className="mt-1 flex-1 flex flex-col justify-end">
                    {hasDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-red-600 leading-tight">{saleLabel}</span>
                        <span className="text-[9px] text-gray-400 line-through leading-none mt-0.5">{origLabel}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-blue-600 leading-tight">{origLabel}</span>
                    )}
                    <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-400">
                      <span>{product.variants.length} biến thể</span>
                      <span>Kho: {totalStock}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <VariantPopup open={variantPopupOpen} onOpenChange={setVariantPopupOpen} product={selectedProduct} onSelectVariant={onAddToCart} />
    </>
  );
}