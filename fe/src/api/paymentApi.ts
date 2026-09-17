
import axiosInstance from "./axiosInstance";
import type { PaymentMethod } from "./orderApi";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface InitPaymentResponse {
  paymentId: number;
  orderCode: string;
  amount: number;
  paymentUrl: string;
  status: PaymentStatus;
  expireAt?: string;
}

export interface PaymentResponse {
  paymentId: number;
  orderId: number;
  orderCode: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionCode?: string;
  bankCode?: string;
  cardType?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface GuestPaymentAccess {
  orderId: number;
  orderCode: string;
  phone: string;
}

const GUEST_PAYMENT_KEY_PREFIX = "guest-payment:";

export function saveGuestPaymentAccess(access: GuestPaymentAccess): void {
  try {
    sessionStorage.setItem(
      `${GUEST_PAYMENT_KEY_PREFIX}${access.orderId}`,
      JSON.stringify(access),
    );
  } catch {
    // The payment page can still use credentials passed in router state.
  }
}

export function getGuestPaymentAccess(
  orderId: number,
): GuestPaymentAccess | null {
  try {
    const raw = sessionStorage.getItem(`${GUEST_PAYMENT_KEY_PREFIX}${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestPaymentAccess>;
    if (
      parsed.orderId !== orderId ||
      typeof parsed.orderCode !== "string" ||
      typeof parsed.phone !== "string"
    ) {
      return null;
    }
    return parsed as GuestPaymentAccess;
  } catch {
    return null;
  }
}

const paymentApi = {
  init: async (orderId: number): Promise<InitPaymentResponse> => {
    const { data } = await axiosInstance.post<InitPaymentResponse>(
      "/payments/init",
      { orderId },
    );
    return data;
  },

  getByOrder: async (orderId: number): Promise<PaymentResponse> => {
    const { data } = await axiosInstance.get<PaymentResponse>(
      `/payments/order/${orderId}`,
    );
    return data;
  },

  initGuest: async (
    access: GuestPaymentAccess,
  ): Promise<InitPaymentResponse> => {
    const { data } = await axiosInstance.post<InitPaymentResponse>(
      "/payments/guest/init",
      access,
    );
    return data;
  },

  getGuestStatus: async (
    access: GuestPaymentAccess,
  ): Promise<PaymentResponse> => {
    const { data } = await axiosInstance.post<PaymentResponse>(
      "/payments/guest/status",
      access,
    );
    return data;
  },

  vnpayReturn: async (query: string): Promise<PaymentResponse> => {
    const { data } = await axiosInstance.get<PaymentResponse>(
      `/payments/vnpay/return${query.startsWith("?") ? query : `?${query}`}`,
    );
    return data;
  },
};

export default paymentApi;
