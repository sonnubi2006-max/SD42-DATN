package com.base.dto.request.order;

import com.base.enums.OrderStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateOrderStatusRequest {

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    private OrderStatus orderStatus;

    private String note;

    @Valid
    private List<DamagedItemRequest> damagedItems;

    @Getter
    @Setter
    public static class DamagedItemRequest {
        @NotNull
        private Long variantId;

        @NotNull
        @Min(value = 0, message = "Số lượng hỏng không được âm")
        private Integer damagedQuantity;  
    }
}
