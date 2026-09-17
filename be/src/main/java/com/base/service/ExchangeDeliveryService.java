package com.base.service;

import com.base.dto.request.returnRequest.UpdateExchangeDeliveryRequest;
import com.base.dto.response.returnRequest.ExchangeDeliveryResponse;
import com.base.enums.ExchangeDeliveryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ExchangeDeliveryService {
    Page<ExchangeDeliveryResponse> search(ExchangeDeliveryStatus status, String keyword,
                                          java.time.LocalDateTime fromDate,
                                          java.time.LocalDateTime toDate,
                                          Pageable pageable);
    ExchangeDeliveryResponse getById(Long id);
    ExchangeDeliveryResponse update(Long id, UpdateExchangeDeliveryRequest request, List<MultipartFile> images);
}
