import { useState, useEffect, useRef, useCallback } from "react";
import {
  Minus,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PosDraftItem } from "@/api/posApi";
import { money } from "./posUtils";
import { toast } from "sonner";

interface Props {
  item: PosDraftItem;
  onUpdateQuantity: (
    detailId: number,
    qty: number,
    revertFn: () => void,
  ) => void;
  onRequestRemove: (detailId: number) => void;
  onSyncPrice?: (detailId: number, variantId: number, qty: number) => void;
  debounceMs?: number;
}

export default function CartItemRow({
  item,
  onUpdateQuantity,
  onRequestRemove,
  onSyncPrice,
  debounceMs = 500,
}: Props) {
  const [localQty, setLocalQty] = useState(item.quantity);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommitted = useRef(item.quantity);

  const hasPromo =
    item.salePrice !== undefined &&
    item.salePrice !== null &&
    item.salePrice < item.price;
  const displayPrice = hasPromo ? item.salePrice! : item.price;
  const currentPrice = item.currentVariantPrice ?? displayPrice;
  const isPriceChanged =
    item.currentVariantPrice != null &&
    item.currentVariantPrice !== displayPrice;

  useEffect(() => {
    setLocalQty(item.quantity);
    lastCommitted.current = item.quantity;
  }, [item.quantity]);

  const commitQty = useCallback(
    (qty: number) => {
      if (qty === lastCommitted.current) return;
      lastCommitted.current = qty;
      onUpdateQuantity(item.itemId, qty, () => {
        setLocalQty(item.quantity);
        lastCommitted.current = item.quantity;
      });
    },
    [item.itemId, onUpdateQuantity, item.quantity],
  );

  const scheduleCommit = useCallback(
    (qty: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => commitQty(qty), debounceMs);
    },
    [commitQty, debounceMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleDecrease = () => {
    if (localQty <= 1) {
      if (timerRef.current) clearTimeout(timerRef.current);
      onRequestRemove(item.itemId);
      return;
    }
    const next = localQty - 1;
    setLocalQty(next);
    scheduleCommit(next);
  };

  const handleIncrease = () => {
    if (isPriceChanged) {
      toast.warning(
        `Giá sản phẩm đã thay đổi từ ${money(displayPrice)} thành ${money(currentPrice)}. Bạn không thể tăng số lượng sản phẩm cũ. Vui lòng giảm số lượng hoặc cập nhật lại giá!`,
      );
      return;
    }
    const next = Math.min(localQty + 1, item.stockQuantity);
    if (next !== localQty) {
      setLocalQty(next);
      scheduleCommit(next);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (raw === "") {
      setLocalQty(0);
      return;
    }
    const parsed = Math.min(
      Math.max(1, Math.trunc(Number(raw))),
      item.stockQuantity,
    );
    if (isPriceChanged && parsed > item.quantity) {
      toast.warning(
        "Giá sản phẩm đã thay đổi. Bạn không thể tăng số lượng sản phẩm cũ!",
      );
      setLocalQty(item.quantity);
      return;
    }
    setLocalQty(parsed);
    scheduleCommit(parsed);
  };

  const handleInputBlur = () => {
    if (localQty <= 0) {
      setLocalQty(1);
      scheduleCommit(1);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    commitQty(localQty);
  };

  return (
    <tr
      className={`group border-b border-border/40 hover:bg-muted/15 transition-colors text-sm ${isPriceChanged ? "bg-amber-50/40" : ""}`}
    >
      { }
      <td className="py-3.5 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.productName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package size={16} className="text-muted-foreground/60" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground leading-snug">
              {item.productName}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[10px] text-muted-foreground  bg-muted/70 px-1.5 py-0.5 rounded">
                {item.sku || "—"}
              </span>
              <span className="text-[10px] text-indigo-700 bg-indigo-50/85 font-semibold px-2 py-0.5 rounded">
                {[item.color, item.size].filter(Boolean).join(" - ")}
              </span>
              {isPriceChanged && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle size={10} className="text-amber-600" />
                    Giá cũ {money(displayPrice)} ➔ Giá mới {money(currentPrice)}
                  </span>
                  {onSyncPrice && (
                    <button
                      type="button"
                      onClick={() =>
                        onSyncPrice(item.itemId, item.variantId, item.quantity)
                      }
                      className="text-[10px] font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                      title="Cập nhật lại đơn giá mới cho sản phẩm này"
                    >
                      <RefreshCw size={10} />
                      Cập nhật giá mới
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </td>

      { }
      <td className="py-3.5 px-2 text-right tabular-nums">
        {hasPromo ? (
          <div className="flex items-center gap-4 justify-center">
            <span className="text-sm font-bold text-muted-foreground line-through decoration-rose-500/90">
              {money(item.price)}
            </span>
            <span className="text-sm font-bold text-rose-600">
              {money(item.salePrice!)}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-foreground">
            {money(item.price)}
          </span>
        )}
      </td>

      { }
      <td className="py-3.5 px-2">
        <div className="flex items-center justify-center gap-1 shrink-0">
          <button
            onClick={handleDecrease}
            className="flex h-7 w-7 items-center justify-center rounded border border-border bg-white hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Minus size={12} className="text-gray-600" />
          </button>
          <Input
            type="text"
            inputMode="numeric"
            value={localQty === 0 ? "" : String(localQty)}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="h-7 w-12 text-center text-sm font-bold tabular-nums px-0 border-border bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            onClick={handleIncrease}
            disabled={localQty >= item.stockQuantity || isPriceChanged}
            className={`flex h-7 w-7 items-center justify-center rounded border border-border bg-white hover:border-primary hover:bg-primary/5 transition-colors ${isPriceChanged
                ? "opacity-40 cursor-not-allowed"
                : "cursor-pointer"
              }`}
            title={
              isPriceChanged
                ? "Giá sản phẩm đã thay đổi, không thể tăng số lượng giá cũ"
                : "Tăng số lượng"
            }
          >
            <Plus size={12} className="text-gray-600" />
          </button>
        </div>
      </td>

      { }
      <td className="py-3.5 px-2 text-right font-bold text-sm tabular-nums text-foreground">
        {money(displayPrice * localQty)}
      </td>

      { }
      <td className="py-3.5 pl-2 pr-4 text-center">
        <button
          onClick={() => onRequestRemove(item.itemId)}
          className="text-muted-foreground hover:text-destructive hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <Trash2 size={15} />
        </button>
      </td>
    </tr>
  );
}
