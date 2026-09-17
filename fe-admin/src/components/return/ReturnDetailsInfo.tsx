import { User, Phone, FileText, Calendar } from "lucide-react";

interface ReturnDetailsInfoProps {
  customerName: string;
  customerPhone: string;
  orderCode: string;
  createdAt: string;
}

export default function ReturnDetailsInfo({
  customerName,
  customerPhone,
  orderCode,
  createdAt,
}: ReturnDetailsInfoProps) {
  return (
    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
      <div className="space-y-1.5">
        <p className="font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 text-[10px]">
          <User size={12} /> Khách hàng
        </p>
        <p className="text-sm font-medium text-gray-900">{customerName}</p>
        <p className="text-gray-500 flex items-center gap-1">
          <Phone size={12} /> {customerPhone}
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 text-[10px]">
          <FileText size={12} /> Đơn hàng liên quan
        </p>
        <p className="text-sm  font-bold text-gray-900">{orderCode}</p>
        <p className="text-gray-500 flex items-center gap-1">
          <Calendar size={12} />{" "}
          {new Date(createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>
    </div>
  );
}
