import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PosDraftItem } from "@/api/posApi";
import { money } from "./posUtils";

interface Props {
  cart: PosDraftItem[];
  onUpdateQuantity: (detailId: number, newQty: number) => void;
  onRemoveItem: (detailId: number) => void;
}

export default function CartPanel({ cart, onUpdateQuantity, onRemoveItem }: Props) {
  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
          <ShoppingCart size={13} /> Gio ({cart.length})
        </div>
        {cart.length > 0 && (
          <button
            onClick={() => cart.forEach((item) => onRemoveItem(item.itemId))}
            className="text-[10px] text-gray-400 hover:text-red-500"
          >
            Xoa tat ca
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
        {cart.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">Chua co san pham</div>
        ) : (
          <div className="space-y-1">
            {cart.map((item) => (
              <div key={item.itemId} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-800">{item.productName}</p>
                  <p className="text-[10px] text-gray-400">
                    {[item.color, item.size].filter(Boolean).join(" / ")} {money(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1)} className="rounded border p-0.5 hover:bg-gray-100"><Minus size={10} /></button>
                  <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1)} className="rounded border p-0.5 hover:bg-gray-100"><Plus size={10} /></button>
                </div>
                <span className="w-16 text-right text-xs font-semibold">{money(item.subtotal)}</span>
                <button onClick={() => onRemoveItem(item.itemId)} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}