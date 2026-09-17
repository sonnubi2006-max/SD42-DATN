import {
  MapPin,
  User as UserIcon,
  Phone,
  Mail,
  CreditCard,
  Tag,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OrderResponse, PaymentMethod } from "@/api/orderApi";
import { Link } from "react-router-dom";

interface OrderInfoCardsProps {
  order: OrderResponse;
}

export default function OrderInfoCards({ order }: OrderInfoCardsProps) {
  const getPayment = (payment: PaymentMethod) => {
    const map: Record<PaymentMethod, string> = {
      CASH: "Tiền mặt",
      BANK_TRANSFER: "Chuyển khoản",
      COD: "Thanh toán khi nhận hàng",
      MOMO: "Momo",
      VNPAY: "VNPay",
    };
    return map[payment] || payment;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {}
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-gray-400" /> Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs text-gray-600">
          <div className="font-bold text-gray-900 flex items-center gap-1">
            <UserIcon size={12} className="text-gray-400" />{" "}
            {order.customerName}
          </div>
          {order.customerPhone && (
            <div className="flex items-center gap-1">
              <Phone size={12} className="text-gray-400" />{" "}
              {order.customerPhone}
            </div>
          )}
          {order.customerEmail && (
            <div className="flex items-center gap-1">
              <Mail size={12} className="text-gray-400" /> {order.customerEmail}
            </div>
          )}
          <div className="border-t border-gray-50 flex items-start gap-1">
            <MapPin size={12} className="text-gray-400 mt-0.5" />
            <span>
              {order.customerAddress ||
                (order.orderType === "POS"
                  ? "Mua trực tiếp tại cửa hàng"
                  : "Khách không có địa chỉ lưu trong hồ sơ")}
            </span>
          </div>
          {order.customerId && order.customerSource === "REGISTERED" && (
            <Link
              to={`/customers/${order.customerId}/edit`}
              className="inline-flex items-center gap-1 border-t border-gray-100 pt-2 font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Xem chi tiết khách hàng <ExternalLink size={12} />
            </Link>
          )}
        </CardContent>
      </Card>
      {}
      {order.orderType !== "POS" && (
        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" /> Địa chỉ nhận hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs text-gray-600">
            <div className="font-bold text-gray-900 flex items-center gap-1">
              <UserIcon size={12} className="text-gray-400" />{" "}
              {order.receiverName}
            </div>
            {order.receiverPhone && (
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-gray-400" />{" "}
                {order.receiverPhone}
              </div>
            )}

            <div className="border-t border-gray-50 flex items-start gap-1">
              <MapPin size={12} className="text-gray-400 mt-0.5" />
              <span>
                {order.receiverAddress ||
                  order.customerAddress ||
                  "Chưa cập nhật"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {}
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard size={14} className="text-gray-400" /> Phương thức thanh
            toán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-gray-600">
          <div>
            <span className="text-gray-400 block mb-0.5">Hình thức:</span>
            <Badge
              variant="default"
              className="font-medium border-transparent p-3 text-xs"
            >
              {getPayment(order.paymentMethod)}
            </Badge>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">
              Trạng thái thanh toán:
            </span>
            <span
              className={`font-bold ${
                order.paymentStatus === "PAID"
                  ? "text-emerald-600"
                  : order.paymentStatus === "REFUNDED"
                    ? "text-orange-600"
                    : "text-red-500"
              }`}
            >
              {order.paymentStatus === "PAID"
                ? "Đã thanh toán"
                : order.paymentStatus === "REFUNDED"
                  ? "Đã hoàn tiền"
                  : "Chờ thanh toán"}
            </span>
          </div>
          {order.couponCode && (
            <div>
              <span className="text-gray-400 block mb-0.5">Mã giảm giá:</span>
              <div className="flex flex-col gap-1 items-start">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded text-[11px]">
                  <Tag size={11} />
                  {order.couponCode}
                </span>
                <span className="text-[11px] text-red-600 font-bold mt-0.5">
                  Đã giảm: -{order.discountAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserIcon size={14} className="text-gray-400" /> Nhân viên xử lý
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-xs text-gray-600">
          {order.staffName ? (
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <UserIcon size={12} className="text-gray-400" />{" "}
              {order.staffName}
            </div>
          ) : (
            <div className="text-gray-400 italic flex items-center gap-1.5">
              <UserIcon size={12} className="text-gray-300" />{" "}
              Chưa phân công
            </div>
          )}
          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Nhân viên phụ trách phục vụ và cập nhật trạng thái đơn hàng này.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
