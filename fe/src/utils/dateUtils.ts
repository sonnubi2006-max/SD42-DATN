

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toInputDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function toInputDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function isExpiringSoon(
  endIso: string | null | undefined,
  thresholdDays = 7,
): boolean {
  if (!endIso) return false;
  const end = new Date(endIso).getTime();
  const now = Date.now();
  const threshold = thresholdDays * 24 * 60 * 60 * 1000;
  return end > now && end - now <= threshold;
}

export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
