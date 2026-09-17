package com.base.utils;

import java.util.Locale;
import java.util.UUID;

public final class BusinessCodeGenerator {

    private BusinessCodeGenerator() {
    }

    public static String generate(String prefix) {
        return prefix + "_" + UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase(Locale.ROOT);
    }
}
