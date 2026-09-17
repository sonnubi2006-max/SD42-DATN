export const VARIANT_IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp";

export const VARIANT_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
];

export const MAX_VARIANT_IMAGE_SIZE = 5 * 1024 * 1024;

export function validateVariantImage(file: File): string | null {
  if (!VARIANT_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return "Chỉ nhận JPG, JPEG, PNG, WEBP, GIF, AVIF hoặc BMP.";
  }
  if (file.size > MAX_VARIANT_IMAGE_SIZE) {
    return "Ảnh không được vượt quá 5MB.";
  }
  return null;
}
