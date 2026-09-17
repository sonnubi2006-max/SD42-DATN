package com.base.dto.request.category;

import com.base.enums.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCategoryRequest {

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(
            min = 2,
            max = 100,
            message = "Tên danh mục phải từ 2 đến 100 ký tự"
    )
    private String categoryName;

    @Size(
            max = 500,
            message = "Mô tả danh mục không được vượt quá 500 ký tự"
    )
    private String categoryDescription;

    private CategoryStatus categoryStatus;
}