package com.base.dto.request.banner;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BannerUpdateRequest {
    @NotBlank(message = "Tiêu đề không để trống")
    private String title;

    private String redirectUrl;

    private Boolean isActive;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}
