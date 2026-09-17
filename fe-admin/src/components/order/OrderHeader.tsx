import { X, Printer } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import type { OrderResponse, OrderStatus } from "@/api/orderApi";

interface Props {
  order: OrderResponse;
  onClose: () => void;
  onPrint: () => void;
  getStatusColor: (status: OrderStatus) => string;
  getStatusLabel: (status: OrderStatus) => string;
}

export default function OrderHeader({
  order,
  onClose,
  onPrint,
  getStatusColor,
  getStatusLabel,
}: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
          {order && (
            <Badge variant="outline" className={getStatusColor(order.status)}>
              {getStatusLabel(order.status)}
            </Badge>
          )}
        </div>
        {order && (
          <p className="text-xs text-gray-400  mt-0.5">
            Mã đơn: {order.orderCode}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {order && order.status !== "CANCELLED" && (
          <Button
            onClick={onPrint}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            <Printer size={14} />
            In hóa đơn
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}
