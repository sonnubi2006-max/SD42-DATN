import type { CouponResponse } from "@/api/couponApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCouponList } from "@/hooks/useCoupon";
import {
  BadgeCheck,
  Check,
  CircleAlert,
  LockKeyhole,
  Search,
  Tag,
  TicketPercent,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { money } from "./posUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickCoupon: (coupon: CouponResponse) => void;
  customerId: number | null;
  subtotal: number;
  selectedCouponId?: number | null;
}

type FilterTab = "all" | "eligible" | "ineligible";

const FILTER_LABELS: Record<FilterTab, string> = {
  all: "Tất cả",
  eligible: "Khả dụng",
  ineligible: "Chưa đủ điều kiện",
};

export default function CouponPopup({
  open,
  onOpenChange,
  onPickCoupon,
  customerId,
  subtotal,
  selectedCouponId,
}: Props) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const debouncedSearch = useDebounce(search.trim(), 400);

  const {
    data: couponPage,
    isLoading,
    isFetching,
  } = useCouponList({
    status: "ACTIVE",
    type: debouncedSearch || customerId ? undefined : "PUBLIC",
    keyword: debouncedSearch || undefined,
    customerId: customerId ?? undefined,
    size: 100,
  });

  const checkCouponStatus = (coupon: CouponResponse) => {
    const isPersonal = coupon.couponType === "PERSONAL";
    const isEligibleCustomer =
      !isPersonal ||
      (!!customerId &&
        coupon.targetedCustomers?.some(
          (target) => target.customerId === customerId,
        ));
    const isMinOrderSatisfied = subtotal >= (coupon.minOrderValue ?? 0);
    const hasRemainingUses =
      coupon.valid && coupon.remainingUsesForCurrentUser !== 0;

    return {
      isPersonal,
      isEligibleCustomer,
      isMinOrderSatisfied,
      hasRemainingUses,
      isAvailable:
        isEligibleCustomer && isMinOrderSatisfied && hasRemainingUses,
    };
  };

  const availableCoupons = useMemo(() => {
    const query = debouncedSearch.toLowerCase();

    return (couponPage?.content ?? []).filter((coupon) => {
      const status = checkCouponStatus(coupon);
      if (status.isPersonal && !status.isEligibleCustomer) return false;

      if (
        query &&
        !coupon.code.toLowerCase().includes(query) &&
        !String(coupon.couponId).includes(query) &&
        !coupon.description?.toLowerCase().includes(query)
      ) {
        return false;
      }

      return true;
    });
  }, [couponPage, debouncedSearch, customerId, subtotal]);

  const counts = useMemo(
    () => ({
      all: availableCoupons.length,
      eligible: availableCoupons.filter(
        (coupon) => checkCouponStatus(coupon).isAvailable,
      ).length,
      ineligible: availableCoupons.filter(
        (coupon) => !checkCouponStatus(coupon).isAvailable,
      ).length,
    }),
    [availableCoupons, customerId, subtotal],
  );

  const filteredCoupons = useMemo(() => {
    if (filterTab === "eligible") {
      return availableCoupons.filter(
        (coupon) => checkCouponStatus(coupon).isAvailable,
      );
    }
    if (filterTab === "ineligible") {
      return availableCoupons.filter(
        (coupon) => !checkCouponStatus(coupon).isAvailable,
      );
    }
    return availableCoupons;
  }, [availableCoupons, filterTab, customerId, subtotal]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSearch("");
      setFilterTab("all");
    }
  };

  const handlePick = (coupon: CouponResponse) => {
    onPickCoupon(coupon);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-border bg-background p-0 shadow-2xl sm:max-w-[760px] sm:rounded-2xl">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-5 py-4 sm:px-6">
          <DialogTitle className="flex items-center gap-3 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <TicketPercent className="size-5" />
            </span>
            <span>
              <span className="block text-base font-bold text-foreground">
                Chọn phiếu giảm giá
              </span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                Hệ thống chỉ hiển thị các mã còn hiệu lực cho đơn hàng
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-3 border-b px-5 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border bg-muted/20 px-3.5 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Giá trị đơn
                </p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                  {money(subtotal)}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-3.5 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/70">
                  Có thể áp dụng
                </p>
                <p className="mt-0.5 text-sm font-bold text-emerald-700">
                  {counts.eligible} phiếu giảm giá
                </p>
              </div>
            </div>

            {!customerId && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <UserRound className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Đơn đang là khách lẻ. Chọn khách hàng để xem thêm phiếu giảm
                  giá cá nhân.
                </span>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo mã hoặc mô tả phiếu giảm giá..."
                className="h-11 rounded-xl bg-muted/30 pl-10 pr-10 text-sm focus-visible:ring-emerald-500/20"
              />
              {isFetching && !isLoading && (
                <span className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
              {(["all", "eligible", "ineligible"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all ${
                    filterTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{FILTER_LABELS[tab]}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${
                      filterTab === tab
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-background/70"
                    }`}
                  >
                    {counts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[300px] flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            {isLoading ? (
              <div className="space-y-3" aria-label="Đang tải phiếu giảm giá">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex h-32 animate-pulse overflow-hidden rounded-xl border"
                  >
                    <div className="w-28 bg-muted" />
                    <div className="flex-1 space-y-3 p-4">
                      <div className="h-4 w-2/5 rounded bg-muted" />
                      <div className="h-3 w-4/5 rounded bg-muted" />
                      <div className="h-3 w-3/5 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCoupons.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
                <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                  <Tag className="size-6 text-muted-foreground" />
                </span>
                <p className="text-sm font-semibold text-foreground">
                  Không có phiếu giảm giá phù hợp
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Thử đổi từ khóa hoặc chọn nhóm điều kiện khác.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCoupons.map((coupon) => {
                  const {
                    isPersonal,
                    isMinOrderSatisfied,
                    hasRemainingUses,
                    isAvailable,
                  } = checkCouponStatus(coupon);
                  const isSelected = coupon.couponId === selectedCouponId;
                  const minOrderValue = coupon.minOrderValue ?? 0;
                  const missingAmount = Math.max(0, minOrderValue - subtotal);
                  const progress =
                    minOrderValue > 0
                      ? Math.min(100, (subtotal / minOrderValue) * 100)
                      : 100;
                  const discountLabel =
                    coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : money(coupon.discountValue);

                  return (
                    <article
                      key={coupon.couponId}
                      className={`relative flex overflow-hidden rounded-xl border transition-all ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-200"
                          : isAvailable
                            ? "border-border bg-background hover:border-emerald-300 hover:shadow-sm"
                            : "border-border bg-muted/20"
                      }`}
                    >
                      <div
                        className={`flex w-24 shrink-0 flex-col items-center justify-center border-r border-dashed px-2 py-4 text-center sm:w-28 ${
                          isAvailable
                            ? "border-emerald-300 bg-emerald-600 text-white"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
                          Giảm
                        </span>
                        <span className="mt-1 max-w-full break-words text-xl font-medium leading-tight sm:text-2xl">
                          {discountLabel}
                        </span>
                        {isPersonal && (
                          <span className="mt-2 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold">
                            Cá nhân
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 p-3.5 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                                {coupon.code}
                              </h3>
                              {isSelected && (
                                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                                  <Check className="size-2.5" />
                                  Đang áp dụng
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Đơn từ{" "}
                              <strong className="font-semibold text-foreground">
                                {money(minOrderValue)}
                              </strong>
                              {" · "}Tối đa{" "}
                              <strong className="font-semibold text-foreground">
                                {coupon.maxDiscountAmount
                                  ? money(coupon.maxDiscountAmount)
                                  : "không giới hạn"}
                              </strong>
                            </p>
                            {coupon.description && (
                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {coupon.description}
                              </p>
                            )}
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            disabled={!isAvailable || isSelected}
                            onClick={() => handlePick(coupon)}
                            className={`h-8 shrink-0 rounded-lg px-3 text-xs ${
                              isAvailable && !isSelected
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : ""
                            }`}
                          >
                            {!hasRemainingUses
                              ? "Hết lượt"
                              : isSelected
                                ? "Đã chọn"
                                : "Áp dụng"}
                          </Button>
                        </div>

                        {!hasRemainingUses ? (
                          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
                            <CircleAlert className="size-3.5" />
                            Khách hàng đã dùng đủ{" "}
                            {coupon.usedByCurrentUser ?? coupon.maxUsesPerUser}/
                            {coupon.maxUsesPerUser} lượt
                          </p>
                        ) : !isMinOrderSatisfied ? (
                          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
                            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-amber-800">
                              <span className="flex items-center gap-1">
                                <LockKeyhole className="size-3" />
                                Cần mua thêm {money(missingAmount)}
                              </span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-amber-100">
                              <div
                                className="h-full rounded-full bg-amber-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                            <BadgeCheck className="size-3.5" />
                            Đủ điều kiện áp dụng cho đơn hàng
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3.5 sm:px-6">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {counts.eligible > 0 ? (
                <>
                  <BadgeCheck className="size-3.5 text-emerald-600" />
                  <span>
                    <strong className="font-semibold text-foreground">
                      {counts.eligible}
                    </strong>{" "}
                    phiếu giảm giá khả dụng
                  </span>
                </>
              ) : (
                <>
                  <CircleAlert className="size-3.5 text-amber-600" />
                  Chưa có phiếu giảm giá đủ điều kiện
                </>
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="h-9 rounded-lg px-4"
            >
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
