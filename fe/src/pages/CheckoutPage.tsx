import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  ImageOff,
  Loader2,
  MapPin,
  Tag,
  Plus,
  Sparkles,
  ShieldCheck,
  Truck,
  CheckCircle2,
  RotateCw,
  TicketPercent,
  PackageCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAddresses, useCreateAddress } from "@/hooks/useAddress";
import { useCreateOrder } from "@/hooks/useOrder";
import couponApi, {
  couponDiscount,
  type CouponResponse,
} from "@/api/couponApi";
import paymentApi, { saveGuestPaymentAccess } from "@/api/paymentApi";
import {
  type CreateOrderRequest,
  type OrderResponse,
  type PaymentMethod,
  type PriceChange,
  PAYMENT_METHOD_LABEL,
} from "@/api/orderApi";
import type { AddressRequest, AddressResponse } from "@/api/addressApi";
import { formatCurrency, resolveImageUrl } from "@/utils/format";
import useCheckoutStore from "@/store/checkoutStore";
import AddressModal from "@/components/address/AddressModal";
import useAuthStore from "@/store/authStore";
import useGuestCartStore from "@/store/guestCartStore";
import { vnAddressApi } from "@/api/vnAddressApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const METHODS: PaymentMethod[] = ["COD", "VNPAY"];
const configuredFallbackFee = Number(
  import.meta.env.VITE_DEFAULT_SHIPPING_FEE ?? 35000,
);
const FALLBACK_SHIPPING_FEE =
  Number.isFinite(configuredFallbackFee) && configuredFallbackFee >= 0
    ? configuredFallbackFee
    : 35000;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const checkoutItems = useCheckoutStore((s) => s.items);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const updateCheckoutPrices = useCheckoutStore((s) => s.updatePrices);
  const removeGuestItems = useGuestCartStore((state) => state.removeItems);
  const { data: addresses } = useAddresses();
  const { mutate: createOrder, isPending: placing } = useCreateOrder();
  const { mutate: createAddress, isPending: creatingAddress } =
    useCreateAddress();

  const [shippingFee, setShippingFee] = useState<number>(FALLBACK_SHIPPING_FEE);
  const [calculatingShip, setCalculatingShip] = useState<boolean>(false);
  const [shippingFeeSource, setShippingFeeSource] = useState<"default" | "ghn">(
    "default",
  );
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [refreshingCheckout, setRefreshingCheckout] = useState(false);
  const [guestOrder, setGuestOrder] = useState<OrderResponse | null>(null);

  const {
    data: coupons = [],
    refetch: refetchCoupons,
    isFetching: refreshingCoupons,
    isSuccess: couponsLoaded,
  } = useQuery({
    queryKey: ["coupons", "active"],
    queryFn: () => couponApi.getActiveCoupons(),
  });

  const items = checkoutItems;
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const originalSubtotal = items.reduce(
    (sum, it) => sum + (it.originalPrice ?? it.price) * it.quantity,
    0,
  );

  const defaultAddrId = useMemo(
    () =>
      addresses?.find((a) => a.isDefault)?.addressId ??
      addresses?.[0]?.addressId,
    [addresses],
  );
  const [selectedAddrId, setSelectedAddrId] = useState<number | undefined>();
  const [guestAddress, setGuestAddress] = useState<
    AddressResponse | undefined
  >();
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const addressId = selectedAddrId ?? defaultAddrId;
  const selectedAccountAddress: AddressResponse | undefined = addresses?.find(
    (a) => a.addressId === addressId,
  );
  const selectedAddr = isAuthenticated ? selectedAccountAddress : guestAddress;

  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [couponPopupOpen, setCouponPopupOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "eligible" | "ineligible">(
    "all",
  );

  const [method, setMethod] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponResponse | null>(null);
  const [suspendAutoCoupon, setSuspendAutoCoupon] = useState(false);
  const autoCouponKeyRef = useRef("");
  const couponValidationGenerationRef = useRef(0);

  const [shippingFeeError, setShippingFeeError] = useState(false);

  useEffect(() => {
    if (!selectedAddr) {
      setShippingFee(FALLBACK_SHIPPING_FEE);
      setShippingFeeSource("default");
      setShippingFeeError(false);
      return;
    }

    let active = true;

    const cleanName = (name: string) => {
      if (!name) return "";
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(
          /^(tinh|thanh pho|thanh pho.|quan|huyen|thi xa|phuong|xa|thi tran)\s+/gi,
          "",
        )
        .replace(/\s+/g, " ")
        .trim();
    };

    const fetchGhnFee = async () => {
      setCalculatingShip(true);
      setShippingFee(FALLBACK_SHIPPING_FEE);
      setShippingFeeSource("default");
      setShippingFeeError(false);
      try {
        let toDistrictId = selectedAddr.ghnDistrictId;
        let toWardCode = selectedAddr.ghnWardCode;

        if (!toDistrictId || !toWardCode) {
          const provinces = await vnAddressApi.getProvinces();
          if (!active) return;

          const targetProvince = cleanName(selectedAddr.province);
          const provinceMatch = provinces.find(
            (p) =>
              cleanName(p.name) === targetProvince ||
              String(p.code) === selectedAddr.province,
          );
          if (!provinceMatch)
            throw new Error("Không tìm thấy tỉnh/thành của địa chỉ cũ");

          const wards = await vnAddressApi.getWardsByProvince(
            provinceMatch.code,
            selectedAddr.province,
          );
          if (!active) return;

          const targetWard = cleanName(
            selectedAddr.wardName || selectedAddr.ward,
          );
          const targetDistrict = cleanName(
            selectedAddr.districtName || selectedAddr.district,
          );
          const wardMatch = wards.find(
            (w) =>
              w.ghnWardCode === selectedAddr.ward ||
              (cleanName(w.wardName) === targetWard &&
                (!targetDistrict ||
                  targetDistrict === "-" ||
                  cleanName(w.districtName) === targetDistrict)),
          );
          toDistrictId = wardMatch?.districtId;
          toWardCode = wardMatch?.ghnWardCode;
        }

        if (!toDistrictId || toDistrictId <= 0 || !toWardCode) {
          throw new Error(
            "Địa chỉ này chưa có mã giao hàng GHN. Vui lòng cập nhật lại địa chỉ.",
          );
        }

        const fee = await vnAddressApi.calculateShippingFee({
          toDistrictId,
          toWardCode,
        });

        if (!active) return;
        setShippingFee(fee);
        setShippingFeeSource("ghn");
        setShippingFeeError(false);
        toast.success(`Phí vận chuyển tính từ GHN: ${formatCurrency(fee)}`);
      } catch (err: unknown) {
        console.error("Lỗi tính phí ship GHN:", err);
        if (active) {
          setShippingFee(FALLBACK_SHIPPING_FEE);
          setShippingFeeSource("default");
          setShippingFeeError(true);
        }
      } finally {
        if (active) {
          setCalculatingShip(false);
        }
      }
    };

    fetchGhnFee();

    return () => {
      active = false;
    };
  }, [selectedAddr]);

  useEffect(() => {
    if (!couponsLoaded || !coupon) return;
    const latest = coupons.find((item) => item.couponId === coupon.couponId);
    if (!latest || !latest.valid || latest.remainingUsesForCurrentUser === 0) {
      setCoupon(null);
      setCouponCode("");
      toast.error(
        latest?.maxUsesPerUser
          ? `Bạn đã sử dụng đủ ${latest.usedByCurrentUser ?? latest.maxUsesPerUser}/${latest.maxUsesPerUser} lượt cho mã ${latest.code}`
          : "Mã giảm giá đã hết hiệu lực",
      );
    }
  }, [coupon, coupons, couponsLoaded]);

  const { mutate: applyCoupon, isPending: validating } = useMutation({
    mutationFn: async (codeOverride?: string) => {
      const generation = couponValidationGenerationRef.current;
      const data = await couponApi.validate({
        code: (typeof codeOverride === "string"
          ? codeOverride
          : couponCode
        ).trim(),
        orderAmount: subtotal,
      });
      return { data, generation };
    },
    onSuccess: ({ data, generation }) => {
      if (generation !== couponValidationGenerationRef.current) return;
      if (data.valid) {
        setCoupon(data);
        setCouponCode(data.code);
        toast.success("Áp dụng mã giảm giá thành công");
      } else {
        setCoupon(null);
        toast.error("Mã giảm giá không hợp lệ");
      }
    },
    onError: (err: { apiMessage?: string }) => {
      setCoupon(null);
      toast.error(err.apiMessage ?? "Mã giảm giá không hợp lệ");
    },
  });

  const bestCoupon = useMemo(() => {
    if (!coupons.length) return null;
    let best: CouponResponse | null = null;
    let maxDisc = 0;
    for (const c of coupons) {
      if (!c.valid || c.remainingUsesForCurrentUser === 0) continue;
      if (c.minOrderValue && subtotal < c.minOrderValue) continue;
      const disc = couponDiscount(c, subtotal);
      if (disc > maxDisc) {
        maxDisc = disc;
        best = c;
      }
    }
    return best;
  }, [coupons, subtotal]);

  const handleReloadBestCoupon = async () => {
    const result = await refetchCoupons();
    const freshCoupons = result.data ?? [];
    const nextBest = freshCoupons
      .filter(
        (candidate) =>
          candidate.valid &&
          candidate.remainingUsesForCurrentUser !== 0 &&
          (!candidate.minOrderValue || subtotal >= candidate.minOrderValue),
      )
      .reduce<CouponResponse | null>((best, candidate) => {
        if (!best) return candidate;
        return couponDiscount(candidate, subtotal) >
          couponDiscount(best, subtotal)
          ? candidate
          : best;
      }, null);

    if (!nextBest || couponDiscount(nextBest, subtotal) <= 0) {
      toast.info("Hiện chưa có mã giảm giá phù hợp hơn");
      return;
    }
    autoCouponKeyRef.current = `${nextBest.couponId}:${subtotal}`;
    setCoupon(nextBest);
    setCouponCode(nextBest.code);
    toast.success(`Đã áp mã tốt nhất: ${nextBest.code}`);
  };

  useEffect(() => {
    if (suspendAutoCoupon || refreshingCoupons || !bestCoupon || coupon) return;
    const autoKey = `${bestCoupon.couponId}:${subtotal}`;
    if (autoCouponKeyRef.current === autoKey) return;
    autoCouponKeyRef.current = autoKey;
    setCoupon(bestCoupon);
    setCouponCode(bestCoupon.code);
  }, [bestCoupon, coupon, subtotal, suspendAutoCoupon, refreshingCoupons]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const eligible =
        c.valid &&
        c.remainingUsesForCurrentUser !== 0 &&
        (c.minOrderValue ? subtotal >= c.minOrderValue : true);
      if (filterTab === "eligible") return eligible;
      if (filterTab === "ineligible") return !eligible;
      return true;
    });
  }, [coupons, filterTab, subtotal]);

  const handleCreateAddress = (payload: AddressRequest) => {
    if (!isAuthenticated) {
      setGuestAddress({
        addressId: -1,
        consigneeName: payload.consigneeName,
        phone: payload.phone,
        province: payload.province,
        district: payload.district,
        ward: payload.ward,
        ghnProvinceId: payload.ghnProvinceId,
        ghnDistrictId: payload.ghnDistrictId,
        ghnWardCode: payload.ghnWardCode,
        streetAddress: payload.streetAddress,
        isDefault: false,
        provinceName: payload.provinceName,
        districtName: payload.districtName,
        wardName: payload.wardName,
      });
      setAddressModalOpen(false);
      toast.success("Đã lưu thông tin nhận hàng cho đơn này");
      return;
    }

    createAddress(payload, {
      onSuccess: (newAddr) => {
        setAddressModalOpen(false);
        setSelectedAddrId(newAddr.addressId);
        toast.success("Đã thêm và chọn địa chỉ giao hàng mới");
      },
    });
  };

  const couponBaseAmount = subtotal;
  const discount = coupon ? couponDiscount(coupon, couponBaseAmount) : 0;
  const total = Math.max(0, subtotal - discount + shippingFee);
  const changedPriceByVariant = new Map(
    priceChanges.map((change) => [change.variantId, change.currentPrice]),
  );
  const refreshedSubtotal = items.reduce(
    (sum, item) =>
      sum +
      (changedPriceByVariant.get(item.variantId) ?? item.price) * item.quantity,
    0,
  );
  const refreshedTotalBeforeCoupon = refreshedSubtotal + shippingFee;

  const handleUseDefaultShippingFee = () => {
    setShippingFee(FALLBACK_SHIPPING_FEE);
    setShippingFeeSource("default");
    toast.success(
      `Đã áp dụng phí vận chuyển mặc định ${formatCurrency(FALLBACK_SHIPPING_FEE)}`,
    );
  };

  const handlePlaceOrder = () => {
    const normalizedGuestName = guestName.trim();
    const normalizedGuestEmail = guestEmail.trim().toLowerCase();
    const normalizedGuestPhone = guestPhone.trim().replace(/[\s.-]/g, "");

    if (!isAuthenticated) {
      if (normalizedGuestName.length < 2) {
        toast.error("Vui lòng nhập tên người đặt (tối thiểu 2 ký tự)");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedGuestEmail)) {
        toast.error("Email người đặt không đúng định dạng");
        return;
      }
      if (!/^(0|\+84)[0-9]{9,10}$/.test(normalizedGuestPhone)) {
        toast.error("Số điện thoại người đặt không đúng định dạng");
        return;
      }
    }

    if (!selectedAddr) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    if (!items.length) {
      toast.error("Vui lòng chọn sản phẩm từ giỏ hàng trước khi thanh toán");
      return;
    }
    if (calculatingShip) {
      toast.error("Vui lòng chờ hệ thống tính phí vận chuyển");
      return;
    }

    const payload: CreateOrderRequest = {
      orderType: "ONLINE",
      paymentMethod: method,
      isGuest: !isAuthenticated,
      guestName: !isAuthenticated ? normalizedGuestName : undefined,
      guestEmail: !isAuthenticated ? normalizedGuestEmail : undefined,
      guestPhone: !isAuthenticated ? normalizedGuestPhone : undefined,
      coupon: {
        couponId: coupon?.couponId ?? null,
        discountAmount: discount,
      },
      note: note || undefined,
      items: items.map((it) => ({
        variantId: it.variantId,
        quantity: it.quantity,
        price: it.price,
      })),
      orderAddressRequest: {
        receiverName: selectedAddr.consigneeName,
        receiverPhone: selectedAddr.phone,
        province: selectedAddr.province,
        district: selectedAddr.district,
        ward: selectedAddr.ward,
        detailAddress: selectedAddr.streetAddress,
        note: note || undefined,
      },
      shippingFee: shippingFee,
    };

    createOrder(payload, {
      onSuccess: async (order) => {
        if (!isAuthenticated) {
          removeGuestItems(items.map((item) => item.variantId));
          clearCheckout();
          if (method === "VNPAY") {
            const guestAccess = {
              orderId: order.orderId,
              orderCode: order.orderCode,
              phone: order.guestPhone || normalizedGuestPhone,
            };
            saveGuestPaymentAccess(guestAccess);
            try {
              const init = await paymentApi.initGuest(guestAccess);
              navigate(`/payment/vnpay/${order.orderId}`, {
                state: {
                  paymentUrl: init.paymentUrl,
                  expireAt: init.expireAt,
                  orderCode: order.orderCode,
                  guestPhone: guestAccess.phone,
                },
              });
              return;
            } catch (error) {
              setGuestOrder(order);
              toast.error(
                (error as { apiMessage?: string }).apiMessage ??
                  "Đơn hàng đã được tạo nhưng chưa thể khởi tạo VNPay. Bạn có thể thanh toán lại từ trang tra cứu đơn hàng.",
              );
              return;
            }
          }
          setGuestOrder(order);
          toast.success("Đặt hàng thành công");
          return;
        }

        clearCheckout();
        if (method === "VNPAY") {
          try {
            const init = await paymentApi.init(order.orderId);
            if (init.paymentUrl) {
              navigate(`/payment/vnpay/${order.orderId}`, {
                state: {
                  paymentUrl: init.paymentUrl,
                  expireAt: init.expireAt,
                  orderCode: order.orderCode,
                },
              });
              return;
            }
          } catch {
            toast.error("Không thể khởi tạo thanh toán VNPay");
          }
        }
        toast.success("Đặt hàng thành công, đơn đang chờ xác nhận");
        navigate(`/orders/${order.orderId}`);
      },
      onError: (error: { apiMessage?: string; apiDetails?: unknown }) => {
        if (Array.isArray(error.apiDetails) && error.apiDetails.length > 0) {
          setPriceChanges(error.apiDetails as PriceChange[]);
          setPriceDialogOpen(true);
        } else if (error.apiMessage?.match("Mã giảm giá")) {
          setCouponDialogOpen(true);
        }
      },
    });
  };

  const refreshCheckoutWithNewPrices = async () => {
    setRefreshingCheckout(true);
    setSuspendAutoCoupon(true);
    couponValidationGenerationRef.current += 1;
    updateCheckoutPrices(
      priceChanges.map((change) => ({
        variantId: change.variantId,
        price: change.currentPrice,
        originalPrice: change.originalPrice,
      })),
    );
    setCoupon(null);
    setCouponCode("");
    autoCouponKeyRef.current = "";
    setPriceDialogOpen(false);
    try {
      await refetchCoupons();
      setPriceChanges([]);
      toast.info("Đã cập nhật giá và tải lại các mã giảm giá phù hợp.");
    } finally {
      setRefreshingCheckout(false);
      setSuspendAutoCoupon(false);
    }
  };

  const refreshCheckoutWithNewCoupon = async () => {
    setRefreshingCheckout(true);
    setSuspendAutoCoupon(true);
    couponValidationGenerationRef.current += 1;
    setCoupon(null);
    setCouponCode("");
    autoCouponKeyRef.current = "";
    setPriceDialogOpen(false);
    try {
      await refetchCoupons();
      toast.info("Đã cập nhật giá.");
    } finally {
      setRefreshingCheckout(false);
      setSuspendAutoCoupon(false);
    }
  };

  if (guestOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card className="overflow-hidden rounded-3xl border-emerald-200 text-center shadow-lg">
          <CardContent className="space-y-5 p-8 sm:p-12">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <PackageCheck className="size-8" />
            </div>
            <div>
              <h1 className="text-2xl font-medium text-slate-900">
                Đặt hàng thành công
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thông tin xác nhận đã được gửi đến {guestOrder.guestEmail}.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-left text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <strong className="text-blue-700">
                  {guestOrder.orderCode}
                </strong>
              </div>
              <div className="mt-3 flex justify-between gap-4">
                <span className="text-muted-foreground">Người đặt</span>
                <strong>{guestOrder.guestName}</strong>
              </div>
              <div className="mt-3 flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Điện thoại người đặt
                </span>
                <strong>{guestOrder.guestPhone}</strong>
              </div>
              <div className="mt-3 flex justify-between gap-4">
                <span className="text-muted-foreground">Người nhận</span>
                <strong>{guestOrder.receiverName}</strong>
              </div>
              <div className="mt-3 flex justify-between gap-4">
                <span className="text-muted-foreground">Số điện thoại</span>
                <strong>{guestOrder.receiverPhone}</strong>
              </div>
              <div className="mt-3 flex justify-between gap-4 border-t pt-3">
                <span className="text-muted-foreground">Tổng thanh toán</span>
                <strong className="text-orange-600">
                  {formatCurrency(guestOrder.finalAmount)}
                </strong>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Hãy lưu lại mã đơn hàng để đối chiếu khi cần hỗ trợ.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" asChild>
                <Link
                  to="/tra-cuu-don-hang"
                  state={{
                    orderCode: guestOrder.orderCode,
                    phone: guestOrder.guestPhone,
                  }}
                >
                  Tra cứu đơn hàng
                </Link>
              </Button>
              <Button asChild>
                <Link to="/products">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">
          Bạn chưa chọn sản phẩm nào để thanh toán.
        </p>
        <Button asChild className="mt-4">
          <Link to="/cart">Quay lại giỏ hàng</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <section className="mb-5 overflow-hidden rounded-[28px] bg-slate-950 px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-orange-300">
              <ShieldCheck className="size-4" /> Thanh toán an toàn
            </p>
            <h1 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
              Hoàn tất đơn hàng
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Kiểm tra sản phẩm, địa chỉ và ưu đãi trước khi đặt hàng.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
            <Sparkles className="size-4 text-orange-300" />
            Tự động chọn ưu đãi tốt nhất
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">
                Sản phẩm thanh toán ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {items.map((item) => {
                const img = resolveImageUrl(item.imageUrl);
                const hasItemDiscount = item.originalPrice
                  ? item.originalPrice > item.price
                  : false;
                return (
                  <div key={item.cartItemId} className="flex gap-3 p-4 text-sm">
                    <div className="size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      {img ? (
                        <img
                          src={img}
                          alt={item.productName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium text-foreground">
                        {item.productName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[item.color, item.size].filter(Boolean).join(" • ")}
                      </p>
                      <div className="mt-1 text-xs text-muted-foreground flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-medium text-foreground">
                          {formatCurrency(item.price)}
                        </span>
                        {hasItemDiscount && item.originalPrice && (
                          <span className="line-through text-[10px]">
                            {formatCurrency(item.originalPrice)}
                          </span>
                        )}
                        <span>x {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-semibold block text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      {hasItemDiscount && item.originalPrice && (
                        <span className="line-through text-xs text-muted-foreground block">
                          {formatCurrency(item.originalPrice * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {}
          {!isAuthenticated && (
            <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60 py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserRound className="size-4 text-primary" /> Thông tin người
                  đặt
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="guest-name" className="text-sm font-medium">
                    Họ và tên người đặt <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="guest-name"
                    autoComplete="name"
                    maxLength={100}
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="guest-email" className="text-sm font-medium">
                    Email nhận thông tin đơn{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="guest-email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                    placeholder="ban@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="guest-phone" className="text-sm font-medium">
                    Số điện thoại người đặt{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="guest-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={15}
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    placeholder="0912345678"
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Cửa hàng dùng thông tin này để gửi xác nhận và cập nhật trạng
                  thái đơn. Người đặt có thể khác người nhận hàng bên dưới.
                </p>
              </CardContent>
            </Card>
          )}

          {}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/60 py-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" /> Địa chỉ giao hàng
              </CardTitle>
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddressModalOpen(true)}
                    className="cursor-pointer h-8 text-xs"
                  >
                    <Plus className="mr-1 size-3.5" /> Thêm địa chỉ
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/addresses">Quản lý</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddressModalOpen(true)}
                  className="cursor-pointer h-8 text-xs"
                >
                  {guestAddress ? "Chỉnh sửa" : "Nhập thông tin"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {!isAuthenticated ? (
                guestAddress ? (
                  <div className="rounded-lg border border-primary bg-primary/5 p-3 text-sm">
                    <p className="font-semibold text-foreground">
                      {guestAddress.consigneeName} • {guestAddress.phone}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {[
                        guestAddress.streetAddress,
                        guestAddress.wardName || guestAddress.ward,
                        guestAddress.provinceName || guestAddress.province,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-muted/10 py-6 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Nhập tên, số điện thoại và địa chỉ nhận hàng để đặt hàng
                      không cần đăng nhập.
                    </p>
                    <Button size="sm" onClick={() => setAddressModalOpen(true)}>
                      Nhập thông tin nhận hàng
                    </Button>
                  </div>
                )
              ) : !addresses?.length ? (
                <div className="text-center py-6 border border-dashed rounded-lg bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-3">
                    Bạn chưa có địa chỉ giao hàng.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setAddressModalOpen(true)}
                    className="cursor-pointer"
                  >
                    Thêm địa chỉ mới
                  </Button>
                </div>
              ) : (
                addresses.map((addr) => (
                  <label
                    key={addr.addressId}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-all",
                      addressId === addr.addressId
                        ? "border-primary bg-primary/5 font-medium"
                        : "hover:bg-accent/30 border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-primary"
                      checked={addressId === addr.addressId}
                      onChange={() => setSelectedAddrId(addr.addressId)}
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {addr.consigneeName} • {addr.phone}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {[
                          addr.streetAddress,
                          addr.wardName || addr.ward,
                          addr.provinceName || addr.province,
                        ]
                          .map((s) => s?.trim())
                          .filter((s): s is string =>
                            Boolean(
                              s &&
                              s !== "-" &&
                              s !== "null" &&
                              s !== "undefined",
                            ),
                          )
                          .join(", ")}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </CardContent>
          </Card>

          {}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4" /> Phương thức thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {METHODS.map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm",
                    method === m
                      ? "border-primary bg-accent/50"
                      : "hover:bg-accent/30",
                  )}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={method === m}
                    onChange={() => setMethod(m)}
                  />
                  {PAYMENT_METHOD_LABEL[m]}
                  {m === "VNPAY" && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      Thanh toán trong 10 phút
                    </span>
                  )}
                </label>
              ))}
              {!isAuthenticated && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  Khách vãng lai có thể thanh toán khi nhận hàng hoặc thanh toán
                  online qua VNPay.
                </p>
              )}
            </CardContent>
          </Card>

          {}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">Ghi chú</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho đơn hàng (tuỳ chọn)…"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-lg">
            <CardHeader className="border-b ">
              <CardTitle className="flex items-center justify-between text-base">
                <Label className="text-lg font-semibold">
                  Đơn hàng ({items.length})
                </Label>
                <Badge className={"text-xs"}>Tóm tắt</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {}
              <div className="space-y-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50 p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
                      <TicketPercent className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        Ưu đãi của bạn
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Hệ thống tự chọn mã tiết kiệm nhất
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={refreshingCoupons || validating}
                    onClick={handleReloadBestCoupon}
                    className="size-9 rounded-xl border-orange-200 bg-white text-orange-700 hover:bg-orange-100"
                    aria-label="Tải lại và chọn mã giảm giá tốt nhất"
                    title="Kiểm tra lại mã tốt nhất"
                  >
                    <RotateCw
                      className={cn(
                        "size-4",
                        (refreshingCoupons || validating) && "animate-spin",
                      )}
                    />
                  </Button>
                </div>

                {coupon && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-3 text-xs text-emerald-800 shadow-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{coupon.code}</p>
                        <p className="mt-0.5 text-[10px] text-emerald-700">
                          Đã áp dụng tự động
                        </p>
                      </div>
                    </div>
                    <strong className="shrink-0 text-emerald-700">
                      -
                      {formatCurrency(couponDiscount(coupon, couponBaseAmount))}
                    </strong>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã khác"
                      className="h-9 rounded-xl border-orange-200 bg-white pl-8 text-xs uppercase"
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={!couponCode.trim() || validating}
                    onClick={() => applyCoupon(undefined)}
                    className="h-9 rounded-xl border-orange-200 bg-white px-3 text-xs font-bold"
                  >
                    {validating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Áp dụng"
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    variant="link"
                    size="xs"
                    className="flex h-auto cursor-pointer items-center gap-1 p-0 text-[11px] font-bold text-orange-700"
                    onClick={() => setCouponPopupOpen(true)}
                  >
                    <Tag className="size-3" /> Chọn mã khác
                  </Button>
                  <span className="text-[10px] text-slate-500">
                    {coupons.length} mã khả dụng
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <div className="flex gap-1.5 items-baseline">
                    {originalSubtotal > subtotal && (
                      <span className="line-through text-xs text-muted-foreground">
                        {formatCurrency(originalSubtotal)}
                      </span>
                    )}
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Phiếu giảm giá</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-3.5" />
                      Phí vận chuyển{" "}
                      {shippingFeeSource === "ghn" ? "(GHN)" : "(mặc định)"}
                    </span>
                  </span>
                  <span>
                    {calculatingShip
                      ? "Đang tính..."
                      : formatCurrency(shippingFee)}
                  </span>
                </div>
                {shippingFeeError && !calculatingShip && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Không lấy được phí từ GHN. Bạn có thể sử dụng phí vận chuyển
                    mặc định.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full border-amber-300 bg-white text-xs font-bold text-amber-800 hover:bg-amber-100"
                  onClick={handleUseDefaultShippingFee}
                >
                  Dùng phí {formatCurrency(FALLBACK_SHIPPING_FEE)}
                </Button>
                <Separator />
                <div className="flex justify-between text-base font-medium">
                  <span>Tổng cộng</span>
                  <span className="text-lg text-orange-600">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <Button
                className="h-12 w-full rounded-xl bg-orange-600 font-medium text-white hover:bg-orange-700"
                size="lg"
                disabled={
                  placing || calculatingShip || validating || refreshingCheckout
                }
                onClick={handlePlaceOrder}
              >
                {placing && <Loader2 className="mr-2 size-4 animate-spin" />}
                {calculatingShip ? "Đang tính phí ship..." : "Đặt hàng"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {}
      <AddressModal
        open={addressModalOpen}
        initial={!isAuthenticated ? (guestAddress ?? null) : null}
        onClose={() => setAddressModalOpen(false)}
        onSubmit={handleCreateAddress}
        isPending={creatingAddress}
        guestMode={!isAuthenticated}
      />

      <AlertDialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Giá sản phẩm đã thay đổi</AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống chưa tạo đơn hàng. Vui lòng kiểm tra giá mới trước khi
              tiếp tục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {priceChanges.map((change) => (
              <div
                key={change.variantId}
                className="rounded-lg border p-3 text-sm"
              >
                <p className="font-semibold">{change.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {[change.color, change.size].filter(Boolean).join(" • ")}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground line-through">
                    {formatCurrency(change.checkoutPrice ?? 0)}
                  </span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(change.currentPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính hiện tại</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Mã giảm giá hiện tại</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Tổng thanh toán hiện tại</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between font-medium text-orange-700">
              <span>Tổng mới tạm tính*</span>
              <span>{formatCurrency(refreshedTotalBeforeCoupon)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              *Chưa áp lại mã giảm giá. Sau khi cập nhật, hệ thống sẽ tải lại ưu
              đãi và tính lại tổng thanh toán.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Không đặt hàng</AlertDialogCancel>
            <AlertDialogAction
              disabled={refreshingCheckout}
              onClick={refreshCheckoutWithNewPrices}
            >
              {refreshingCheckout
                ? "Đang tải lại..."
                : "Cập nhật và tải lại ưu đãi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mã giảm giá đã thay đổi</AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống chưa tạo đơn hàng. Vui lòng kiểm tra giá mới trước khi
              tiếp tục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {priceChanges.map((change) => (
              <div
                key={change.variantId}
                className="rounded-lg border p-3 text-sm"
              >
                <p className="font-semibold">{change.productName}</p>
                <p className="text-xs text-muted-foreground">
                  {[change.color, change.size].filter(Boolean).join(" • ")}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-muted-foreground line-through">
                    {formatCurrency(change.checkoutPrice ?? 0)}
                  </span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(change.currentPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính hiện tại</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Mã giảm giá hiện tại</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Tổng thanh toán hiện tại</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Không đặt hàng</AlertDialogCancel>
            <AlertDialogAction
              disabled={refreshingCheckout}
              onClick={refreshCheckoutWithNewCoupon}
            >
              {refreshingCheckout
                ? "Đang tải lại..."
                : "Cập nhật và tải lại ưu đãi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={couponPopupOpen} onOpenChange={setCouponPopupOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Tag className="size-5 text-primary" /> Chọn mã giảm giá
            </DialogTitle>
          </DialogHeader>

          {}
          <div className="flex gap-1.5 border-b py-2 mb-3">
            {(["all", "eligible", "ineligible"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  "flex-1 py-1 px-2 rounded-md text-xs font-semibold text-center transition-all cursor-pointer",
                  filterTab === tab
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                {tab === "all"
                  ? "Tất cả"
                  : tab === "eligible"
                    ? "Khả dụng"
                    : "Chưa đủ ĐK"}
              </button>
            ))}
          </div>

          {}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
            {!filteredCoupons.length ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                Không tìm thấy mã giảm giá nào.
              </p>
            ) : (
              filteredCoupons.map((c) => {
                const usageExhausted =
                  !c.valid || c.remainingUsesForCurrentUser === 0;
                const eligible =
                  !usageExhausted &&
                  (c.minOrderValue ? subtotal >= c.minOrderValue : true);
                const applied = coupon?.couponId === c.couponId;
                const savingForOrder = eligible
                  ? couponDiscount(c, subtotal)
                  : 0;

                return (
                  <div
                    key={c.couponId}
                    className={cn(
                      "rounded-xl border p-3 flex flex-col gap-2 relative transition-all",
                      applied
                        ? "border-primary bg-primary/5"
                        : eligible
                          ? "border-border hover:border-primary/50 hover:bg-accent/10"
                          : "border-border opacity-70 bg-muted/20",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm tracking-wide text-foreground px-2 py-0.5 bg-primary/10 rounded-xs border border-primary/20">
                            {c.code}
                          </span>
                          {c.couponType === "PERSONAL" && (
                            <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full font-semibold">
                              Cá nhân
                            </span>
                          )}
                          <span className="text-[10px] text-primary font-semibold">
                            {c.discountType === "PERCENTAGE"
                              ? `Giảm ${c.discountValue}%`
                              : `Giảm ${formatCurrency(c.discountValue)}`}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground mt-1.5 leading-snug">
                          {c.description || `Giảm giá trực tiếp cho đơn hàng.`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={applied ? "secondary" : "default"}
                        disabled={!eligible || validating}
                        onClick={() => {
                          applyCoupon(c.code);
                          setCouponPopupOpen(false);
                        }}
                        className="shrink-0 h-7 text-xs px-3 font-semibold cursor-pointer animate-duration-150"
                      >
                        {usageExhausted
                          ? "Hết lượt"
                          : applied
                            ? "Đang chọn"
                            : "Áp dụng"}
                      </Button>
                    </div>

                    {}
                    <div className="mt-1 flex flex-col gap-2 border-t pt-2 text-[11px] text-muted-foreground">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        <span>Loại mã</span>
                        <strong className="text-right text-foreground">
                          {c.couponType === "PERSONAL"
                            ? "Cá nhân"
                            : "Công khai"}
                        </strong>
                        <span>Giá trị giảm</span>
                        <strong className="text-right text-foreground">
                          {c.discountType === "PERCENTAGE"
                            ? `${c.discountValue}%`
                            : formatCurrency(c.discountValue)}
                        </strong>
                        <span>Đơn tối thiểu</span>
                        <strong className="text-right text-foreground">
                          {c.minOrderValue
                            ? formatCurrency(c.minOrderValue)
                            : "Không giới hạn"}
                        </strong>
                        <span>Giảm tối đa</span>
                        <strong className="text-right text-foreground">
                          {c.maxDiscountAmount
                            ? formatCurrency(c.maxDiscountAmount)
                            : "Không giới hạn"}
                        </strong>
                        <span>Tiết kiệm cho đơn này</span>
                        <strong
                          className={cn(
                            "text-right",
                            eligible
                              ? "text-emerald-700"
                              : "text-muted-foreground",
                          )}
                        >
                          {eligible
                            ? formatCurrency(savingForOrder)
                            : "Chưa đủ điều kiện"}
                        </strong>
                        <span>Số lượng còn lại</span>
                        <strong className="text-right text-foreground">
                          {c.remainingQuantity != null
                            ? `${c.remainingQuantity}${c.totalQuantity != null ? `/${c.totalQuantity}` : ""}`
                            : "Không giới hạn"}
                        </strong>
                        <span>Lượt dùng mỗi khách</span>
                        <strong className="text-right text-foreground">
                          {c.maxUsesPerUser != null
                            ? `${c.usedByCurrentUser ?? 0}/${c.maxUsesPerUser}`
                            : "Không giới hạn"}
                        </strong>
                        <span>Bắt đầu</span>
                        <strong className="text-right text-foreground">
                          {c.startDate
                            ? new Date(c.startDate).toLocaleString("vi-VN")
                            : "Áp dụng ngay"}
                        </strong>
                        <span>Hết hạn</span>
                        <strong className="text-right text-destructive">
                          {c.endDate
                            ? new Date(c.endDate).toLocaleString("vi-VN")
                            : "Không giới hạn"}
                        </strong>
                      </div>

                      {usageExhausted ? (
                        <p className="rounded-md bg-destructive/10 px-2 py-1.5 font-semibold text-destructive">
                          Bạn đã sử dụng đủ{" "}
                          {c.usedByCurrentUser ?? c.maxUsesPerUser}/
                          {c.maxUsesPerUser} lượt cho mã này.
                        </p>
                      ) : !eligible && c.minOrderValue ? (
                        <div className="space-y-1">
                          <div className="flex justify-between font-medium text-primary">
                            <span>Tiến trình đạt điều kiện</span>
                            <span>
                              {Math.round((subtotal / c.minOrderValue) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{
                                width: `${Math.min(100, (subtotal / c.minOrderValue) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-destructive font-semibold">
                            Mua thêm{" "}
                            <span className="underline">
                              {formatCurrency(c.minOrderValue - subtotal)}
                            </span>{" "}
                            để sử dụng mã này
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
