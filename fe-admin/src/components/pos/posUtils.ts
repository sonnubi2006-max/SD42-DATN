import type { ProductResponse } from "@/api/productApi";
import type { ProductVariantResponse } from "@/api/productVariantApi";
import type { PaymentMethod } from "@/api/orderApi";
import { Banknote, Landmark } from "lucide-react";

export interface CartLine {
  product: ProductResponse;
  variant: ProductVariantResponse;
  quantity: number;
}

export const money = (n: number) => `${Number(n).toLocaleString("vi-VN")}đ`;

export const formatNumberWithCommas = (val: string | number) => {
  if (val === "" || val === null || val === undefined) return "";
  const numStr = String(val).replace(/\D/g, "");
  if (!numStr) return "";
  return Number(numStr).toLocaleString("vi-VN");
};

export const parseNumberFromCommas = (str: string) => {
  return str.replace(/\D/g, "");
};

export const unitPrice = (v: ProductVariantResponse) => v.salePrice ?? v.price;

export const availableStock = (v: ProductVariantResponse) =>
  Math.max(0, v.stockQuantity ?? v.availableStock ?? 0);

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: "CASH", label: "Tiền mặt", icon: Banknote },
  { value: "BANK_TRANSFER", label: "Chuyển khoản", icon: Landmark },
];

export function variantMatchesKeyword(
  product: ProductResponse,
  variant: ProductVariantResponse,
  keyword: string,
) {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;

  return [
    product.productName,
    product.brand?.brandName,
    product.category?.categoryName,
    variant.variantCode,
    variant.barcode,
    variant.color,
    variant.size,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}
