package com.base.enums;

public enum ExchangeDeliveryStatus {
    PREPARING,
    SHIPPING,
    DELIVERED,
    FAILED_DELIVERY,
    RETURNING,
    RETURNED_TO_SHOP,
    CANCELLED,
    CANCELED_BY_DAMAGED,
    /** Chỉ để đọc dữ liệu cũ trước khi chạy migration FAILED -> FAILED_DELIVERY. */
    @Deprecated
    FAILED
}
