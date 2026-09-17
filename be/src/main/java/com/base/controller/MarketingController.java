package com.base.controller;

import com.base.dto.request.marketing.PromotionEmailRequest;
import com.base.dto.response.ApiResponse;
import com.base.service.MarketingEmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/marketing")
@RequiredArgsConstructor
public class MarketingController {

    private final MarketingEmailService marketingEmailService;

    @PostMapping("/promotion")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> sendPromotion(
            @Valid @RequestBody PromotionEmailRequest request) {

        int queued = marketingEmailService.sendPromotionToSubscribers(request);

        return ResponseEntity.ok(ApiResponse.success(
                "Đã gửi email ưu đãi tới " + queued + " khách hàng",
                Map.of("queued", queued)));
    }
}
