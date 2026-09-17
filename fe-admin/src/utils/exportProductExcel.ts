import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { ProductResponse } from "@/api/productApi";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Tạm dừng",
  OUT_OF_STOCK: "Hết hàng",
};

function getPriceRange(variants: ProductResponse["variants"]): string {
  if (!variants?.length) return "";
  const prices = variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return min.toLocaleString("vi-VN") + "đ";
  return `${min.toLocaleString("vi-VN")}đ – ${max.toLocaleString("vi-VN")}đ`;
}

function getTotalStock(variants: ProductResponse["variants"]): number {
  return variants.reduce((sum, v) => sum + v.stockQuantity, 0);
}

function flattenProduct(p: ProductResponse) {
  return {
    ID: p.productId,
    "Tên sản phẩm": p.productName ?? "",
    "Mô tả": p.description ?? "",
    "Danh mục": p.category?.categoryName ?? "",
    "Thương hiệu": p.brand?.brandName ?? "",
    "Số biến thể": p.variants?.length ?? 0,
    Giá: getPriceRange(p.variants),
    "Tồn kho": getTotalStock(p.variants),
    "Trạng thái": STATUS_LABEL[p.status] ?? p.status,
    "Ngày tạo": p.createdAt
      ? dayjs(p.createdAt).format("DD/MM/YYYY HH:mm")
      : "",
    "Ngày cập nhật": p.updatedAt
      ? dayjs(p.updatedAt).format("DD/MM/YYYY HH:mm")
      : "",
  };
}

export function exportProductsToExcel(
  rows: ProductResponse[],
  fileName = "san-pham",
) {
  const data = rows.map(flattenProduct);

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 36 },
    { wch: 40 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 22 },
    { wch: 10 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sản phẩm");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const stamp = dayjs().format("YYYYMMDD-HHmm");
  saveAs(
    new Blob([buf], { type: "application/octet-stream" }),
    `${fileName}-${stamp}.xlsx`,
  );
}
