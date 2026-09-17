package com.base.service.helper;

import com.base.enums.OrderType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OrderPriceCalculatorTest {

    private final OrderPriceCalculator calculator = new OrderPriceCalculator();

    @Test
    void calcShippingFee_usesThirtyFiveThousandForOnlineOrderBelowFreeShipThreshold() {
        BigDecimal shippingFee = calculator.calcShippingFee(
                new BigDecimal("100000"),
                BigDecimal.ZERO,
                OrderType.ONLINE
        );

        assertEquals(new BigDecimal("35000"), shippingFee);
    }
}
