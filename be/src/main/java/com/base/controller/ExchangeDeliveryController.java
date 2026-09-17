package com.base.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.base.dto.request.returnRequest.UpdateExchangeDeliveryRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.returnRequest.ExchangeDeliveryResponse;
import com.base.enums.ExchangeDeliveryStatus;
import com.base.service.ExchangeDeliveryService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import com.base.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/manager/exchange-deliveries")
public class ExchangeDeliveryController {
    private final ExchangeDeliveryService service;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExchangeDeliveryResponse>>> search(
            @RequestParam(required = false) ExchangeDeliveryStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime toDate,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(service.search(status, keyword, fromDate, toDate, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExchangeDeliveryResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ExchangeDeliveryResponse>> update(
            @PathVariable Long id,
            @RequestParam("request") String requestJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        UpdateExchangeDeliveryRequest request = parseAndValidateRequest(requestJson);
        return ResponseEntity.ok(ApiResponse.success(service.update(id, request, images)));
    }

    private UpdateExchangeDeliveryRequest parseAndValidateRequest(String requestJson) {
        try {
            UpdateExchangeDeliveryRequest request = objectMapper.readValue(
                    requestJson, UpdateExchangeDeliveryRequest.class);
            Set<ConstraintViolation<UpdateExchangeDeliveryRequest>> violations = validator.validate(request);
            if (!violations.isEmpty()) {
                throw new BadRequestException(violations.iterator().next().getMessage());
            }
            return request;
        } catch (JsonProcessingException ex) {
            throw new BadRequestException("Dữ liệu cập nhật trạng thái không hợp lệ");
        }
    }
}
