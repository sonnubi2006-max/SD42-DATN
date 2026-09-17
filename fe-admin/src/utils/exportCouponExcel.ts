import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { CouponResponse } from "@/api/couponApi";

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Hoạt động",
  EXPIRED: "Hết hạn",
  INACTIVE: "Vô hiệu hoá",
};

const TYPE_LABEL: Record<string, string> = {
  PUBLIC: "Công khai",
  PERSONAL: "Cá nhân",
};

const DISCOUNT_LABEL: Record<string, string> = {
  PERCENTAGE: "Phần trăm",
  FIXED_AMOUNT: "Số tiền cố định",
};

function fmtDate(v?: string) {
  return v ? dayjs(v).format("DD/MM/YYYY") : "";
}

export function exportCouponsToExcel(
  rows: CouponResponse[],
  fileName = "phieu-giam-gia",
) {
  const data = rows.map((c) => ({
    ID: c.couponId,
    Mã: c.code,
    "Loại phiếu": TYPE_LABEL[c.couponType] ?? c.couponType,
    "Mô tả": c.description ?? "",
    "Loại giảm giá": DISCOUNT_LABEL[c.discountType] ?? c.discountType,
    "Giá trị giảm":
      c.discountType === "PERCENTAGE"
        ? `${c.discountValue}%`
        : c.discountValue,
    "Giảm tối đa": c.maxDiscountAmount ?? "",
    "Đơn tối thiểu": c.minOrderValue ?? "",
    "Tổng số lượng": c.totalQuantity ?? "Không giới hạn",
    "Đã dùng": c.usedQuantity ?? 0,
    "Còn lại": c.remainingQuantity ?? "",
    "Mỗi khách tối đa": c.maxUsesPerUser ?? "Không giới hạn",
    "Khách áp dụng":
      c.couponType === "PERSONAL"
        ? (c.targetedCustomers ?? [])
            .map((t) => t.fullName || t.email || `#${t.customerId}`)
            .join(", ")
        : "",
    "Ngày bắt đầu": fmtDate(c.startDate),
    "Ngày kết thúc": fmtDate(c.endDate),
    "Trạng thái": STATUS_LABEL[c.status] ?? c.status,
    "Ngày tạo": c.createdAt
      ? dayjs(c.createdAt).format("DD/MM/YYYY HH:mm")
      : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 12 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phiếu giảm giá");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const stamp = dayjs().format("YYYYMMDD-HHmm");
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `${fileName}-${stamp}.xlsx`,
  );
}
