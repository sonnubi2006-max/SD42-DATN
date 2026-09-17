package com.base.utils;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.UUID;

@Component
public class CredentialGenerator {

    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    private final SecureRandom random = new SecureRandom();

    public String generateUsername(String email) {
        String prefix = email.split("@")[0]
                .replaceAll("[^a-zA-Z0-9]", "");
        if (prefix.length() > 20) {
            prefix = prefix.substring(0, 20);
        }
        return prefix + randomDigits(4);
    }

    public String generatePassword() {
        return generatePassword(10);
    }

    public String generatePassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }

    private String randomDigits(int length) {
        return UUID.randomUUID()
                .toString()
                .replaceAll("[^0-9]", "")
                .concat("0000")
                .substring(0, length);
    }
}
