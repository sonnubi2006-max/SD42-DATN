package com.base.utils;

import com.base.config.VNPayConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@RequiredArgsConstructor
public class VNPayUtil {

    private static final DateTimeFormatter VNPAY_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VNPayConfig config;

    public String buildPaymentUrl(String orderCode, long amount,
                                  String orderInfo, String clientIp, LocalDateTime expireTime) {
        LocalDateTime now    = LocalDateTime.now();

        Map<String, String> params = new TreeMap<>(); 
        params.put("vnp_Version",    config.getVersion());
        params.put("vnp_Command",    config.getCommand());
        params.put("vnp_TmnCode",    config.getTmnCode());
        params.put("vnp_Amount",     String.valueOf(amount * 100)); 
        params.put("vnp_CurrCode",   config.getCurrCode());
        params.put("vnp_TxnRef",     orderCode);
        params.put("vnp_OrderInfo",  orderInfo);
        params.put("vnp_OrderType",  "other");
        params.put("vnp_Locale",     config.getLocale());
        params.put("vnp_ReturnUrl",  config.getReturnUrl());
        params.put("vnp_IpAddr",     clientIp);
        params.put("vnp_CreateDate", now.format(VNPAY_FMT));
        params.put("vnp_ExpireDate", expireTime.format(VNPAY_FMT));

        String queryString = buildQueryString(params, true);
        String secureHash  = hmacSHA512(config.getHashSecret(), queryString);

        return config.getPayUrl() + "?" + queryString + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifySignature(Map<String, String> params) {

        String receivedHash = params.get("vnp_SecureHash");

        if (receivedHash == null) {
            return false;
        }

        Map<String,String> filtered = new TreeMap<>(params);

        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        String queryString = buildQueryString(filtered, true);

        String expectedHash =
                hmacSHA512(
                        config.getHashSecret(),
                        queryString
                );

        return expectedHash.equalsIgnoreCase(receivedHash);
    }

    public Map<String, String> buildQueryTransactionParams(String orderCode,
                                                           String txnDate,
                                                           String clientIp) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_RequestId",  UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        params.put("vnp_Version",    config.getVersion());
        params.put("vnp_Command",    "querydr");
        params.put("vnp_TmnCode",    config.getTmnCode());
        params.put("vnp_TxnRef",     orderCode);
        params.put("vnp_OrderInfo",  "Query transaction " + orderCode);
        params.put("vnp_TransDate",  txnDate);
        params.put("vnp_CreateDate", LocalDateTime.now().format(VNPAY_FMT));
        params.put("vnp_IpAddr",     clientIp);

        String data = params.get("vnp_RequestId")  + "|" +
                params.get("vnp_Version")     + "|" +
                params.get("vnp_Command")     + "|" +
                params.get("vnp_TmnCode")     + "|" +
                params.get("vnp_TxnRef")      + "|" +
                params.get("vnp_TransDate")   + "|" +
                params.get("vnp_CreateDate")  + "|" +
                params.get("vnp_IpAddr")      + "|" +
                params.get("vnp_OrderInfo");

        params.put("vnp_SecureHash", hmacSHA512(config.getHashSecret(), data));
        return params;
    }

    public Map<String, String> buildRefundParams(String orderCode,
                                                 long amount,
                                                 String transactionType,
                                                 String transactionNo,
                                                 String transactionDate,
                                                 String createBy,
                                                 String clientIp,
                                                 String orderInfo) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_RequestId",  UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase());
        params.put("vnp_Version",    config.getVersion());
        params.put("vnp_Command",    "refund");
        params.put("vnp_TmnCode",    config.getTmnCode());
        params.put("vnp_TransactionType", transactionType);
        params.put("vnp_TxnRef",     orderCode);
        params.put("vnp_Amount",     String.valueOf(amount * 100)); 
        params.put("vnp_TransactionNo", transactionNo != null ? transactionNo : "");
        params.put("vnp_TransactionDate", transactionDate);
        params.put("vnp_CreateBy",    createBy);
        params.put("vnp_CreateDate",  LocalDateTime.now().format(VNPAY_FMT));
        params.put("vnp_IpAddr",      clientIp);
        params.put("vnp_OrderInfo",   orderInfo);

        String data = params.get("vnp_RequestId")  + "|" +
                params.get("vnp_Version")     + "|" +
                params.get("vnp_Command")     + "|" +
                params.get("vnp_TmnCode")     + "|" +
                params.get("vnp_TransactionType") + "|" +
                params.get("vnp_TxnRef")      + "|" +
                params.get("vnp_Amount")      + "|" +
                params.get("vnp_TransactionNo") + "|" +
                params.get("vnp_TransactionDate") + "|" +
                params.get("vnp_CreateBy")    + "|" +
                params.get("vnp_CreateDate")  + "|" +
                params.get("vnp_IpAddr")      + "|" +
                params.get("vnp_OrderInfo");

        params.put("vnp_SecureHash", hmacSHA512(config.getHashSecret(), data));
        return params;
    }

    private String buildQueryString(Map<String, String> params, boolean encode) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(entry.getKey()).append("=");
            if (encode) {
                sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
            } else {
                sb.append(entry.getValue());
            }
        }
        return sb.toString();
    }

    public String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Không thể tạo HMAC SHA512", e);
        }
    }
}
