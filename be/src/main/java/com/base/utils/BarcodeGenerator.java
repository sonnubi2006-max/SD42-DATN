package com.base.utils;

import com.base.exception.BadRequestException;
import org.springframework.stereotype.Component;

@Component
public class BarcodeGenerator {

    private static final String INTERNAL_PREFIX = "200";

    public String generateEan13(Long variantId) {
        if (variantId == null || variantId <= 0) {
            throw new BadRequestException("variantId không hợp lệ để sinh barcode: " + variantId);
        }

        String body = INTERNAL_PREFIX + String.format("%09d", variantId); 
        if (body.length() != 12) {
            throw new BadRequestException("variantId quá lớn để sinh EAN-13: " + variantId);
        }

        return body + checkDigit(body);
    }

    private char checkDigit(String body12) {
        int sum = 0;
        for (int i = 0; i < 12; i++) {
            int digit = body12.charAt(i) - '0';
            sum += (i % 2 == 0) ? digit : digit * 3;
        }
        int check = (10 - (sum % 10)) % 10;
        return (char) ('0' + check);
    }
}
