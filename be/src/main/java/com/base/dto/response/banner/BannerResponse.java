package com.base.dto.response.banner;

import lombok.*;

import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class BannerResponse {

    private Long bannerId;

    private String title;

    private String imageUrl;

    private String redirectUrl;

    private Boolean isActive;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
