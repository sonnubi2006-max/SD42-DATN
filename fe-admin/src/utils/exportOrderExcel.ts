import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { OrderResponse } from "@/api/orderApi";

const STATUS_LABEL: Record<string, string> = {
  WAITING_PAYMENT: "Chờ thanh toán",
  DRAFT: "Chờ thanh toán tại quầy",
  PENDING: "Chờ xác nhận",
  WAITING_STOCK: "Chờ bổ sung hàng",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPING: "Đang giao",
  RETURNING: "Đang chuyển hoàn",
  RETURNED_TO_SHOP: "Nhận lại hàng hoàn",
  CANCELED_BY_DAMAGED: "Hủy do hỏng hàng",
  FAILED_DELIVERY: "Giao thất bại",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  REFUNDED: "Hoàn tiền",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Tiền mặt",
  COD: "Thanh toán khi nhận hàng",
  VNPAY: "VNPay",
  MOMO: "Momo",
  BANK_TRANSFER: "Chuyển khoản",
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  ONLINE: "Trực tuyến",
  POS: "Tại quầy",
  POS_SHIP: "Tại quầy - Giao hàng",
};

export function exportOrdersToExcel(
  rows: OrderResponse[],
  fileName = "danh-sach-don-hang",
) {
  const data = rows.map((order, index) => ({
    STT: index + 1,
    "Mã đơn hàng": order.orderCode,
    "Khách hàng": order.customerName,
    "Số điện thoại": order.customerPhone,
    Email: order.customerEmail || "",
    "Địa chỉ nhận hàng": order.shippingAddress || order.receiverAddress || "",
    "Ngày đặt hàng": order.createdAt
      ? dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")
      : "",
    "PT. Thanh toán":
      PAYMENT_METHOD_LABEL[order.paymentMethod] || order.paymentMethod,
    "Trạng thái thanh toán":
      PAYMENT_STATUS_LABEL[order.paymentStatus] || order.paymentStatus,
    "Loại đơn hàng": ORDER_TYPE_LABEL[order.orderType] || order.orderType,
    "Tổng tiền hàng (đ)": order.subtotal,
    "Giảm giá (đ)": order.discountAmount,
    "Phí vận chuyển (đ)": order.shippingFee,
    "Tổng thanh toán (đ)": order.totalAmount,
    "Trạng thái đơn hàng": STATUS_LABEL[order.status] || order.status,
    "Ghi chú": order.note || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 6 }, 
    { wch: 16 }, 
    { wch: 22 }, 
    { wch: 14 }, 
    { wch: 25 }, 
    { wch: 35 }, 
    { wch: 18 }, 
    { wch: 16 }, 
    { wch: 20 }, 
    { wch: 20 }, 
    { wch: 16 }, 
    { wch: 12 }, 
    { wch: 16 }, 
    { wch: 18 }, 
    { wch: 20 }, 
    { wch: 25 }, 
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Đơn hàng");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const stamp = dayjs().format("YYYYMMDD-HHmm");
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `${fileName}-${stamp}.xlsx`,
  );
}
