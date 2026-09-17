

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("vi-VN").format(value);
}

const MEDIA_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(
    /\/api\/v1\/?$/,
    "",
  ) ?? "http://localhost:8080";

export function resolveImageUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${MEDIA_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function discountPercent(
  price: number | null | undefined,
  salePrice: number | null | undefined,
): number {
  if (!price || !salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}
