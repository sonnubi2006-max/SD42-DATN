import { Link, useNavigate } from "react-router-dom";
import {
  ImageOff,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useCart,
  useCartTotal,
  useClearCart,
  useDecreaseCartItem,
  useIncreaseCartItem,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/hooks/useCart";
import type { CartEntityItem } from "@/api/cartApi";
import { formatCurrency, resolveImageUrl } from "@/utils/format";
import useCheckoutStore, { toCheckoutItem } from "@/store/checkoutStore";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/authStore";
import GuestCart from "@/components/cart/GuestCart";

function variantPrice(item: CartEntityItem): number {
  const v = item.variant;
  const sale = v?.salePrice ?? 0;
  return sale > 0 ? sale : (v?.price ?? 0);
}

export default function CartPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const { data: cart, isLoading, refetch: refetchCart } = useCart();
  const { data: total } = useCartTotal();
  const { mutate: increase, isPending: increasing } = useIncreaseCartItem();
  const { mutate: updateQuantity } = useUpdateCartItem();
  const { mutate: decrease } = useDecreaseCartItem();
  const { mutate: remove, isPending: removing } = useRemoveCartItem();
  const { mutate: clear, isPending: clearing } = useClearCart();
  const setCheckoutItems = useCheckoutStore((s) => s.setItems);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [checkingStock, setCheckingStock] = useState(false);
  const getMaxQuantity = (item: CartEntityItem) =>
    Math.max(0, item.variant.stockQuantity ?? 0);

  const items = useMemo(() => cart?.items ?? [], [cart?.items]);
  const activeItems = useMemo(
    () => items.filter((it) => it.variant?.status !== "INACTIVE" && it.variant?.product?.status !== "INACTIVE"),
    [items]
  );

  const computedTotal =
    total ?? items.reduce((sum, it) => sum + variantPrice(it) * it.quantity, 0);

  const selectedItems = useMemo(
    () => activeItems.filter((item) => selectedIds.includes(item.cartItemId)),
    [activeItems, selectedIds],
  );

  const selectedTotal = selectedItems.reduce(
    (sum, it) => sum + variantPrice(it) * it.quantity,
    0,
  );

  const isAllSelected =
    activeItems.length > 0 && selectedItems.length === activeItems.length;

  const toggleItem = (cartItemId: number) => {
    setSelectedIds((current) =>
      current.includes(cartItemId)
        ? current.filter((id) => id !== cartItemId)
        : [...current, cartItemId],
    );
  };

  const toggleAll = () => {
    setSelectedIds(isAllSelected ? [] : activeItems.map((item) => item.cartItemId));
  };

  const handleCheckout = async () => {
    if (!selectedItems.length) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm để thanh toán");
      return;
    }
    setCheckingStock(true);
    try {
      const refreshed = await refetchCart();
      const freshItems = refreshed.data?.items ?? [];
      for (const selected of selectedItems) {
        const fresh = freshItems.find(
          (item) => item.cartItemId === selected.cartItemId,
        );
        const productName =
          selected.variant.product?.productName ?? "Sản phẩm";
        if (!fresh) {
          toast.error(`${productName} không còn trong giỏ hàng`);
          return;
        }
        if (
          fresh.variant.status === "INACTIVE" ||
          fresh.variant.product?.status === "INACTIVE"
        ) {
          toast.error(`${productName} đã ngừng kinh doanh`);
          return;
        }
        const available = fresh.variant.stockQuantity ?? 0;
        if (fresh.quantity > available) {
          toast.error(
            `${productName} không đủ hàng. Bạn chọn ${fresh.quantity}, hiện chỉ còn ${available}`,
          );
          return;
        }
      }

      const freshSelectedItems = freshItems.filter((item) =>
        selectedIds.includes(item.cartItemId),
      );
      setCheckoutItems(freshSelectedItems.map(toCheckoutItem));
      navigate("/checkout");
    } catch {
      toast.error("Không thể kiểm tra tồn kho, vui lòng thử lại");
    } finally {
      setCheckingStock(false);
    }
  };

  if (!isAuthenticated) {
    return <GuestCart />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-20 text-center">
        <ShoppingBag className="size-12 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Giỏ hàng trống</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hãy thêm sản phẩm bạn yêu thích vào giỏ.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Tiếp tục mua sắm</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giỏ hàng ({items.length})</h1>
        <Button
          variant="ghost"
          size="sm"
          disabled={clearing}
          onClick={() => clear()}
        >
          <Trash2 className="mr-1 size-4" /> Xoá tất cả
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {}
        <div className="space-y-3 lg:col-span-2">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
                Chọn tất cả sản phẩm
              </label>
              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedItems.length}/{items.length}
              </span>
            </CardContent>
          </Card>

          {items.map((item) => {
            const v = item.variant;
            const img = resolveImageUrl(v?.image?.imageUrl);
            const name = v?.product?.productName ?? "Sản phẩm";
            const currentPrice = variantPrice(item);
            const lineTotal = currentPrice * item.quantity;
            const originalLineTotal = (v?.price ?? 0) * item.quantity;
            const hasDiscount = v?.salePrice ? v.salePrice > 0 && v.salePrice < (v.price ?? 0) : false;
            const checked = selectedIds.includes(item.cartItemId);
            const isInactive = v?.status === "INACTIVE" || v?.product?.status === "INACTIVE";
            const maxQuantity = getMaxQuantity(item);

            return (
              <Card
                key={item.cartItemId}
                className={cn(
                  checked ? "border-primary/70 bg-accent/30" : "",
                  isInactive && "opacity-75 bg-slate-50/50"
                )}
              >
                <CardContent className="flex gap-4 p-4">
                  <Checkbox
                    className="mt-8"
                    checked={checked}
                    disabled={isInactive}
                    onCheckedChange={() => toggleItem(item.cartItemId)}
                  />
                  <div className="size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                    {img ? (
                      <img
                        src={img}
                        alt={name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-muted-foreground">
                        <ImageOff className="size-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium leading-snug">{name}</p>
                          {isInactive && (
                            <Badge variant="destructive" className="text-[9px] font-bold px-1.5 py-0 leading-none select-none">Ngừng kinh doanh</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[v?.color, v?.size].filter(Boolean).join(" • ")}
                        </p>
                        {!isInactive && (
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Tối đa {maxQuantity} sản phẩm (có thể thêm {Math.max(0, maxQuantity - item.quantity)})
                          </p>
                        )}
                        <div className="mt-1 flex items-baseline gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{formatCurrency(currentPrice)}</span>
                          {hasDiscount && (
                            <span className="line-through">{formatCurrency(v?.price ?? 0)}</span>
                          )}
                        </div>
                      </div>

                      <button
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        disabled={removing}
                        onClick={() => {
                          setSelectedIds((current) =>
                            current.filter((id) => id !== item.cartItemId),
                          );
                          remove(item.cartItemId);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isInactive}
                          onClick={() => decrease(item.cartItemId)}
                        >
                          <Minus className="size-3.5" />
                        </Button>

                        <Input
                          className="w-12 text-center text-sm"
                          value={item.quantity}
                          disabled={isInactive || increasing}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            if (!raw) return;
                            const parsed = Number(raw);

                            const next = Math.min(
                              Math.max(Math.trunc(parsed), 1),
                              maxQuantity,
                            );

                            updateQuantity({
                              variantId: item.variant.variantId,
                              quantity: next,
                            });
                          }}
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={
                            isInactive || increasing || item.quantity >= maxQuantity
                          }
                          onClick={() => increase(item.cartItemId)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold">
                          {formatCurrency(lineTotal)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(originalLineTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {}
        <div>
          <Card className="sticky top-20">
            <CardContent className="space-y-4 p-5">
              <h2 className="font-semibold">Tóm tắt đơn hàng</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatCurrency(computedTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Đã chọn</span>
                <span>{formatCurrency(selectedTotal)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Tổng cộng</span>
                <span>{formatCurrency(selectedTotal)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={!selectedItems.length || checkingStock}
                onClick={handleCheckout}
              >
                {checkingStock && <Loader2 className="mr-2 size-4 animate-spin" />}
                {checkingStock
                  ? "Đang kiểm tra tồn kho..."
                  : `Thanh toán (${selectedItems.length})`}
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/products">Tiếp tục mua sắm</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
