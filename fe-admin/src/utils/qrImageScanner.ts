import { Html5Qrcode } from "html5-qrcode";

const MAX_QR_IMAGE_SIZE = 10 * 1024 * 1024;
let readerSequence = 0;

export async function scanQrCodeFromImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Vui lòng chọn một tệp hình ảnh");
  }
  if (file.size > MAX_QR_IMAGE_SIZE) {
    throw new Error("Ảnh QR không được vượt quá 10 MB");
  }

  readerSequence += 1;
  const readerId = `local-qr-reader-${Date.now()}-${readerSequence}`;
  const container = document.createElement("div");
  container.id = readerId;
  container.setAttribute("aria-hidden", "true");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "1px";
  container.style.height = "1px";
  container.style.overflow = "hidden";
  document.body.appendChild(container);

  const scanner = new Html5Qrcode(readerId);
  try {
    const decodedText = await scanner.scanFile(file, false);
    if (!decodedText.trim()) {
      throw new Error("Không tìm thấy nội dung trong mã QR");
    }
    return decodedText.trim();
  } catch {
    throw new Error(
      "Không tìm thấy mã QR hợp lệ trong ảnh. Hãy chọn ảnh rõ nét và chứa đầy đủ mã QR.",
    );
  } finally {
    try {
      await scanner.clear();
    } catch {
      // scanFile không khởi động camera nên một số trình duyệt không cần clear.
    }
    container.remove();
  }
}
