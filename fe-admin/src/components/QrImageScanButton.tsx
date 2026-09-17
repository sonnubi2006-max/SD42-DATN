import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { scanQrCodeFromImage } from "@/utils/qrImageScanner";

interface QrImageScanButtonProps {
  onDecoded: (decodedText: string) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function QrImageScanButton({
  onDecoded,
  disabled = false,
  label = "Quét từ ảnh",
  className,
}: QrImageScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setIsScanning(true);
    try {
      const decodedText = await scanQrCodeFromImage(file);
      await onDecoded(decodedText);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đọc mã QR từ ảnh đã chọn",
      );
    } finally {
      setIsScanning(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || isScanning}
        onChange={(event) => handleFileChange(event.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isScanning}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        {isScanning ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ImageUp size={14} />
        )}
        {isScanning ? "Đang đọc ảnh..." : label}
      </Button>
    </>
  );
}
