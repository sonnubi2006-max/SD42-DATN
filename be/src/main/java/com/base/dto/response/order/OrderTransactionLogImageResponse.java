package com.base.dto.response.order;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class OrderTransactionLogImageResponse {
    private Long imageId;
    private String imageUrl;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
