package com.base.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VNPayConfig {

    private String tmnCode;          

    private String hashSecret;       

    private String payUrl;           

    private String returnUrl;        

    private String ipnUrl;           

    private String apiUrl;           

    private String currCode = "VND";

    private String version = "2.1.0";

    private String command = "pay";

    private String locale = "vn";

    private int expireMinutes = 10;

    public boolean isPaymentConfigured() {
        return !isBlank(tmnCode)
                && !isBlank(hashSecret)
                && !isBlank(payUrl)
                && !isBlank(returnUrl);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
