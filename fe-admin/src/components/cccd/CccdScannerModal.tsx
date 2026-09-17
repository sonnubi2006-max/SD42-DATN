import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useCccdScanner } from "./useCccdScanner";
import { parseCccdQR, type CccdData } from "./parseCccdQR";
import QrImageScanButton from "@/components/QrImageScanButton";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: CccdData) => void | Promise<void>;
}

export default function CccdScannerModal({ open, onClose, onSuccess }: Props) {
  const { start, stop, loading } = useCccdScanner();
  const callbacksRef = useRef({ onClose, onSuccess });

  useEffect(() => {
    callbacksRef.current = { onClose, onSuccess };
  }, [onClose, onSuccess]);

  useEffect(() => {
    if (!open) return;

    void start(async (data) => {
      await callbacksRef.current.onSuccess(data);
      callbacksRef.current.onClose();
    }).catch(() => undefined);

    return () => {
      void stop();
    };
  }, [open, start, stop]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="w-[420px] bg-white rounded-xl overflow-hidden shadow-xl">
        {}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-medium">Quét CCCD</h2>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {}
        <div className="p-4">
          <div
            id="cccd-reader"
            className="w-full min-h-[300px] rounded-lg overflow-hidden"
          />
        </div>

        {}
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-gray-500">
            {loading
              ? "Đang khởi động camera... Bạn vẫn có thể chọn ảnh QR từ máy."
              : "Đưa mã QR vào khung hoặc chọn ảnh QR CCCD từ máy."}
          </p>
          <QrImageScanButton
            label="Chọn ảnh QR CCCD"
            className="w-full h-8 gap-1.5 text-xs font-semibold"
            onDecoded={async (decodedText) => {
              console.log(decodedText);
              try {
                const data = parseCccdQR(decodedText);
                console.log(data);
                await stop();
                await onSuccess(data);
                onClose();
              } catch {
                throw new Error("Ảnh không chứa mã QR CCCD hợp lệ");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
