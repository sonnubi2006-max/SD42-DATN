import { useCallback, useEffect, useMemo, useState } from "react";
import { ShoppingCart, Search, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethod, OrderResponse } from "@/api/orderApi";
import type { PosDraftResponse } from "@/api/posApi";
import ConfirmModal from "@/components/ConfirmModal";
import CartItemRow from "./CartItemRow";
import CustomerSelectionSection, {
  type CustomerSummary,
} from "./CustomerSelectionSection";
import CouponSection, { type DiscountInfo } from "./CouponSection";
import DeliverySection, { type DeliveryInfo } from "./DeliverySection";
import PaymentSection from "./PaymentSection";
import PaymentDialog from "./PaymentDialog";
import {
  useUpdatePosItem,
  useRemovePosItem,
  useCheckoutPos,
  useAddPosItem,
} from "@/hooks/usePosDraft";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProductPanel from "./ProductPanel";
import { Html5Qrcode } from "html5-qrcode";
import { productVariantApi } from "@/api/productVariantApi";
import QrImageScanButton from "@/components/QrImageScanButton";

interface Props {
  activeDraftId: number;
  activeDraft: PosDraftResponse;
  onCheckoutSuccess: (invoice: OrderResponse) => void;
}

export default function CartOrderPanel({
  activeDraftId,
  activeDraft,
  onCheckoutSuccess,
}: Props) {
  const { mutate: updateItem } = useUpdatePosItem();
  const { mutate: removeItem } = useRemovePosItem();
  const { mutate: checkout, isPending: isCheckingOut } = useCheckoutPos();
  const { mutate: addPosItem } = useAddPosItem();

  const cart = activeDraft.items ?? [];
  const subtotal = activeDraft.subtotal ?? 0;
  const orderCode = activeDraft.orderCode;

  const [customer, setCustomer] = useState<CustomerSummary>({
    id: activeDraft.customerId ?? null,
    name: activeDraft.customerName ?? "",
    phone: activeDraft.customerPhone ?? "",
  });
  const [discount, setDiscount] = useState<DiscountInfo>({
    discountAmount: activeDraft.discountAmount ?? 0,
    couponIdParam: activeDraft.couponId ?? undefined,
  });
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    isDelivery: false,
    deliveryFee: 0,
    valid: true,
    address: null,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    setCustomer({
      id: activeDraft.customerId ?? null,
      name: activeDraft.customerName ?? "",
      phone: activeDraft.customerPhone ?? "",
    });
  }, [
    activeDraft.customerId,
    activeDraft.customerName,
    activeDraft.customerPhone,
  ]);

  const total = Math.max(0, subtotal - discount.discountAmount);
  const grandTotal = total + delivery.deliveryFee;

  const checkoutDisabled =
    isCheckingOut ||
    cart.length === 0 ||
    (delivery.isDelivery && !delivery.valid);

  const handleVariantScan = useCallback(
    async (rawCode: string): Promise<boolean> => {
      const scannedCode = rawCode.trim();
      if (!scannedCode) return false;

      toast.info(`Đang tra cứu mã biến thể: ${scannedCode}`);
      try {
        const variant = await productVariantApi.findByBarcode(scannedCode);
        const availableStock =
          variant.availableStock ?? variant.stockQuantity ?? 0;

        if (variant.status !== "ACTIVE") {
          toast.error("Biến thể đang ngừng bán, không thể thêm vào giỏ");
          return false;
        }
        if (availableStock <= 0) {
          toast.error("Biến thể đã hết hàng");
          return false;
        }

        return await new Promise<boolean>((resolve) => {
          addPosItem(
            {
              orderId: activeDraftId,
              request: { variantId: variant.variantId, quantity: 1 },
            },
            {
              onSuccess: () => {
                toast.success(
                  `Đã thêm ${variant.productName} (${variant.color} - ${variant.size}) vào đơn hàng`,
                );
                setScannerOpen(false);
                resolve(true);
              },
              onError: (error: unknown) => {
                const message =
                  typeof error === "object" &&
                  error !== null &&
                  "apiMessage" in error &&
                  typeof (error as { apiMessage?: unknown }).apiMessage === "string"
                    ? String((error as { apiMessage: string }).apiMessage)
                    : "Thêm vào giỏ thất bại";
                toast.error(message);
                resolve(false);
              },
            },
          );
        });
      } catch {
        toast.error("Không tìm thấy biến thể tương ứng với mã QR");
        return false;
      }
    },
    [activeDraftId, addPosItem],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "F9") {
        e.preventDefault();
        if (!checkoutDisabled) {
          setShowPaymentDialog(true);
        } else {
          toast.warning(
            "Giỏ hàng chưa có sản phẩm hoặc chưa hợp lệ để thanh toán",
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checkoutDisabled]);

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    let scanLocked = false;

    if (scannerOpen) {
      const startScanner = async () => {
        try {
          html5Qrcode = new Html5Qrcode("pos-qr-reader");
          await html5Qrcode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
            },
            async (decodedText) => {
              if (scanLocked) return;
              scanLocked = true;
              const success = await handleVariantScan(decodedText);
              if (!success) scanLocked = false;
            },
            () => {},
          );
        } catch (err) {
          console.error("Scanner failed", err);
          toast.error("Không thể kết nối camera quét mã QR");
        }
      };

      const t = setTimeout(startScanner, 300);
      return () => {
        clearTimeout(t);
        if (html5Qrcode) {
          html5Qrcode
            .stop()
            .then(() => {
              html5Qrcode?.clear();
            })
            .catch(console.error);
        }
      };
    }
  }, [scannerOpen, handleVariantScan]);

  const handleUpdateQty = (
    detailId: number,
    qty: number,
    revertFn: () => void,
  ) => {
    if (qty <= 0) {
      removeItem(
        { orderId: activeDraftId, detailId },
        {
          onError: (err: any) => {
            toast.error(err?.apiMessage || err?.message);
            revertFn();
          },
        },
      );
      return;
    }
    updateItem(
      { orderId: activeDraftId, detailId, request: { quantity: qty } },
      {
        onError: (err: any) => {
          toast.error(err?.apiMessage || err?.message || "Cập nhật thất bại");
          revertFn();
        },
      },
    );
  };

  const handleSyncPrice = (
    detailId: number,
    variantId: number,
    qty: number,
  ) => {
    removeItem(
      { orderId: activeDraftId, detailId },
      {
        onSuccess: () => {
          addPosItem(
            { orderId: activeDraftId, request: { variantId, quantity: qty } },
            {
              onSuccess: () => {
                toast.success("Đã đồng bộ sản phẩm theo đơn giá mới nhất!");
              },
              onError: (e: any) => {
                toast.error(e?.apiMessage ?? "Đồng bộ giá thất bại");
              },
            },
          );
        },
        onError: (e: any) => {
          toast.error(e?.apiMessage ?? "Xóa món cũ thất bại");
        },
      },
    );
  };

  const handleConfirmRemove = () => {
    if (removingItemId !== null) {
      removeItem({ orderId: activeDraftId, detailId: removingItemId });
      setRemovingItemId(null);
    }
  };

  const handleConfirmCheckout = () => {
    const deliveryInfo =
      delivery.isDelivery && delivery.address
        ? {
            delivery: true,
            orderAddressRequest: delivery.address,
            shippingFee: delivery.deliveryFee,
          }
        : {};

    checkout(
      {
        orderId: activeDraftId,
        request: {
          paymentMethod,
          couponId: discount.couponIdParam,
          ...deliveryInfo,
        },
      },
      {
        onSuccess: (d) => {
          toast.success(
            delivery.isDelivery
              ? "Đặt hàng giao tận nơi thành công!"
              : "Thanh toán thành công!",
          );
          setShowPaymentDialog(false);
          onCheckoutSuccess(d as unknown as OrderResponse);
        },
        onError: (e: any) =>
          toast.error(e?.apiMessage ?? "Thanh toán thất bại"),
      },
    );
  };

  const cartCount = useMemo(() => cart.length, [cart.length]);

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:h-full lg:flex-row lg:overflow-hidden">
      {}
      <div className="flex min-h-[360px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-xs lg:min-h-0">
        {}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30 flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={15} className="text-primary" />
            <span className="text-sm font-semibold">{orderCode ?? "—"}</span>
            {cartCount > 0 && (
              <Badge className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                {cartCount}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {}
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs rounded-lg"
                >
                  <Search size={13} />
                  Tìm sản phẩm (F2)
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-[1000px] h-[85vh] flex flex-col p-4 rounded-xl">
                <DialogHeader className="pb-2 border-b shrink-0">
                  <DialogTitle className="text-sm font-bold text-indigo-750">
                    Tra cứu & Thêm sản phẩm vào đơn hàng
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-3">
                  <ProductPanel activeDraftId={activeDraftId} />
                </div>
              </DialogContent>
            </Dialog>

            {}
            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-[11px] font-bold text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer rounded-lg"
                >
                  <QrCode size={13} className="text-gray-500" />
                  Quét QR/Barcode
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md p-4 rounded-xl">
                <DialogHeader className="pb-2 border-b">
                  <DialogTitle className="text-sm font-bold text-indigo-750">
                    Quét QR biến thể
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-3 text-center">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Đưa camera về phía QR biến thể hoặc mã vạch trên nhãn. Hệ
                    thống sẽ tra cứu chính xác và thêm một sản phẩm vào giỏ.
                  </p>
                  <div
                    id="pos-qr-reader"
                    className="w-full max-w-xs mx-auto overflow-hidden rounded-lg bg-black aspect-square border border-border shadow-xs"
                  />
                  <div className="flex flex-wrap justify-center gap-2">
                    <QrImageScanButton
                      onDecoded={async (decodedText) => {
                        await handleVariantScan(decodedText);
                      }}
                      label="Chọn ảnh QR"
                      className="h-8 gap-1.5 text-xs font-semibold"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScannerOpen(false)}
                      className="text-xs font-semibold text-gray-500 cursor-pointer"
                    >
                      Đóng camera
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {}
        <div className="flex-1 flex flex-col overflow-hidden min-h-[250px]">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
              Danh sách sản phẩm trong giỏ ({cartCount})
            </span>
          </div>

          <div className="flex-1 overflow-auto">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2.5 text-muted-foreground py-16 p-3">
                <div className="rounded-full bg-muted/50 p-4 border border-dashed border-gray-250">
                  <ShoppingCart
                    size={32}
                    className="opacity-30 text-indigo-650"
                  />
                </div>
                <p className="text-xs font-semibold text-gray-400">
                  Đơn hàng chưa có sản phẩm nào
                </p>
                <p className="text-[10px] text-gray-400">
                  Nhấn nút "Tìm sản phẩm (F2)" để thêm sản phẩm vào đơn
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-muted/10 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground sticky top-0 bg-white z-10">
                  <tr>
                    <th className="py-3 pl-4 pr-2 font-semibold">Sản phẩm</th>
                    <th className="py-3 px-2 font-semibold text-right w-36">
                      Đơn giá
                    </th>
                    <th className="py-3 px-2 font-semibold text-center w-36">
                      Số lượng
                    </th>
                    <th className="py-3 px-2 font-semibold text-right w-36">
                      Thành tiền
                    </th>
                    <th className="py-3 pl-2 pr-4 font-semibold text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((item) => (
                    <CartItemRow
                      key={item.itemId}
                      item={item}
                      onUpdateQuantity={handleUpdateQty}
                      onRequestRemove={setRemovingItemId}
                      onSyncPrice={handleSyncPrice}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="flex w-full shrink-0 flex-col rounded-xl border bg-card shadow-xs lg:h-full lg:w-[420px] lg:overflow-hidden xl:w-[460px]">
        {}
        <div className="flex-1 lg:min-h-0 lg:overflow-y-auto">
          <div className="border-b bg-muted/20 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Thông tin đơn hàng
            </p>
          </div>

          {}
          <CustomerSelectionSection
            activeDraftId={activeDraftId}
            customer={customer}
            onCustomerChange={setCustomer}
          />

          {}
          <DeliverySection customer={customer} onDeliveryChange={setDelivery} />

          {}
          <CouponSection
            subtotal={subtotal}
            customerId={customer.id}
            activeDraftId={activeDraftId}
            draftCouponCode={activeDraft.couponCode}
            draftCouponId={activeDraft.couponId}
            draftDiscountAmount={activeDraft.discountAmount}
            onDiscountChange={setDiscount}
          />
        </div>

        {}
        <div className="border-t bg-card shrink-0">
          <PaymentSection
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            subtotal={subtotal}
            discountAmount={discount.discountAmount}
            deliveryFee={delivery.deliveryFee}
            grandTotal={grandTotal}
            isDelivery={delivery.isDelivery}
            deliveryInvalid={!delivery.valid}
            disabled={checkoutDisabled}
            onCheckout={() => setShowPaymentDialog(true)}
          />
        </div>
      </div>

      {}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        paymentMethod={paymentMethod}
        subtotal={subtotal}
        discountAmount={discount.discountAmount}
        deliveryFee={delivery.deliveryFee}
        grandTotal={grandTotal}
        orderCode={orderCode ?? ""}
        isDelivery={delivery.isDelivery}
        receiverName={delivery.address?.receiverName ?? ""}
        customerName={customer.name}
        isPending={isCheckingOut}
        onConfirm={handleConfirmCheckout}
      />

      {removingItemId !== null && (
        <ConfirmModal
          typeConfirm="DELETE"
          message="Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?"
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemovingItemId(null)}
          isPending={false}
        />
      )}
    </div>
  );
}
