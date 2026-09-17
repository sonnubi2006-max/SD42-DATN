import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Clock3,
  Loader2,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
  QrCode,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import orderApi from "@/api/orderApi";
import paymentApi, {
  getGuestPaymentAccess,
  saveGuestPaymentAccess,
  type GuestPaymentAccess,
} from "@/api/paymentApi";
import { formatCurrency } from "@/utils/format";
import useAuthStore from "@/store/authStore";
import QRCode from "qrcode";

interface VNPayState {
  paymentUrl?: string;
  expireAt?: string;
  orderCode?: string;
  guestPhone?: string;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainSeconds = Math.max(0, seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainSeconds}`;
}

export default function VNPayPaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as VNPayState;
  const numericOrderId = Number(orderId);
  const isAuthenticated = useAuthStore((store) => store.isAuthenticated());
  const [guestAccess] = useState<GuestPaymentAccess | null>(() => {
    if (numericOrderId && state.orderCode && state.guestPhone) {
      const access = {
        orderId: numericOrderId,
        orderCode: state.orderCode,
        phone: state.guestPhone,
      };
      saveGuestPaymentAccess(access);
      return access;
    }
    return numericOrderId ? getGuestPaymentAccess(numericOrderId) : null;
  });

  const [paymentUrl, setPaymentUrl] = useState(state.paymentUrl);
  const [orderCode, setOrderCode] = useState(
    state.orderCode || guestAccess?.orderCode || "",
  );
  const [amount, setAmount] = useState<number | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrError, setQrError] = useState(false);

  const [remaining, setRemaining] = useState(() => {
    if (state.expireAt) {
      return Math.max(0, Math.floor((new Date(state.expireAt).getTime() - Date.now()) / 1000));
    }
    return 15 * 60;
  });

  const [loading, setLoading] = useState(!state.paymentUrl);
  const [checking, setChecking] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const expired = remaining <= 0;

  useEffect(() => {
    if (!numericOrderId) return;

    setLoading(true);
    const initRequest = guestAccess
      ? paymentApi.initGuest(guestAccess)
      : paymentApi.init(numericOrderId);
    const orderRequest = guestAccess
      ? Promise.resolve(null)
      : orderApi.getById(numericOrderId).catch(() => null);

    Promise.all([initRequest.catch(() => null), orderRequest])
      .then(([initRes, orderRes]) => {
        if (initRes) {
          setPaymentUrl(initRes.paymentUrl);
          setOrderCode(initRes.orderCode);
          if (initRes.amount) setAmount(initRes.amount);
          if (initRes.expireAt) {
            setRemaining(
              Math.max(
                0,
                Math.floor((new Date(initRes.expireAt).getTime() - Date.now()) / 1000)
              )
            );
          }
        }

        if (orderRes) {
          setOrderCode(orderRes.orderCode);
          if (!initRes?.amount) setAmount(orderRes.finalAmount);
        }
      })
      .finally(() => setLoading(false));
  }, [guestAccess, numericOrderId]);

  useEffect(() => {
    let active = true;

    if (!paymentUrl) {
      setQrImageUrl("");
      setQrError(true);
      return () => {
        active = false;
      };
    }

    setQrError(false);
    QRCode.toDataURL(paymentUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (active) setQrImageUrl(dataUrl);
      })
      .catch(() => {
        if (active) {
          setQrImageUrl("");
          setQrError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [paymentUrl]);

  useEffect(() => {
    if (expired) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expired]);

  const handleRefreshQr = async () => {
    if (!numericOrderId) return;
    setLoading(true);
    try {
      const result = guestAccess
        ? await paymentApi.initGuest(guestAccess)
        : await paymentApi.init(numericOrderId);
      setPaymentUrl(result.paymentUrl);
      if (result.amount) setAmount(result.amount);
      setRemaining(
        result.expireAt
          ? Math.max(
            0,
            Math.floor(
              (new Date(result.expireAt).getTime() - Date.now()) / 1000,
            ),
          )
          : 15 * 60,
      );
      toast.success("Đã tải lại giao dịch VNPay");
    } catch {
      toast.error("Giao dịch đã hết hạn, không thể tạo lại mã QR");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCheckStatus = async () => {
    if (!numericOrderId) return;
    setChecking(true);
    try {
      const payment = guestAccess
        ? await paymentApi.getGuestStatus(guestAccess)
        : await paymentApi.getByOrder(numericOrderId);
      if (payment.paymentStatus === "PAID") {
        toast.success("Thanh toán thành công!");
        if (guestAccess) {
          navigate("/tra-cuu-don-hang", {
            state: {
              orderCode: guestAccess.orderCode,
              phone: guestAccess.phone,
            },
          });
        } else {
          navigate(`/orders/${numericOrderId}`);
        }
      } else {
        toast.info("Thanh toán vẫn đang chờ xử lý từ ngân hàng/VNPay");
      }
    } catch {
      toast.info("Đang chờ phản hồi thanh toán từ ngân hàng...");
    } finally {
      setChecking(false);
    }
  };

  const currentAddInfo = orderCode || `ORD${numericOrderId}`;
  const currentAmount = amount || 0;

  if (loading) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">
          Đang khởi tạo mã QR thanh toán VNPay...
        </p>
      </div>
    );
  }

  if (!isAuthenticated && !guestAccess) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center space-y-4">
        <div className="size-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Yêu cầu xác thực thông tin</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Đơn hàng này thuộc chế độ khách vãng lai. Vui lòng sử dụng số điện thoại đặt hàng để tra cứu và thanh toán.
        </p>
        <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer">
          <Link to="/tra-cuu-don-hang">Đi tới trang tra cứu đơn hàng</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card className="overflow-hidden shadow-lg border-border/60">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 text-center py-6">
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-blue-100 text-blue-600">
            <QrCode className="size-8" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Thanh toán Chuyển khoản QR VNPay
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Đơn hàng mã: <span className="font-bold  text-foreground">#{currentAddInfo}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          { }
          <div
            className={`rounded-2xl p-4 border text-center transition-all ${expired
                ? "bg-red-50/80 border-red-200 text-red-700"
                : "bg-blue-50/50 border-blue-100 text-blue-900"
              }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
              <Clock3 className="size-4 animate-pulse" />
              {expired ? "Mã QR đã hết hạn thanh toán" : "Thời gian hết hạn mã QR"}
            </div>

            <div
              className={`mt-1.5 text-4xl font-extrabold  tracking-tight ${expired ? "text-red-600" : "text-blue-600"
                }`}
            >
              {formatTime(remaining)}
            </div>

            {!expired && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Vui lòng hoàn tất chuyển khoản trước khi đồng hồ đếm ngược về 00:00.
              </p>
            )}
          </div>

          { }
          <div className="relative flex flex-col items-center justify-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            {expired ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
                <div className="size-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="size-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Mã QR đã hết hạn!</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Để đảm bảo an toàn giao dịch, mã QR thanh toán đã đóng. Bạn có thể bấm nút dưới đây để tạo mã QR mới.
                  </p>
                </div>
                <Button
                  onClick={handleRefreshQr}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                  Thử tải lại giao dịch VNPay
                </Button>
              </div>
            ) : (
              <>
                {qrError ? (
                  <div className="flex max-w-sm flex-col items-center gap-2 py-8 text-center">
                    <AlertTriangle className="size-9 text-amber-500" />
                    <p className="text-sm font-bold text-amber-800">
                      Không thể tạo mã QR cho giao dịch
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hãy sử dụng nút mở cổng thanh toán VNPay bên dưới.
                    </p>
                  </div>
                ) : qrImageUrl ? (
                  <div className="relative p-3 bg-white rounded-xl shadow-inner border border-gray-100">
                    <img
                      src={qrImageUrl}
                      alt="QR giao dịch VNPay"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                ) : (
                  <Loader2 className="my-24 size-8 animate-spin text-blue-600" />
                )}

                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="size-4" />
                  QR chứa liên kết giao dịch VNPay đã được backend ký
                </div>
              </>
            )}
          </div>

          { }
          <div className="rounded-xl border bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <span className="text-muted-foreground">Cổng thanh toán:</span>
              <span className="font-bold text-foreground">VNPay Gateway</span>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-border/60">
              <span className="text-muted-foreground">Số tiền thanh toán:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600 text-base tabular-nums">{formatCurrency(currentAmount)}</span>
                <button
                  onClick={() => handleCopyText(String(currentAmount), "Số tiền")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                  title="Sao chép số tiền"
                >
                  {copiedField === "Số tiền" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Nội dung chuyển khoản:</span>
              <div className="flex items-center gap-2">
                <span className=" font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded border border-red-200">{currentAddInfo}</span>
                <button
                  onClick={() => handleCopyText(currentAddInfo, "Nội dung chuyển khoản")}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                  title="Sao chép nội dung"
                >
                  {copiedField === "Nội dung chuyển khoản" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                </button>
              </div>
            </div>
          </div>

          { }
          <div className="space-y-2.5 pt-2">
            {!expired && paymentUrl && (
              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs rounded-xl cursor-pointer"
                onClick={() => {
                  window.location.href = paymentUrl;
                }}
              >
                <ExternalLink className="size-4" />
                Mở Cổng thanh toán VNPay Gateway (Nếu muốn trả bằng Thẻ ATM / VNPAY QR)
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full h-10 gap-2 text-xs font-semibold rounded-xl cursor-pointer"
              disabled={checking}
              onClick={handleCheckStatus}
            >
              {checking ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4 text-emerald-600" />}
              Tôi đã chuyển khoản thành công, kiểm tra trạng thái
            </Button>

            <div className="text-center pt-2">
              <Link
                to={
                  guestAccess || !isAuthenticated
                    ? "/tra-cuu-don-hang"
                    : `/orders/${numericOrderId}`
                }
                state={
                  guestAccess
                    ? {
                      orderCode: guestAccess.orderCode,
                      phone: guestAccess.phone,
                    }
                    : undefined
                }
                className="text-xs text-muted-foreground hover:text-foreground underline transition"
              >
                Xem chi tiết đơn hàng #{currentAddInfo}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
