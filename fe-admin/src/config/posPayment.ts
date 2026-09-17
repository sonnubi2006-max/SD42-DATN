export const POS_BANK = {
  bankId: (import.meta.env.VITE_VIETQR_BANK_ID ?? "").trim(),
  accountNo: (import.meta.env.VITE_VIETQR_ACCOUNT_NO ?? "").trim(),
  accountName: (import.meta.env.VITE_VIETQR_ACCOUNT_NAME ?? "").trim(),
};

export const isPosBankConfigured = Boolean(
  /^\d{6}$/.test(POS_BANK.bankId) &&
    /^\d{6,19}$/.test(POS_BANK.accountNo) &&
    POS_BANK.accountName.length >= 5 &&
    POS_BANK.accountName.length <= 50 &&
    POS_BANK.accountNo !== "0000000000" &&
    !POS_BANK.accountName.includes("CUA HANG ABC"),
);

export function normalizeVietQrAddInfo(addInfo: string): string {
  return addInfo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

export function buildVietQrUrl({
  amount,
  addInfo,
}: {
  amount: number;
  addInfo: string;
}): string {
  if (!isPosBankConfigured) {
    throw new Error("Chưa cấu hình tài khoản VietQR thật cho quầy");
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Số tiền VietQR không được là số âm");
  }

  const normalizedAddInfo = normalizeVietQrAddInfo(addInfo);
  if (!normalizedAddInfo) {
    throw new Error("Nội dung chuyển khoản VietQR không hợp lệ");
  }

  const base = `https://img.vietqr.io/image/${POS_BANK.bankId}-${POS_BANK.accountNo}-compact2.png`;
  const params = new URLSearchParams({
    addInfo: normalizedAddInfo,
    accountName: POS_BANK.accountName,
  });
  if (amount > 0) {
    params.set("amount", String(Math.round(amount)));
  }

  return `${base}?${params.toString()}`;
}
