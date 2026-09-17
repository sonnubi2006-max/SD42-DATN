
import { useCallback, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { parseCccdQR } from "./parseCccdQR";
import type { CccdData } from "./parseCccdQR";

export function useCccdScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [loading, setLoading] = useState(false);

  const start = useCallback(async (onResult: (data: CccdData) => void | Promise<void>) => {
    setLoading(true);
    const scanner = new Html5Qrcode("cccd-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          try {
            const data = parseCccdQR(decodedText);
            try {
              await scanner.stop();
            } catch (e) {
              console.warn("Scanner stop error during callback", e);
            }
            try {
              await scanner.clear();
            } catch (e) {
              console.warn("Scanner clear error during callback", e);
            }
            scannerRef.current = null;

            setLoading(false);
            await onResult(data);
          } catch (e) {
            console.error("Invalid QR", e);
          }
        },
        () => {},
      );
      setLoading(false);
    } catch (error) {
      scannerRef.current = null;
      setLoading(false);
      try {
        await scanner.clear();
      } catch {
        // Camera chưa khởi động hoàn toàn nên có thể không cần clear.
      }
      throw error;
    }
  }, []);

  const stop = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn("Scanner stop error in stop()", e);
      }
      try {
        await scannerRef.current.clear();
      } catch (e) {
        console.warn("Scanner clear error in stop()", e);
      }
      scannerRef.current = null;
    }
    setLoading(false);
  }, []);

  return { start, stop, loading };
}
