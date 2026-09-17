import type { OrderResponse } from "@/api/orderApi";
import { User, Phone, Mail, MapPin } from "lucide-react";

export default function CustomerInfo({ order }: { order: OrderResponse }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <User size={13} /> Thông tin khách hàng
        </h3>
        <div className="space-y-1.5 text-sm">
          <p className="font-medium text-gray-900">{order.customerName}</p>
          <p className="text-gray-500 flex items-center gap-1">
            <Phone size={13} /> {order.customerPhone}
          </p>
          {order.customerEmail && (
            <p className="text-gray-500 flex items-center gap-1">
              <Mail size={13} /> {order.customerEmail}
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={13} /> Địa chỉ nhận hàng
        </h3>
        <div className="space-y-1.5 text-sm">
          {order.receiverName && (
            <p className="font-medium text-gray-900">
              Người nhận: {order.receiverName} {order.receiverPhone ? `(${order.receiverPhone})` : ""}
            </p>
          )}
          <p className="text-gray-700 leading-relaxed">
            {order.shippingAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
