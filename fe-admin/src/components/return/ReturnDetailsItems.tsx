import { ShoppingBag, ArrowRight } from "lucide-react";
import type { ReturnItemResponse } from "@/api/returnApi";

interface ReturnDetailsItemsProps {
  items: ReturnItemResponse[];
}

export default function ReturnDetailsItems({ items }: ReturnDetailsItemsProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <ShoppingBag size={13} /> Sản phẩm trả lại ({items.length})
      </h3>
      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.returnItemId} className="p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className=" text-gray-400">Mã biến thể: {item.sku}</span>
                  <span className="text-gray-500">Màu: {item.color}</span>
                  <span className="text-gray-500">Kích cỡ: {item.size}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-xs justify-end">
                  <span className="line-through text-gray-400">
                    {item.originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                  <ArrowRight size={10} className="text-gray-400" />
                  <span className="font-semibold text-red-600">
                    {item.refundPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Số lượng trả: x{item.quantity}</p>
              </div>
            </div>
            {item.reason && (
              <div className="bg-red-50/50 border border-red-100/30 rounded-lg p-2 text-xs text-red-800">
                <span className="font-semibold">Lý do:</span> {item.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
