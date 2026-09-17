import { useEffect, useRef, useState } from "react";
import { Download, Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { productVariantApi } from "@/api/productVariantApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProductVariantQrDialogProps {
  variant: {
    variantId: number;
    variantCode?: string;
    productName?: string;
    color?: string;
    size?: string;
    barcode?: string;
  };
}

export default function ProductVariantQrDialog({
  variant,
}: ProductVariantQrDialogProps) {
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    },
    [qrUrl],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      requestIdRef.current += 1;
      setQrUrl(null);
      setError("");
      setIsLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoading(true);
    setError("");
    productVariantApi
      .getQrCode(variant.variantId)
      .then((blob) => {
        if (requestIdRef.current === requestId) {
          setQrUrl(URL.createObjectURL(blob));
        }
      })
      .catch((requestError: unknown) => {
        if (requestIdRef.current !== requestId) return;
        const message =
          typeof requestError === "object" &&
            requestError !== null &&
            "apiMessage" in requestError &&
            typeof (requestError as { apiMessage?: unknown }).apiMessage === "string"
            ? String((requestError as { apiMessage: string }).apiMessage)
            : "Không thể tạo mã QR cho biến thể";
        setError(message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsLoading(false);
      });
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const anchor = document.createElement("a");
    anchor.href = qrUrl;
    anchor.download = `QR-${variant.variantCode || variant.variantId}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("Đã tải mã QR biến thể");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          title="Xem QR biến thể"
          aria-label={`Xem QR biến thể ${variant.variantCode}`}
        >
          <QrCode size={15} /> QR
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <QrCode size={18} className="text-indigo-600" />
            QR biến thể
          </DialogTitle>
          <DialogDescription>
            Quét mã này tại màn hình bán hàng để thêm đúng biến thể vào giỏ.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border bg-gray-50 p-4">
          {isLoading && (
            <div className="flex flex-col items-center gap-2 text-sm text-gray-500">
              <Loader2 size={28} className="animate-spin text-indigo-600" />
              Đang sinh mã QR...
            </div>
          )}

          {!isLoading && error && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-red-600">{error}</p>
              <Button size="sm" variant="outline" onClick={() => handleOpenChange(false)}>
                Đóng
              </Button>
            </div>
          )}

          {!isLoading && qrUrl && (
            <>
              <img
                src={qrUrl}
                alt={`QR biến thể ${variant.variantCode}`}
                className="size-56 rounded-lg border bg-white p-2 shadow-sm"
              />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {variant.productName || "Biến thể sản phẩm"}
                </p>
                <p className="text-xs text-gray-500">
                  {variant.color} · Size {variant.size}
                </p>
                <p className="mt-1  text-xs font-semibold text-indigo-700">
                  {variant.barcode || variant.variantCode}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Đóng
          </Button>
          <Button onClick={handleDownload} disabled={!qrUrl || isLoading} className="gap-2">
            <Download size={15} /> Tải QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
