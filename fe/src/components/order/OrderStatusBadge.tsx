import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/api/orderApi";

const STYLES: Record<OrderStatus, string> = {
  WAITING_PAYMENT: "bg-amber-100 text-amber-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  WAITING_STOCK: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPING: "bg-indigo-100 text-indigo-700",
  RETURNING: "bg-purple-100 text-purple-700",
  RETURNED_TO_SHOP: "bg-emerald-100 text-emerald-700",
  CANCELED_BY_DAMAGED: "bg-zinc-100 text-zinc-700",
  FAILED_DELIVERY: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-orange-100 text-orange-700",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={STYLES[status]}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}
