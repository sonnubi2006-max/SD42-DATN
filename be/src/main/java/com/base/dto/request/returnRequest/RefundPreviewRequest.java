package com.base.dto.request.returnRequest;

import lombok.Data;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class RefundPreviewRequest {

    @NotNull(message = "Đơn hàng không được để trống")
    private Long orderId;

    @Valid
    @NotEmpty(message = "Danh sách sản phẩm xem trước không được để trống")
    private List<PreviewItem> items;

    @Data
    public static class PreviewItem {
        @NotNull(message = "Variant không được để trống")
        private Long variantId;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn 0")
        private Integer quantity;
    }
}
