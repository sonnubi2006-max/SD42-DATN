package com.base.dto.request.banner;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BannerCreateRequest {

    @NotBlank(message = "Tiêu đề không để trống")
    private String title;

    private String redirectUrl;

    private LocalDateTime startDate;

    private LocalDateTime endDate;
}
