import { MapPin, User as UserIcon, Phone, CreditCard, ClipboardList, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type OrderResponse, PAYMENT_METHOD_LABEL } from "@/api/orderApi";

interface OrderInfoCardsProps {
  order: OrderResponse;
}

export default function OrderInfoCards({ order }: OrderInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      { }
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" /> Địa chỉ nhận hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs text-gray-600">
          <div className="font-bold text-gray-900 flex items-center gap-1">
            <UserIcon size={12} className="text-gray-400" />{" "}
            {order.receiverName || "Chưa cập nhật"}
          </div>
          {order.receiverPhone && (
            <div className="flex items-center gap-1">
              <Phone size={12} className="text-gray-400" />{" "}
              {order.receiverPhone}
            </div>
          )}
          <div className="border-t border-gray-50 pt-2 flex items-start gap-1">
            <MapPin size={12} className="text-gray-400 mt-0.5" />
            <span>
              {order.receiverAddress || (order.orderType === "POS" ? "Mua trực tiếp tại cửa hàng" : "Chưa cập nhật")}
            </span>
          </div>
        </CardContent>
      </Card>

      { }
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={14} className="text-gray-400" /> Phương thức thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-gray-600">
          <div>
            <span className="text-gray-400 block mb-0.5">Hình thức:</span>
            <Badge variant="secondary" className="font-bold border-transparent text-xs">
              {PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod}
            </Badge>
          </div>
          {order.couponCode && (
            <div>
              <span className="text-gray-400 block mb-0.5">Mã giảm giá:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                <Tag size={10} />
                {order.couponCode}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      { }
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList size={14} className="text-gray-400" /> Thông tin đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs text-gray-600">
          <div>
            <span className="text-gray-400 block mb-0.5">Mã đơn hàng:</span>
            <span className="text-gray-900 font-bold">
              #{order.orderCode}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Ghi chú đơn hàng:</span>
            <span className="font-bold text-gray-900">
              {order.note || "Không có ghi chú"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
