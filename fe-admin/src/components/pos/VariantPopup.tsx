import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Plus, X } from "lucide-react";
import type { ProductResponse } from "@/api/productApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import { money, availableStock } from "./posUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductResponse | null;
  onSelectVariant: (variant: ProductVariantResponse) => void;
}

export default function VariantPopup({
  open,
  onOpenChange,
  product,
  onSelectVariant,
}: Props) {
  if (!product) return null;

  const totalStock = product.variants.reduce(
    (sum, v) => sum + availableStock(v),
    0,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Package size={18} className="text-blue-500 shrink-0" />
                <span className="truncate">{product.productName}</span>
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs">
                {product.variants.length} biến thể · Tồn kho: {totalStock}
              </SheetDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {product.variants.map((variant) => {
            const available = availableStock(variant);
            const img =
              variant.image?.imageUrl ?? product.images?.[0]?.imageUrl ?? "";
            const canAdd = available > 0;

            return (
              <div
                key={variant.variantId}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                  canAdd
                    ? "border-gray-100 hover:border-blue-300 hover:shadow-md cursor-pointer active:scale-[0.98]"
                    : "border-gray-100 opacity-40"
                }`}
                onClick={() => {
                  if (canAdd) {
                    onSelectVariant(variant);
                    onOpenChange(false);
                  }
                }}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <Package size={22} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1">
                    {variant.color && (
                      <Badge variant="outline" className="h-5 text-[10px]">
                        {variant.color}
                      </Badge>
                    )}
                    {variant.size && (
                      <Badge variant="outline" className="h-5 text-[10px]">
                        Size {variant.size}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400">
                    Mã: {variant.variantCode}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {variant.salePrice && variant.salePrice < variant.price ? (
                      <>
                        <span className="text-sm font-bold text-red-600">
                          {money(variant.salePrice)}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-through">
                          {money(variant.price)}
                        </span>
                        {variant.discountPercentage && variant.discountPercentage > 0 && (
                          <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-semibold text-red-600">
                            -{variant.discountPercentage}%
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-bold text-blue-600">
                        {money(variant.price)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={canAdd ? "success" : "destructive"}
                    className="text-[10px]"
                  >
                    Kho: {available}
                  </Badge>
                  {canAdd && (
                    <div className="flex items-center gap-0.5 text-[10px] font-medium text-green-600">
                      <Plus size={10} />
                      Thêm
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
