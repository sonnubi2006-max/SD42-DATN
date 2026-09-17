package com.base.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BusinessCodeGenerationTest {

    @Test
    void generatesCodesForNewManagementEntities() {
        Customer customer = new Customer();
        User user = new User();
        Promotion promotion = new Promotion();

        customer.ensureCustomerCode();
        user.ensureUserCode();
        promotion.ensurePromotionCode();

        assertTrue(customer.getCustomerCode().matches("CUS_[0-9A-F]{8}"));
        assertTrue(user.getUserCode().matches("USR_[0-9A-F]{8}"));
        assertTrue(promotion.getPromotionCode().matches("PROM_[0-9A-F]{8}"));
    }

    @Test
    void keepsAnExistingBusinessCode() {
        Customer customer = Customer.builder().customerCode("CUS_CUSTOM01").build();

        customer.ensureCustomerCode();

        assertEquals("CUS_CUSTOM01", customer.getCustomerCode());
    }
}
