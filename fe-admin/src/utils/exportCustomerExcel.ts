import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { CustomerResponse } from "@/api/customerApi";

const SOURCE_LABEL: Record<string, string> = {
  GUEST: "Vãng lai",
  REGISTERED: "Có tài khoản",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng",
};

export function exportCustomersToExcel(
  rows: CustomerResponse[],
  fileName = "khach-hang",
) {
  const data = rows.map((c) => ({
    ID: c.customerId,
    "Họ tên": c.fullName ?? "",
    Email: c.email ?? "",
    "Số điện thoại": c.phone ?? "",
    Nguồn: SOURCE_LABEL[c.source] ?? c.source,
    "Có tài khoản": c.hasAccount ? "Có" : "Không",
    "Trạng thái": STATUS_LABEL[c.status] ?? c.status,
    "Nhận ưu đãi": c.emailSubscribed ? "Có" : "Không",
    "Ngày tạo": c.createdAt
      ? dayjs(c.createdAt).format("DD/MM/YYYY HH:mm")
      : "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Khách hàng");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const stamp = dayjs().format("YYYYMMDD-HHmm");
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `${fileName}-${stamp}.xlsx`,
  );
}
