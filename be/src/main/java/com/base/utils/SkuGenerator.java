package com.base.utils;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.function.Predicate;

@Component
public class SkuGenerator {

    public String generate(String productCode,
                           String color,
                           String size,
                           Predicate<String> exists) {

        String sizePart = abbr(size, 20, "OS");
        String colorPart = abbr(color, 20, "STD");

        String base = productCode + "-" + sizePart + "-" + colorPart;

        String code = base;
        int seq = 1;
        while (exists.test(code)) {
            code = base + "-" + String.format("%02d", seq++);
        }
        return code;
    }

    private String abbr(String input, int len, String fallback) {
        if (input == null || input.isBlank()) return fallback;

        String noAccent = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")     
                .replace('đ', 'd').replace('Đ', 'D');

        String cleaned = noAccent.toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (cleaned.isEmpty()) return fallback;

        return cleaned.length() > len ? cleaned.substring(0, len) : cleaned;
    }
}
