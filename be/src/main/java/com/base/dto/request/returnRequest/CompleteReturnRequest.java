package com.base.dto.request.returnRequest;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class CompleteReturnRequest {

    @Valid
    private List<ReturnItemDamagedQtyRequest> items;

    private String processedImages;

    @Data
    public static class ReturnItemDamagedQtyRequest {
        @NotNull(message = "Return item không được để trống")
        private Long returnItemId;

        @NotNull(message = "Số lượng hỏng không được để trống")
        @Min(value = 0, message = "Số lượng hỏng không được âm")
        private Integer damagedQuantity;
    }
}
