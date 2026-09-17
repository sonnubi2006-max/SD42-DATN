import type { ProductStatus } from "@/api/productApi";

const STATUS_MAP: Record<
  ProductStatus,
  { label: string; dot: string; cls: string }
> = {
  ACTIVE: {
    label: "Đang bán",
    dot: "bg-green-500",
    cls: "bg-green-50 text-green-700",
  },
  INACTIVE: {
    label: "Tạm dừng",
    dot: "bg-red-400",
    cls: "bg-red-100 text-red-500",
  },
};

export default function ProductStatusBadge({
  status,
}: {
  status: ProductStatus;
}) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.INACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
