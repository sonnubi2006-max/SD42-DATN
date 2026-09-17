package com.base.dto.request.returnRequest;

import com.base.enums.ExchangeDeliveryStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class UpdateExchangeDeliveryRequest {
    private ExchangeDeliveryStatus status;
    private String note;
    @Valid
    private List<DamagedItemRequest> damagedItems;

    @Data
    public static class DamagedItemRequest {
        @NotNull
        private Long variantId;
        @NotNull
        @Min(0)
        private Integer damagedQuantity;
    }
}
