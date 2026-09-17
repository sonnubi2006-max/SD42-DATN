package com.base.dto.response.order;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class OrderDetailResponse {

    private Long orderDetailId;

    private Long productId;         
    private String productCode;
    private String productSlug;
    private Long variantId;         
    private String variantCode;
    private String productName;
    private String imageUrl;
    private String size;
    private String color;

    private Integer quantity;
    private Integer damagedQuantity;
    private Integer undamagedQuantity;
    private BigDecimal price;       
    private BigDecimal salePrice;   
    private BigDecimal purchasedUnitPrice;
    private BigDecimal currentVariantPrice; 
    private BigDecimal subtotal;

    private Integer stockQuantity;  
    private Boolean isReviewed;
    private Integer returnedQuantity;
    private Integer remainingReturnQuantity;
}
