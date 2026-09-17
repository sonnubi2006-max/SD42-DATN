package com.base.service;

import com.base.dto.request.promotion.PromotionRequest;
import com.base.dto.response.promotion.PromotionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PromotionService {

    PromotionResponse create(PromotionRequest request);

    PromotionResponse update(Long promotionId, PromotionRequest request);

    PromotionResponse cancel(Long promotionId);

    PromotionResponse toggleStatus(Long promotionId);

    Page<PromotionResponse> getAll(String keyword, String status, String applyType, java.time.LocalDateTime startDate, java.time.LocalDateTime endDate, Pageable pageable);

    PromotionResponse getById(Long promotionId);

    List<PromotionResponse> getActivePromotions();
}