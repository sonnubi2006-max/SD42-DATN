package com.base.dto.response.category;

import lombok.Data;

@Data
public class CategoryResponse {
    private Long categoryId;
    private String categoryName;
    private String categoryCode;
    private String categoryDescription;
}
