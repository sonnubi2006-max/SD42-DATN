package com.base.service;

import com.base.dto.request.returnRequest.CreateReturnRequest;
import com.base.dto.request.returnRequest.RefundPreviewRequest;
import com.base.dto.request.returnRequest.RejectReturnRequest;
import com.base.dto.response.returnRequest.RefundPreviewResponse;
import com.base.dto.response.returnRequest.ReturnResponse;
import com.base.dto.response.returnRequest.ReturnStatisticsResponse;
import com.base.enums.ReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReturnRequestService {

    Page<ReturnResponse> search(
            ReturnStatus status,
            String keyword,
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDate,
            Pageable pageable
    );

    ReturnResponse getById(Long id);

    ReturnResponse create(CreateReturnRequest request);

    ReturnResponse approve(Long id);

    ReturnResponse reject(Long id, RejectReturnRequest request);

    ReturnResponse complete(Long id, com.base.dto.request.returnRequest.CompleteReturnRequest request);

    ReturnStatisticsResponse getStatistics(
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDate
    );

    Page<ReturnResponse> getMyReturns(Long customerId, Pageable pageable);

    ReturnResponse getMyReturnById(Long id, Long customerId);

    RefundPreviewResponse calculateRefundPreview(RefundPreviewRequest request);
}
