package com.base.dto.request.product;

import com.base.entity.Product;
import com.base.enums.ProductStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không để trống")
    private String productName;

    private String description;

    private Long categoryId;

    private Long brandId;

    private ProductStatus status;
}
