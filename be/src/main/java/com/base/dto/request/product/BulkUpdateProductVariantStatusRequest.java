package com.base.dto.request.product;

import com.base.enums.ProductVariantStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkUpdateProductVariantStatusRequest {

    @NotEmpty(message = "Danh sách mã biến thể không được để trống")
    private List<@NotNull(message = "Mã biến thể không được để trống") Long> variantIds;

    @NotNull(message = "Trạng thái biến thể không được để trống")
    private ProductVariantStatus status;
}
