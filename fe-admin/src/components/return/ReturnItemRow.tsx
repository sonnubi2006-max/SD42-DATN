import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { OrderItemResponse } from "@/api/orderApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";

interface ExchangeSelection {
  rowId: number;
  newVariantId?: number;
  newQuantity: number;
}

interface ReturnItemRowProps {
  item: OrderItemResponse;
  isChecked: boolean;
  quantity: number;
  reason: string;
  onCheckboxChange: (checked: boolean) => void;
  onQuantityChange: (qty: number) => void;
  onReasonChange: (reason: string) => void;
  exchangeOptions?: ProductVariantResponse[];
  exchangeSelections?: ExchangeSelection[];
  onAddExchange?: () => void;
  onRemoveExchange?: (rowId: number) => void;
  onExchangeChange?: (rowId: number, patch: { newVariantId?: number; newQuantity?: number }) => void;
}

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export default function ReturnItemRow({
  item,
  isChecked,
  quantity,
  reason,
  onCheckboxChange,
  onQuantityChange,
  onReasonChange,
  exchangeOptions = [],
  exchangeSelections = [],
  onAddExchange,
  onRemoveExchange,
  onExchangeChange,
}: ReturnItemRowProps) {
  const availableQuantity = item.remainingReturnQuantity ?? item.quantity;
  const isUnavailable = availableQuantity <= 0;
  const returnedUnitPrice = item.salePrice && item.salePrice < item.price ? item.salePrice : item.price;

  return (
    <div
      className={`p-4 transition ${isUnavailable
        ? "bg-gray-50/70 opacity-60"
        : isChecked
          ? "bg-red-50/10"
          : "hover:bg-gray-50/30"
        }`}
    >
      <div className="flex items-start gap-3.5">
        <Checkbox
          id={`check-${item.variantId}`}
          checked={isChecked}
          onCheckedChange={(checked) => onCheckboxChange(!!checked)}
          disabled={isUnavailable}
          className="mt-1"
        />
        <div className="flex-1 space-y-3">
          <Label
            htmlFor={`check-${item.variantId}`}
            className="text-xs font-semibold text-gray-950 block cursor-pointer"
          >
            {item.productName}
          </Label>
          <div className="flex items-center gap-4 text-[10px] text-gray-400 ">
            <span>Mã biến thể: {item.variantCode}</span>
            <span>Màu: {item.color}</span>
            <span>Kích cỡ: {item.size}</span>
            <span className="text-gray-500 font-sans">
              Đã mua: <span className="font-semibold">x{item.quantity}</span>
            </span>
            <span
              className={`font-sans font-semibold ${isUnavailable ? "text-gray-400" : "text-emerald-600"
                }`}
            >
              {isUnavailable
                ? "Đã trả hết"
                : `Có thể trả: x${availableQuantity}`}
            </span>
          </div>

          { }
          {isChecked && (
            <div className="space-y-3.5 pt-3.5 border-t border-dashed border-gray-100 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500">Số lượng trả</Label>
                  <Input
                    type="number"
                    min={1}
                    max={availableQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      onQuantityChange(
                        Math.min(Math.max(1, val), availableQuantity),
                      );
                    }}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-gray-500">Lý do đổi hàng</Label>
                  <Select value={reason} onValueChange={onReasonChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lỗi sản xuất">Lỗi sản xuất</SelectItem>
                      <SelectItem value="Giao sai mẫu mã">Giao sai mẫu mã</SelectItem>
                      <SelectItem value="Hàng bị bẩn/ố">Hàng bị bẩn/ố</SelectItem>
                      <SelectItem value="Không vừa kích cỡ">Không vừa kích cỡ</SelectItem>
                      <SelectItem value="Đổi ý/Trả hàng tự do">
                        Đổi ý/Trả hàng tự do
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-800">
                    <ArrowRightLeft className="size-3.5" /> Sản phẩm giao đổi cho {item.productName}
                  </Label>
                  <button type="button" onClick={onAddExchange} disabled={exchangeSelections.reduce((sum, row) => sum + row.newQuantity, 0) >= quantity} className="flex items-center gap-1 text-[10px] font-semibold text-blue-700 disabled:opacity-40">
                    <Plus className="size-3" /> Thêm biến thể
                  </button>
                </div>
                <div className="mb-2 rounded-md bg-white/80 px-2.5 py-1.5 text-[10px] text-slate-600">
                  Giá sản phẩm khách gửi lại: <strong className="text-orange-700">{money(returnedUnitPrice)}/sản phẩm</strong>
                </div>
                <div className="space-y-2">
                  {exchangeSelections.map((selection, index) => {
                    const allocatedElsewhere = exchangeSelections.reduce((sum, row) => sum + (row.rowId === selection.rowId ? 0 : row.newQuantity), 0);
                    const selectedVariant = exchangeOptions.find((variant) => variant.variantId === selection.newVariantId);
                    const maxQuantity = Math.max(1, Math.min(quantity - allocatedElsewhere, selectedVariant?.availableStock ?? selectedVariant?.stockQuantity ?? quantity));
                    return (
                      <div key={selection.rowId} className="grid grid-cols-[minmax(0,1fr)_80px_28px] gap-2">
                        <Select value={selection.newVariantId?.toString() ?? ""} onValueChange={(value) => onExchangeChange?.(selection.rowId, { newVariantId: Number(value) })}>
                          <SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder={`Biến thể thay thế #${index + 1}`} /></SelectTrigger>
                          <SelectContent>
                            {exchangeOptions.filter((variant) => variant.status === "ACTIVE" && (variant.availableStock ?? variant.stockQuantity) > 0).map((variant) => {
                              const usedByOtherRow = exchangeSelections.some((row) => row.rowId !== selection.rowId && row.newVariantId === variant.variantId);
                              const replacementPrice = variant.salePrice && variant.salePrice < variant.price ? variant.salePrice : variant.price;
                              return <SelectItem key={variant.variantId} value={variant.variantId.toString()} disabled={usedByOtherRow} className="text-xs">{item.productName} · {variant.color || "Không màu"} · Size {variant.size || "—"} · {money(replacementPrice)} · Còn {variant.availableStock ?? variant.stockQuantity}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                        <Input type="number" min={1} max={maxQuantity} value={selection.newQuantity} onChange={(event) => onExchangeChange?.(selection.rowId, { newQuantity: Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)) })} className="h-9 bg-white text-xs" aria-label={`Số lượng biến thể thay thế ${index + 1}`} />
                        <button type="button" onClick={() => onRemoveExchange?.(selection.rowId)} disabled={exchangeSelections.length <= 1} className="flex size-7 items-center justify-center self-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label={`Xóa biến thể thay thế ${index + 1}`}><Trash2 className="size-3.5" /></button>
                        {selectedVariant && (() => {
                          const replacementPrice = selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.price ? selectedVariant.salePrice : selectedVariant.price;
                          const difference = replacementPrice - returnedUnitPrice;
                          return <div className="col-span-3 flex justify-between rounded bg-slate-50 px-2 py-1 text-[10px]"><span>Giá sản phẩm giao: <strong>{money(replacementPrice)}/sản phẩm</strong></span><span className={difference === 0 ? "text-emerald-600" : difference > 0 ? "text-red-600" : "text-blue-600"}>{difference === 0 ? "Ngang giá" : `Chênh lệch ${difference > 0 ? "+" : ""}${money(difference)}`}</span></div>;
                        })()}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-blue-700">Đã phân bổ {exchangeSelections.reduce((sum, row) => sum + row.newQuantity, 0)}/{quantity}. Có thể chia sang nhiều màu hoặc kích cỡ của cùng sản phẩm.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
