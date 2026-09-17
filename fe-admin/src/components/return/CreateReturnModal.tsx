import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  X,
  Info,
  ShoppingCart,
  ArrowRightLeft,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { orderApi } from "@/api/orderApi";
import type { OrderResponse } from "@/api/orderApi";
import { useCreateReturn } from "@/hooks/useReturn";
import type { CreateReturnRequest } from "@/api/returnApi";
import { toast } from "sonner";

import ReturnOrderSearch from "./ReturnOrderSearch";
import ReturnCustomerSummary from "./ReturnCustomerSummary";
import ReturnItemRow from "./ReturnItemRow";
import { productApi } from "@/api/productApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import DeliverySection, { type DeliveryInfo } from "@/components/pos/DeliverySection";

interface CreateReturnModalProps {
  onClose: () => void;
}

interface ExchangeItemDraft {
  rowId: number;
  sourceVariantId?: number;
  newVariantId?: number;
  newQuantity: number;
}

export default function CreateReturnModal({ onClose }: CreateReturnModalProps) {
  const { mutate: createReturn, isPending: isCreating } = useCreateReturn();

  const [searchCode, setSearchCode] = useState("");
  const [eligibleOrders, setEligibleOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isSelectingOrder, setIsSelectingOrder] = useState(false);
  const [foundOrder, setFoundOrder] = useState<OrderResponse | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({});
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [returnReasons, setReturnReasons] = useState<Record<number, string>>({});
  const [returnType] = useState<"REFUND" | "EXCHANGE">("EXCHANGE");
  const [productVariants, setProductVariants] = useState<Record<number, ProductVariantResponse[]>>({});
  const [exchangeItems, setExchangeItems] = useState<ExchangeItemDraft[]>([]);
  const [exchangeDelivery, setExchangeDelivery] = useState<DeliveryInfo>({ isDelivery: false, deliveryFee: 0, valid: true, address: null });

  useEffect(() => {
    let active = true;

    const loadEligibleOrders = async () => {
      setIsLoadingOrders(true);
      setSearchError(null);
      try {
        const orders = await orderApi.getReturnEligible();
        if (active) setEligibleOrders(orders);
      } catch (error: unknown) {
        if (!active) return;
        const apiError = error as { apiMessage?: string; message?: string };
        setSearchError(
          apiError.apiMessage ??
          apiError.message ??
          "Không thể tải danh sách đơn hàng có thể trả.",
        );
      } finally {
        if (active) setIsLoadingOrders(false);
      }
    };

    loadEligibleOrders();
    return () => {
      active = false;
    };
  }, []);

  const handleSelectOrder = async (order: OrderResponse) => {
    if (foundOrder?.orderId === order.orderId) return;

    setIsSelectingOrder(true);
    setSearchError(null);
    setFoundOrder(null);
    setCustomerName("");
    setCustomerPhone("");
    setSelectedItems({});
    setReturnQuantities({});
    setReturnReasons({});
    setExchangeItems([]);

    try {
      if (order.canReturn !== true) {
        setEligibleOrders((current) =>
          current.filter((item) => item.orderId !== order.orderId),
        );
        setSearchError("Đơn hàng này không còn đủ điều kiện đổi hàng.");
        return;
      }

      setFoundOrder(order);
      setCustomerName(order.customerName ?? "");
      setCustomerPhone(order.customerPhone ?? "");
      const productIds = [
        ...new Set(
          order.items
            .filter(
              (item) =>
                (item.remainingReturnQuantity ?? item.quantity) > 0,
            )
            .map((item) => item.productId),
        ),
      ];
      const products = await Promise.all(
        productIds.map((productId) => productApi.getById(productId)),
      );
      setProductVariants(
        Object.fromEntries(
          products.map((product) => [product.productId, product.variants]),
        ),
      );

      const initialSelections: Record<number, boolean> = {};
      const initialQuantities: Record<number, number> = {};
      const initialReasons: Record<number, string> = {};

      order.items.forEach((item) => {
        initialSelections[item.variantId] = false;
        initialQuantities[item.variantId] = 1;
        initialReasons[item.variantId] = "Lỗi sản xuất";
      });

      setSelectedItems(initialSelections);
      setReturnQuantities(initialQuantities);
      setReturnReasons(initialReasons);
    } catch (error: unknown) {
      const apiError = error as { apiMessage?: string; message?: string };
      setSearchError(
        apiError.apiMessage ??
        apiError.message ??
        "Đã có lỗi xảy ra khi tải thông tin đơn hàng.",
      );
    } finally {
      setIsSelectingOrder(false);
    }
  };

  const handleCheckboxChange = (variantId: number, checked: boolean) => {
    setSelectedItems((prev) => ({ ...prev, [variantId]: checked }));
    setExchangeItems((current) => {
      if (!checked) return current.filter((item) => item.sourceVariantId !== variantId);
      if (current.some((item) => item.sourceVariantId === variantId)) return current;
      return [...current, {
        rowId: current.reduce((max, item) => Math.max(max, item.rowId), 0) + 1,
        sourceVariantId: variantId,
        newQuantity: returnQuantities[variantId] ?? 1,
      }];
    });
  };

  const handleReasonChange = (variantId: number, reason: string) => {
    setReturnReasons((prev) => ({ ...prev, [variantId]: reason }));
  };

  const totalRefund = foundOrder
    ? foundOrder.items.reduce((sum, item) => {
      if (selectedItems[item.variantId]) {
        const qty = returnQuantities[item.variantId] || 1;
        const itemPrice = (item.salePrice && item.salePrice < item.price) ? item.salePrice : item.price;
        return sum + qty * itemPrice;
      }
      return sum;
    }, 0)
    : 0;

  const merchandisePaid = foundOrder
    ? Math.max(0, (foundOrder.finalAmount ?? 0) - (foundOrder.shippingFee ?? 0))
    : 0;
  const isZeroRefundOrder = returnType === "REFUND" && foundOrder !== null && merchandisePaid === 0;
  const totalReturnQuantity = foundOrder
    ? foundOrder.items.reduce(
      (sum, item) =>
        sum + (selectedItems[item.variantId] ? returnQuantities[item.variantId] || 1 : 0),
      0,
    )
    : 0;
  const totalExchangeQuantity = exchangeItems.reduce(
    (sum, item) => sum + item.newQuantity,
    0,
  );
  const remainingExchangeQuantity = Math.max(
    0,
    totalReturnQuantity - totalExchangeQuantity,
  );

  const selectedSourceItems = foundOrder?.items.filter(
    (item) => selectedItems[item.variantId],
  ) ?? [];

  const remainingForSource = (sourceVariantId: number, excludedRowId?: number) => {
    const returnQuantity = returnQuantities[sourceVariantId] ?? 1;
    const allocated = exchangeItems.reduce(
      (sum, item) => sum + (item.rowId !== excludedRowId && item.sourceVariantId === sourceVariantId ? item.newQuantity : 0),
      0,
    );
    return Math.max(0, returnQuantity - allocated);
  };

  const addExchangeItem = () => {
    if (remainingExchangeQuantity <= 0) {
      toast.error("Tổng số lượng giao đổi đã bằng số lượng khách trả");
      return;
    }
    const defaultSource = selectedSourceItems.find((item) => remainingForSource(item.variantId) > 0);
    if (!defaultSource) {
      toast.error("Hãy chọn sản phẩm lỗi và số lượng cần đổi trước");
      return;
    }
    setExchangeItems((current) => [
      ...current,
      {
        rowId: current.reduce((max, item) => Math.max(max, item.rowId), 0) + 1,
        sourceVariantId: defaultSource.variantId,
        newQuantity: 1,
      },
    ]);
  };

  const form = useForm({
    defaultValues: {
      note: "",
    },
    onSubmit: async ({ value }) => {
      if (!foundOrder) return;

      const itemsToReturn = foundOrder.items
        .filter((item) => selectedItems[item.variantId])
        .map((item) => {
          return {
            variantId: item.variantId,
            quantity: returnQuantities[item.variantId],
            reason: returnReasons[item.variantId],
          };
        });

      if (itemsToReturn.length === 0) {
        toast.error("Vui lòng chọn ít nhất 1 sản phẩm để trả lại!");
        return;
      }

      if (!customerName.trim() || !customerPhone.trim()) {
        toast.error("Vui lòng nhập đầy đủ tên và số điện thoại khách hàng");
        return;
      }
      if (!/^0[35789]\d{8}$/.test(customerPhone.trim())) {
        toast.error("Số điện thoại khách hàng không hợp lệ");
        return;
      }

      if (returnType === "EXCHANGE") {
        if (!exchangeDelivery.valid) {
          toast.error("Vui lòng nhập đầy đủ thông tin giao sản phẩm đổi");
          return;
        }
        if (exchangeItems.length === 0) {
          toast.error("Vui lòng thêm ít nhất một sản phẩm giao đổi");
          return;
        }
        if (
          exchangeItems.some(
            (item) => !item.sourceVariantId || !item.newVariantId || item.newQuantity < 1,
          )
        ) {
          toast.error("Vui lòng chọn biến thể và nhập số lượng hợp lệ cho từng sản phẩm đổi");
          return;
        }
        const variantIds = exchangeItems.map((item) => item.newVariantId);
        if (new Set(variantIds).size !== variantIds.length) {
          toast.error("Mỗi biến thể đổi chỉ được chọn một lần; hãy gộp số lượng vào cùng một dòng");
          return;
        }
        if (totalExchangeQuantity !== totalReturnQuantity) {
          toast.error(
            `Cần phân bổ đủ ${totalReturnQuantity} sản phẩm giao đổi (hiện tại ${totalExchangeQuantity})`,
          );
          return;
        }
      }

      const payload: CreateReturnRequest = {
        orderId: foundOrder.orderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        returnType,
        note: value.note,
        items: itemsToReturn,
        ...(returnType === "EXCHANGE" && {
          exchangeItems: exchangeItems.map((item) => ({
            sourceVariantId: item.sourceVariantId!,
            newVariantId: item.newVariantId!,
            newQuantity: item.newQuantity,
          })),
          exchangeFulfillmentMethod: exchangeDelivery.isDelivery ? "DELIVERY" : "STORE_PICKUP",
          exchangeShippingFee: exchangeDelivery.deliveryFee,
          ...(exchangeDelivery.isDelivery && exchangeDelivery.address ? { exchangeDeliveryAddress: exchangeDelivery.address } : {}),
        }),
      };

      createReturn(payload, {
        onSuccess: () => {
          toast.success(returnType === "EXCHANGE" ? "Tạo yêu cầu đổi hàng thành công!" : "Tạo yêu cầu đổi hàng thành công!");
          onClose();
        },
        onError: (err: unknown) => {
          const apiError = err as { apiMessage?: string; message?: string } | null;
          toast.error(apiError?.apiMessage ?? apiError?.message ?? "Không thể tạo yêu cầu");
        },
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        { }
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900">Tạo yêu cầu đổi hàng lỗi</h3>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <X size={16} />
          </Button>
        </div>

        { }
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          { }
          <ReturnOrderSearch
            searchCode={searchCode}
            onSearchCodeChange={setSearchCode}
            eligibleOrders={eligibleOrders}
            selectedOrderId={foundOrder?.orderId ?? null}
            onSelectOrder={handleSelectOrder}
            isLoading={isLoadingOrders}
            isSelecting={isSelectingOrder}
            searchError={searchError}
          />

          { }
          {foundOrder && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-blue-950"><ArrowRightLeft size={14} className="text-blue-600" /> Đổi sản phẩm lỗi</span>
                <span className="mt-1 block text-[10px] text-blue-700">Kiểm nhận sản phẩm lỗi và giao sản phẩm thay thế cho khách; không phát sinh hoàn tiền.</span>
              </div>

              { }
              <ReturnCustomerSummary
                customerName={customerName}
                customerPhone={customerPhone}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
              />

              { }
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                  <ShoppingCart size={13} className="text-gray-400" /> Chọn sản phẩm lỗi khách gửi lại
                </Label>
                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {foundOrder.items.map((item) => (
                    <ReturnItemRow
                      key={item.variantId}
                      item={item}
                      isChecked={selectedItems[item.variantId] || false}
                      quantity={returnQuantities[item.variantId] || 1}
                      reason={returnReasons[item.variantId] || "Lỗi sản xuất"}
                      onCheckboxChange={(checked) =>
                        handleCheckboxChange(item.variantId, checked)
                      }
                      onQuantityChange={(qty) => {
                        setReturnQuantities((prev) => ({ ...prev, [item.variantId]: qty }));
                        setExchangeItems((current) => {
                          let remaining = qty;
                          return current.flatMap((exchangeItem) => {
                            if (exchangeItem.sourceVariantId !== item.variantId) return [exchangeItem];
                            if (remaining <= 0) return [];
                            const nextQuantity = Math.min(exchangeItem.newQuantity, remaining);
                            remaining -= nextQuantity;
                            return [{ ...exchangeItem, newQuantity: nextQuantity }];
                          });
                        });
                      }
                      }
                      onReasonChange={(reason) =>
                        handleReasonChange(item.variantId, reason)
                      }
                      exchangeOptions={productVariants[item.productId] ?? []}
                      exchangeSelections={exchangeItems.filter((exchangeItem) => exchangeItem.sourceVariantId === item.variantId)}
                      onAddExchange={() => setExchangeItems((current) => {
                        const allocated = current.filter((exchangeItem) => exchangeItem.sourceVariantId === item.variantId).reduce((sum, exchangeItem) => sum + exchangeItem.newQuantity, 0);
                        if (allocated >= (returnQuantities[item.variantId] ?? 1)) return current;
                        return [...current, { rowId: current.reduce((max, exchangeItem) => Math.max(max, exchangeItem.rowId), 0) + 1, sourceVariantId: item.variantId, newQuantity: 1 }];
                      })}
                      onRemoveExchange={(rowId) => setExchangeItems((current) => current.filter((exchangeItem) => exchangeItem.rowId !== rowId))}
                      onExchangeChange={(rowId, patch) => setExchangeItems((current) => current.map((exchangeItem) => exchangeItem.rowId === rowId ? { ...exchangeItem, ...patch } : exchangeItem))}
                    />
                  ))}
                </div>
              </div>

              {returnType === "EXCHANGE" && Object.keys(selectedItems).some((key) => selectedItems[Number(key)]) && (
                <div className="hidden space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-bold text-blue-950"><ArrowRightLeft size={14} /> Danh sách sản phẩm giao đổi</p>
                      <p className="mt-1 text-[10px] text-blue-700">Cùng màu và size thì được chênh giá; nếu khác màu hoặc size thì sản phẩm thay thế phải cùng giá.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addExchangeItem}
                      disabled={remainingExchangeQuantity <= 0}
                      className="h-8 shrink-0 border-blue-200 bg-white text-[11px] text-blue-700 hover:bg-blue-50"
                    >
                      <Plus size={13} className="mr-1" /> Thêm sản phẩm
                    </Button>
                  </div>
                  {exchangeItems.map((exchangeItem, index) => {
                    const sourceItem = foundOrder.items.find(
                      (item) => item.variantId === exchangeItem.sourceVariantId,
                    );
                    const rowVariantOptions = sourceItem
                      ? (productVariants[sourceItem.productId] ?? [])
                        .filter((variant) =>
                          variant.status === "ACTIVE"
                          && (variant.availableStock ?? variant.stockQuantity) > 0
                          && (
                            (
                              (variant.color ?? "").trim().toLocaleLowerCase("vi-VN") === (sourceItem.color ?? "").trim().toLocaleLowerCase("vi-VN")
                              && (variant.size ?? "").trim().toLocaleLowerCase("vi-VN") === (sourceItem.size ?? "").trim().toLocaleLowerCase("vi-VN")
                            )
                            || (variant.salePrice && variant.salePrice > 0 ? variant.salePrice : variant.price)
                            === (sourceItem.salePrice && sourceItem.salePrice > 0 ? sourceItem.salePrice : sourceItem.price)
                          ),
                        )
                        .map((variant) => ({ variant, productName: sourceItem.productName }))
                      : [];
                    const selectedVariant = rowVariantOptions.find(
                      ({ variant }) => variant.variantId === exchangeItem.newVariantId,
                    )?.variant;
                    const maxQuantity = selectedVariant
                      ? selectedVariant.availableStock ?? selectedVariant.stockQuantity
                      : undefined;
                    const maxByReturnQuantity = Math.max(1, exchangeItem.sourceVariantId
                      ? remainingForSource(exchangeItem.sourceVariantId, exchangeItem.rowId)
                      : 1);
                    const allowedQuantity = maxQuantity
                      ? Math.min(maxQuantity, maxByReturnQuantity)
                      : maxByReturnQuantity;
                    return (
                      <div key={exchangeItem.rowId} className="rounded-xl border border-blue-100 bg-white p-3">
                        <div className="mb-2 flex items-center justify-between gap-3 text-[11px]">
                          <strong className="text-gray-900">Sản phẩm đổi #{index + 1}</strong>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setExchangeItems((current) => current.filter((item) => item.rowId !== exchangeItem.rowId))}
                            className="size-7 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Xóa sản phẩm đổi ${index + 1}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_100px]">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">Sản phẩm lỗi cần đổi</Label>
                            <Select
                              value={exchangeItem.sourceVariantId?.toString() ?? ""}
                              onValueChange={(value) => setExchangeItems((current) => current.map((item) => item.rowId === exchangeItem.rowId
                                ? { ...item, sourceVariantId: Number(value), newVariantId: undefined, newQuantity: 1 }
                                : item))}
                            >
                              <SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder="Chọn hàng lỗi" /></SelectTrigger>
                              <SelectContent>
                                {selectedSourceItems.map((item) => (
                                  <SelectItem key={item.variantId} value={item.variantId.toString()} disabled={remainingForSource(item.variantId, exchangeItem.rowId) <= 0} className="text-xs">
                                    {item.productName} · {item.color || "Không màu"} · Size {item.size || "—"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">Biến thể thay thế hợp lệ</Label>
                            <Select
                              value={exchangeItem.newVariantId?.toString() ?? ""}
                              onValueChange={(value) => setExchangeItems((current) => current.map((item) => item.rowId === exchangeItem.rowId ? { ...item, newVariantId: Number(value) } : item))}
                            >
                              <SelectTrigger className="h-9 bg-white text-xs"><SelectValue placeholder={sourceItem ? "Chọn biến thể thay thế" : "Chọn hàng lỗi trước"} /></SelectTrigger>
                              <SelectContent>
                                {rowVariantOptions.map(({ variant, productName }) => {
                                  const alreadySelected = exchangeItems.some(
                                    (item) => item.rowId !== exchangeItem.rowId && item.newVariantId === variant.variantId,
                                  );
                                  const stock = variant.availableStock ?? variant.stockQuantity;
                                  return (
                                    <SelectItem key={variant.variantId} value={variant.variantId.toString()} disabled={alreadySelected} className="text-xs">
                                      {productName} · {variant.color || "Không màu"} · Size {variant.size || "—"} · {(variant.salePrice && variant.salePrice > 0 ? variant.salePrice : variant.price).toLocaleString("vi-VN")}đ · Còn {stock}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-gray-500">Số lượng</Label>
                            <Input
                              type="number"
                              min={1}
                              max={allowedQuantity}
                              value={exchangeItem.newQuantity}
                              onChange={(event) => {
                                const nextQuantity = Math.max(1, Number(event.target.value) || 1);
                                setExchangeItems((current) => current.map((item) => item.rowId === exchangeItem.rowId ? { ...item, newQuantity: Math.min(nextQuantity, allowedQuantity) } : item));
                              }}
                              className="h-9 bg-white text-xs"
                              aria-label={`Số lượng sản phẩm đổi ${index + 1}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-[11px] font-semibold ${totalExchangeQuantity > totalReturnQuantity ? "bg-red-50 text-red-700" : "bg-blue-100/70 text-blue-800"}`}>
                    <span>Đã phân bổ giao đổi</span>
                    <span>{totalExchangeQuantity}/{totalReturnQuantity} sản phẩm</span>
                  </div>
                  {exchangeItems.length === 0 && (
                    <button type="button" onClick={addExchangeItem} disabled={remainingExchangeQuantity <= 0} className="w-full rounded-xl border border-dashed border-blue-200 bg-white py-4 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">
                      <Plus size={14} className="mr-1 inline" /> Thêm sản phẩm cần giao đổi
                    </button>
                  )}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <DeliverySection
                  customer={{ id: foundOrder.customerId ?? null, name: foundOrder.customerName, phone: foundOrder.customerPhone }}
                  onDeliveryChange={setExchangeDelivery}
                />
              </div>

              { }
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-4"
              >
                <form.Field
                  name="note"
                  children={(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs font-semibold text-gray-700">
                        Ghi chú yêu cầu {returnType === "EXCHANGE" ? "đổi hàng" : "đổi hàng"}
                      </Label>
                      <Textarea
                        id={field.name}
                        placeholder="VD: Khách đổi hàng trực tiếp tại quầy..."
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="text-xs"
                        rows={2}
                      />
                    </div>
                  )}
                />

                { }
                <div className="bg-red-50/30 border border-red-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-red-800">
                    <Info size={14} />
                    <span>{returnType === "EXCHANGE" ? "Giá trị hàng lỗi tham khảo:" : isZeroRefundOrder ? "Tiền hoàn sau mã giảm giá:" : "Tạm tính trước khi BE phân bổ giảm giá:"}</span>
                  </div>
                  <span className="text-base font-bold text-red-600 ">
                    {(isZeroRefundOrder ? 0 : totalRefund).toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {isZeroRefundOrder && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
                    Mã giảm giá đã thanh toán toàn bộ giá trị sản phẩm. Vẫn có thể tạo yêu cầu nhận đổi hàng;
                    hệ thống ghi nhận tiền hoàn là 0đ và không hoàn phí vận chuyển.
                  </div>
                )}

                { }
                <div className="flex justify-end gap-2.5 pt-3">
                  <Button type="button" onClick={onClose} variant="outline">
                    Hủy bỏ
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    {isCreating ? "Đang xử lý..." : returnType === "EXCHANGE" ? "Tạo yêu cầu đổi hàng" : "Tạo yêu cầu đổi hàng"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
