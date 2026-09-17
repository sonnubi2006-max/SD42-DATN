import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import paymentApi, { getGuestPaymentAccess, type PaymentResponse } from "@/api/paymentApi";
import { formatCurrency } from "@/utils/format";
import useAuthStore from "@/store/authStore";

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((store) => store.isAuthenticated());
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [payment, setPayment] = useState<PaymentResponse | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    paymentApi
      .vnpayReturn(query)
      .then((res) => {
        setPayment(res);
        setStatus(res.paymentStatus === "PAID" ? "success" : "failed");
      })
      .catch(() => setStatus("failed"));

  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      {status === "loading" && (
        <>
          <Loader2 className="size-12 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Đang xác nhận thanh toán…</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 className="size-14 text-green-600" />
          <h1 className="mt-4 text-2xl font-bold">Thanh toán thành công</h1>
          {payment && (
            <p className="mt-2 text-muted-foreground">
              Đơn #{payment.orderCode} • {formatCurrency(payment.amount)}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            {payment && (
              <Button asChild>
                {isAuthenticated ? (
                  <Link to={`/orders/${payment.orderId}`}>Xem đơn hàng</Link>
                ) : (
                  <Link
                    to="/tra-cuu-don-hang"
                    state={{
                      orderCode: payment.orderCode,
                      phone: getGuestPaymentAccess(payment.orderId)?.phone || "",
                    }}
                  >
                    Xem đơn hàng
                  </Link>
                )}
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to="/products">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle className="size-14 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Thanh toán thất bại</h1>
          <p className="mt-2 text-muted-foreground">
            Giao dịch không thành công hoặc đã bị huỷ.
          </p>
          <div className="mt-6 flex gap-3">
            <Button asChild>
              {isAuthenticated ? (
                <Link to="/orders">Đơn hàng của tôi</Link>
              ) : (
                <Link
                  to="/tra-cuu-don-hang"
                  state={
                    payment
                      ? {
                          orderCode: payment.orderCode,
                          phone: getGuestPaymentAccess(payment.orderId)?.phone || "",
                        }
                      : undefined
                  }
                >
                  Tra cứu đơn hàng
                </Link>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
