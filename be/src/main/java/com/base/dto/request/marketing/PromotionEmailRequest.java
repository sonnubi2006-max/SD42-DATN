package com.base.dto.request.marketing;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PromotionEmailRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "Nội dung không được để trống")
    private String content;
}
