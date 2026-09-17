package com.base.service.helper;

import com.base.entity.Coupon;
import com.base.entity.OrderDetail;
import com.base.entity.Promotion;
import com.base.enums.ApplyType;
import com.base.enums.OrderType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class OrderPriceCalculator {

    private static final BigDecimal FREE_SHIP_THRESHOLD = new BigDecimal("2000000");
    private static final BigDecimal DEFAULT_SHIPPING_FEE = new BigDecimal("35000");

    public BigDecimal applyPromotionToUnit(
            BigDecimal originalPrice,
            Long variantId,
            Long productId,
            Long categoryId,
            List<Promotion> activePromotions
    ) {
        if (activePromotions == null || activePromotions.isEmpty()) return originalPrice;

        Optional<BigDecimal> bestDiscounted = activePromotions.stream()
                .filter(p -> p.appliesToVariant(variantId, productId, categoryId))
                .map(p -> calcDiscountedPrice(originalPrice, p))
                .min(BigDecimal::compareTo); 

        return bestDiscounted.orElse(originalPrice);
    }

    public BigDecimal calcPromotionOrderDiscount(
            BigDecimal totalAmount,
            List<Promotion> activePromotions
    ) {
        if (activePromotions == null || activePromotions.isEmpty()) return BigDecimal.ZERO;

        return activePromotions.stream()
                .filter(p -> p.getApplyType() == ApplyType.ORDER)
                .map(p -> calcDiscountAmount(totalAmount, p.getDiscountValue(),
                        p.getMaxDiscountAmount(), p.isPercentage()))
                .reduce(BigDecimal.ZERO, BigDecimal::add) 
                .min(totalAmount); 
    }

    public BigDecimal calcCouponDiscount(BigDecimal amountAfterPromotion, Coupon coupon) {
        if (coupon == null) return BigDecimal.ZERO;
        if (coupon.getMinOrderValue() != null && amountAfterPromotion.compareTo(coupon.getMinOrderValue()) < 0) {
            log.info("Phiếu giảm giá {} không đủ điều kiện giá trị đơn tối thiểu ({}) cho đơn ({})",
                    coupon.getCode(), coupon.getMinOrderValue(), amountAfterPromotion);
            return BigDecimal.ZERO;
        }

        return calcDiscountAmount(
                amountAfterPromotion,
                coupon.getDiscountValue(),
                coupon.getMaxDiscountAmount(),
                coupon.isPercentage()
        ).min(amountAfterPromotion);
    }

    public BigDecimal calcTotalAmount(List<OrderDetail> details) {
        return details.stream()
                .map(OrderDetail::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calcTotalDiscount(
            BigDecimal promotionOrderDiscount,
            BigDecimal couponDiscount
    ) {
        return promotionOrderDiscount.add(couponDiscount);
    }

    public BigDecimal calcShippingFee(BigDecimal totalAmount,
                                      BigDecimal totalDiscount,
                                      OrderType orderType) {

        if (orderType == OrderType.POS) {
            return BigDecimal.ZERO;
        }

        BigDecimal finalAmount = totalAmount.subtract(totalDiscount);

        boolean isFreeShip = finalAmount.compareTo(FREE_SHIP_THRESHOLD) >= 0;

        return isFreeShip ? BigDecimal.ZERO : DEFAULT_SHIPPING_FEE;
    }

    public BigDecimal calcFinalAmount(BigDecimal total, BigDecimal discount, BigDecimal shipping) {
        return total.subtract(discount).add(shipping).max(BigDecimal.ZERO);
    }

    private BigDecimal calcDiscountedPrice(BigDecimal originalPrice, Promotion promotion) {
        BigDecimal discounted = originalPrice.subtract(
                calcDiscountAmount(originalPrice, promotion.getDiscountValue(),
                        promotion.getMaxDiscountAmount(), promotion.isPercentage())
        );
        return discounted.max(BigDecimal.ZERO);
    }

    private BigDecimal calcDiscountAmount(BigDecimal baseAmount, BigDecimal discountValue,
                                          BigDecimal maxDiscount, boolean isPercentage) {
        BigDecimal discount;
        if (isPercentage) {
            discount = baseAmount.multiply(discountValue)
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (maxDiscount != null) discount = discount.min(maxDiscount);
        } else {
            discount = discountValue;
        }
        return discount.min(baseAmount);
    }
}
