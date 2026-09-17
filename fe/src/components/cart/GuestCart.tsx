import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageOff, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import productApi, { variantEffectivePrice } from "@/api/productApi";
import { formatCurrency, resolveImageUrl } from "@/utils/format";
import useCheckoutStore from "@/store/checkoutStore";
import useGuestCartStore from "@/store/guestCartStore";

export default function GuestCart() {
  const navigate = useNavigate();
  const items = useGuestCartStore((state) => state.items);
  const updateQuantity = useGuestCartStore((state) => state.updateQuantity);
  const removeItem = useGuestCartStore((state) => state.removeItem);
  const clear = useGuestCartStore((state) => state.clear);
  const setCheckoutItems = useCheckoutStore((state) => state.setItems);
  const [checkingStock, setCheckingStock] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (!items.length) return;
    setCheckingStock(true);
    try {
      const productIds = [
        ...new Set(
          items
            .map((item) => item.productId)
            .filter((id): id is number => id != null),
        ),
      ];
      const variantGroups = await Promise.all(
        productIds.map((productId) => productApi.getVariants(productId)),
      );
      const variants = variantGroups.flat();

      for (const item of items) {
        const variant = variants.find(
          (candidate) => candidate.variantId === item.variantId,
        );
        if (!variant || variant.status !== "ACTIVE") {
          toast.error(`${item.productName} đã ngừng kinh doanh`);
          return;
        }
        const availableStock = Math.max(
          0,
          variant.availableStock ?? variant.stockQuantity ?? 0,
        );
        if (item.quantity > availableStock) {
          toast.error(
            `${item.productName} không đủ hàng. Bạn chọn ${item.quantity}, hiện chỉ còn ${availableStock}`,
          );
          return;
        }
      }

      setCheckoutItems(
        items.map((item) => {
          const variant = variants.find(
            (candidate) => candidate.variantId === item.variantId,
          );
          return variant
            ? {
                ...item,
                price: variantEffectivePrice(variant),
                originalPrice: variant.price,
                stockQuantity: Math.max(
                  0,
                  variant.availableStock ?? variant.stockQuantity ?? 0,
                ),
              }
            : item;
        }),
      );
      navigate("/checkout");
    } catch {
      toast.error("Không thể kiểm tra tồn kho, vui lòng thử lại");
    } finally {
      setCheckingStock(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Giỏ hàng trống</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bạn có thể mua hàng mà không cần đăng nhập.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Giỏ hàng ({items.length})</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Giỏ hàng dành cho khách vãng lai
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          Xóa tất cả
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="divide-y p-0">
            {items.map((item) => {
              const imageUrl = resolveImageUrl(item.imageUrl);
              return (
                <div key={item.variantId} className="flex gap-4 p-4">
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.productName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.color, item.size].filter(Boolean).join(" • ")}
                    </p>
                    <p className="mt-2 font-bold text-orange-600">
                      {formatCurrency(item.price)}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={item.quantity >= item.stockQuantity}
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Xóa ${item.productName}`}
                    onClick={() => removeItem(item.variantId)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardContent className="space-y-4 p-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <strong>{formatCurrency(total)}</strong>
            </div>
            <p className="text-xs text-muted-foreground">
              Phí vận chuyển và ưu đãi sẽ được tính ở bước tiếp theo.
            </p>
            <Button
              className="w-full"
              disabled={checkingStock}
              onClick={handleCheckout}
            >
              {checkingStock && <Loader2 className="mr-2 size-4 animate-spin" />}
              Thanh toán không cần đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
