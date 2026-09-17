import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Tag,
  Ticket,
  X,
} from "lucide-react";
import type { CouponResponse } from "@/api/couponApi";
import { money } from "./posUtils";
import { useCouponList } from "@/hooks/useCoupon";
import CouponPopup from "./CouponPopup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface DiscountInfo {
  discountAmount: number;

  couponIdParam?: number;
}

interface Props {
  subtotal: number;
  customerId: number | null;
  activeDraftId: number;
  draftCouponCode?: string | null;
  draftCouponId?: number | null;
  draftDiscountAmount?: number;
  onDiscountChange: (info: DiscountInfo) => void;
}

export default function CouponSection({
  subtotal,
  customerId,
  activeDraftId,
  draftCouponCode,
  draftCouponId,
  draftDiscountAmount,
  onDiscountChange,
}: Props) {
  const [couponOpen, setCouponOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponResponse | null>(
    null,
  );
  const [couponCleared, setCouponCleared] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const { data: couponPage } = useCouponList({
    status: "ACTIVE",
    customerId: customerId ?? undefined,
    size: 100,
  });

  const coupons = useMemo(() => couponPage?.content ?? [], [couponPage]);

  const [prevDraftId, setPrevDraftId] = useState(activeDraftId);
  const [prevCustomerId, setPrevCustomerId] = useState(customerId);
  if (activeDraftId !== prevDraftId || customerId !== prevCustomerId) {
    setPrevDraftId(activeDraftId);
    setPrevCustomerId(customerId);
    setSelectedCoupon(null);
    setCouponCleared(false);
    setUserInteracted(false);
  }

  const bestEligibleCoupon = useMemo(() => {
    if (!coupons.length) return null;
    let best: CouponResponse | null = null;
    let maxDisc = 0;
    for (const c of coupons) {
      if (!c.valid) continue;
      const isPersonal = c.couponType === "PERSONAL";
      const isEligible =
        !isPersonal ||
        (!!customerId &&
          c.targetedCustomers?.some((tc) => tc.customerId === customerId));
      if (!isEligible) continue;

      if (c.minOrderValue && subtotal < c.minOrderValue) continue;

      let disc =
        c.discountType === "PERCENTAGE"
          ? (subtotal * c.discountValue) / 100
          : c.discountValue;
      if (c.maxDiscountAmount) {
        disc = Math.min(disc, c.maxDiscountAmount);
      }
      disc = Math.round(disc);

      if (disc > maxDisc) {
        maxDisc = disc;
        best = c;
      }
    }
    return best;
  }, [coupons, subtotal, customerId]);

  const activeCoupon = useMemo(() => {
    if (couponCleared) return null;
    if (userInteracted) {
      return selectedCoupon?.valid &&
        selectedCoupon.remainingUsesForCurrentUser !== 0
        ? selectedCoupon
        : null;
    }
    return bestEligibleCoupon;
  }, [couponCleared, userInteracted, selectedCoupon, bestEligibleCoupon]);

  useEffect(() => {
    if (!selectedCoupon) return;
    const latest = coupons.find(
      (coupon) => coupon.couponId === selectedCoupon.couponId,
    );
    if (latest && (!latest.valid || latest.remainingUsesForCurrentUser === 0)) {
      setSelectedCoupon(null);
      setCouponCleared(true);
      setUserInteracted(true);
    }
  }, [coupons, selectedCoupon]);

  const discountAmount = useMemo(() => {
    if (couponCleared) return 0;
    if (activeCoupon) {
      let d =
        activeCoupon.discountType === "PERCENTAGE"
          ? (subtotal * activeCoupon.discountValue) / 100
          : activeCoupon.discountValue;
      if (activeCoupon.maxDiscountAmount) {
        d = Math.min(d, activeCoupon.maxDiscountAmount);
      }
      return Math.min(Math.round(d), subtotal);
    }
    if (!userInteracted && draftDiscountAmount !== undefined) {
      return draftDiscountAmount;
    }
    return 0;
  }, [
    couponCleared,
    activeCoupon,
    subtotal,
    userInteracted,
    draftDiscountAmount,
  ]);

  const couponIdParam = useMemo<number | undefined>(() => {
    if (couponCleared) return -1;
    if (activeCoupon) return activeCoupon.couponId;
    if (!userInteracted && draftCouponId) {
      const draftCoupon = coupons.find((coupon) => coupon.couponId === draftCouponId);
      if (draftCoupon?.valid && draftCoupon.remainingUsesForCurrentUser !== 0) {
        return draftCouponId;
      }
    }
    return undefined;
  }, [couponCleared, activeCoupon, userInteracted, draftCouponId, coupons]);

  useEffect(() => {
    onDiscountChange({ discountAmount, couponIdParam });

  }, [discountAmount, couponIdParam]);

  const displayedCode = couponCleared
    ? null
    : (activeCoupon?.code ??
      (!userInteracted ? draftCouponCode : null) ??
      null);

  const displayedDetails = useMemo(() => {
    if (couponCleared) return null;
    if (activeCoupon) {
      return `Giảm ${
        activeCoupon.discountType === "PERCENTAGE"
          ? `${activeCoupon.discountValue}%`
          : money(activeCoupon.discountValue)
      }${activeCoupon.maxDiscountAmount ? ` (tối đa ${money(activeCoupon.maxDiscountAmount)})` : ""}`;
    }
    if (!userInteracted && draftCouponCode) {
      return `Giảm ${money(draftDiscountAmount ?? 0)}`;
    }
    return null;
  }, [
    couponCleared,
    activeCoupon,
    userInteracted,
    draftCouponCode,
    draftDiscountAmount,
  ]);

  const upsellSuggestion = useMemo(() => {
    if (!coupons.length) return null;

    const currentDiscount = discountAmount;

    let bestPotentialCoupon: CouponResponse | null = null;
    let maxPotentialDiscount = currentDiscount;
    let minSpendNeeded = 0;

    for (const c of coupons) {
      if (!c.valid) continue;

      const isPersonal = c.couponType === "PERSONAL";
      const isEligible =
        !isPersonal ||
        (!!customerId &&
          c.targetedCustomers?.some((tc) => tc.customerId === customerId));
      if (!isEligible) continue;

      if (c.minOrderValue && subtotal < c.minOrderValue) {
        const potentialSubtotal = c.minOrderValue;
        let pDisc =
          c.discountType === "PERCENTAGE"
            ? (potentialSubtotal * c.discountValue) / 100
            : c.discountValue;
        if (c.maxDiscountAmount) {
          pDisc = Math.min(pDisc, c.maxDiscountAmount);
        }
        pDisc = Math.round(pDisc);

        if (pDisc > maxPotentialDiscount) {
          maxPotentialDiscount = pDisc;
          bestPotentialCoupon = c;
          minSpendNeeded = c.minOrderValue - subtotal;
        }
      }
    }

    if (bestPotentialCoupon) {
      const discountText =
        bestPotentialCoupon.discountType === "PERCENTAGE"
          ? `${bestPotentialCoupon.discountValue}%`
          : money(bestPotentialCoupon.discountValue);
      return {
        code: bestPotentialCoupon.code,
        minSpendNeeded,
        potentialDiscount: maxPotentialDiscount,
        discountText,
      };
    }

    return null;
  }, [coupons, subtotal, customerId, discountAmount]);

  const showBestEligibleSuggestion = useMemo(() => {
    if (!bestEligibleCoupon) return false;

    if (!displayedCode) return true;

    const currentAppliedId = activeCoupon?.couponId ?? draftCouponId;
    if (currentAppliedId !== bestEligibleCoupon.couponId) {
      let bestDisc =
        bestEligibleCoupon.discountType === "PERCENTAGE"
          ? (subtotal * bestEligibleCoupon.discountValue) / 100
          : bestEligibleCoupon.discountValue;
      if (bestEligibleCoupon.maxDiscountAmount) {
        bestDisc = Math.min(bestDisc, bestEligibleCoupon.maxDiscountAmount);
      }
      bestDisc = Math.round(bestDisc);

      if (discountAmount < bestDisc) {
        return true;
      }
    }

    return false;
  }, [
    bestEligibleCoupon,
    displayedCode,
    activeCoupon,
    draftCouponId,
    discountAmount,
    subtotal,
  ]);

  return (
    <div className="px-4 py-3 border-b bg-card">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={13} className="text-emerald-600" />
            Ưu đãi
          </span>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Hệ thống lọc mã phù hợp theo khách hàng và giá trị đơn
          </p>
        </div>
        {displayedCode && (
          <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
            -{money(discountAmount)}
          </span>
        )}
      </div>

      {displayedCode ? (
        <Card className="relative rounded-lg bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30 shadow-2xs overflow-hidden group">
          <CardContent className="flex items-center justify-between p-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white shadow-xs">
                <BadgeCheck size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase truncate">
                    {displayedCode}
                  </span>
                </div>
                {displayedDetails && (
                  <p className="text-[11px] font-medium text-emerald-600/90 truncate">
                    {displayedDetails}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCouponOpen(true)}
                className="h-7 gap-1 px-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100"
                title="Chọn mã giảm giá khác"
              >
                <RefreshCw size={11} />
                Đổi mã
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCouponCleared(true);
                  setSelectedCoupon(null);
                  setUserInteracted(true);
                }}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer"
                title="Gỡ mã giảm giá"
              >
                <X size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-dashed border-border bg-muted/20 hover:border-emerald-500/40 transition-colors">
          <CardContent className="p-0">
            <button
              onClick={() => setCouponOpen(true)}
              className="flex w-full items-center justify-between p-2.5 text-xs text-foreground cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Ticket
                  size={15}
                  className="text-emerald-600 group-hover:scale-110 transition-transform"
                />
                <span className="font-semibold text-foreground">
                  Chọn mã giảm giá
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span>Chọn mã</span>
                <ChevronRight size={13} />
              </div>
            </button>
          </CardContent>
        </Card>
      )}

      {showBestEligibleSuggestion && bestEligibleCoupon && (
        <div className="mt-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 text-[11px] font-bold text-emerald-700 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-emerald-600">
              <Sparkles size={12} className="shrink-0 text-emerald-500" />
              <span>
                Mã tiết kiệm nhất:{" "}
                <span className="underline font-extrabold uppercase">
                  {bestEligibleCoupon.code}
                </span>
              </span>
            </div>
            <p className="text-gray-400 font-semibold text-[10px] pl-3.5">
              Được giảm{" "}
              {bestEligibleCoupon.discountType === "PERCENTAGE"
                ? `${bestEligibleCoupon.discountValue}%`
                : money(bestEligibleCoupon.discountValue)}
              {bestEligibleCoupon.maxDiscountAmount
                ? ` (tối đa ${money(bestEligibleCoupon.maxDiscountAmount)})`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCoupon(bestEligibleCoupon);
              setCouponCleared(false);
              setUserInteracted(true);
            }}
            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50 shrink-0 h-6 px-2 cursor-pointer border border-emerald-200/50 rounded transition-colors"
          >
            Áp dụng
          </button>
        </div>
      )}

      {upsellSuggestion && (
        <div className="mt-2.5 rounded-lg border border-rose-100 bg-rose-50/50 p-2 text-[11px] font-bold text-rose-700 flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-rose-600">
            <Ticket
              size={12}
              className="shrink-0 animate-pulse text-rose-500"
            />
            <span>
              Gợi ý: Mua thêm {money(upsellSuggestion.minSpendNeeded)} để dùng
              mã{" "}
              <span className="underline font-extrabold uppercase">
                {upsellSuggestion.code}
              </span>
            </span>
          </div>
          <p className="text-gray-400 font-semibold text-[10px] pl-3.5">
            Nhận ưu đãi giảm giá tốt hơn: giảm {upsellSuggestion.discountText}
          </p>
        </div>
      )}

      <CouponPopup
        open={couponOpen}
        onOpenChange={setCouponOpen}
        customerId={customerId}
        subtotal={subtotal}
        selectedCouponId={activeCoupon?.couponId ?? draftCouponId}
        onPickCoupon={(c) => {
          setSelectedCoupon(c);
          setCouponCleared(false);
          setUserInteracted(true);
          setCouponOpen(false);
        }}
      />
    </div>
  );
}
