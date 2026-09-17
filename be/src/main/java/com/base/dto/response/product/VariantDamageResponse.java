package com.base.dto.response.product;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class VariantDamageResponse {
    private Long variantId;
    private String variantCode;
    private Integer totalDamagedQuantity;
    private Integer filteredDamagedQuantity;
    private Long totalElements;
    private Integer totalPages;
    private Integer page;
    private Integer size;
    private Boolean first;
    private Boolean last;
    private List<DamageRecord> records;

    @Data
    @Builder
    public static class DamageRecord {
        private String source;
        private Long sourceId;
        private Long orderId;
        private String orderCode;
        private Integer damagedQuantity;
        private LocalDateTime recordedAt;
    }
}
