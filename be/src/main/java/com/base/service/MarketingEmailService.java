package com.base.service;

import com.base.dto.request.marketing.PromotionEmailRequest;

public interface MarketingEmailService {

    int sendPromotionToSubscribers(PromotionEmailRequest request);
}
