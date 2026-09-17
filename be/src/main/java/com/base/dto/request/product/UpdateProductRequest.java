package com.base.dto.request.product;

import com.base.entity.Product;
import com.base.enums.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProductRequest {

    @NotBlank(message = "Tên sản phẩm không để trống")
    private String productName;

    private String description;

    private Long categoryId;

    private Long brandId;

    private ProductStatus status;

    private List<Long> imagesDelete = new ArrayList<>();
}
