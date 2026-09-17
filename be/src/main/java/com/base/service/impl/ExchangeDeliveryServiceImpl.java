package com.base.service.impl;

import com.base.dto.request.returnRequest.UpdateExchangeDeliveryRequest;
import com.base.dto.request.ImageUploadMessage;
import com.base.dto.response.returnRequest.ExchangeDeliveryLogResponse;
import com.base.dto.response.returnRequest.ExchangeDeliveryResponse;
import com.base.dto.response.returnRequest.ExchangeItemResponse;
import com.base.entity.ExchangeDelivery;
import com.base.entity.ExchangeDeliveryLog;
import com.base.entity.ExchangeDeliveryLogImage;
import com.base.entity.ExchangeDeliveryDamage;
import com.base.entity.ProductVariant;
import com.base.entity.User;
import com.base.enums.ExchangeDeliveryStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.ExchangeDeliveryLogRepository;
import com.base.repository.ExchangeDeliveryLogImageRepository;
import com.base.repository.ExchangeDeliveryRepository;
import com.base.repository.ExchangeDeliveryDamageRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.UserRepository;
import com.base.service.ExchangeDeliveryService;
import com.base.queue.ImageUploadProducer;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ExchangeDeliveryServiceImpl implements ExchangeDeliveryService {
    private final ExchangeDeliveryRepository repository;
    private final ExchangeDeliveryDamageRepository damageRepository;
    private final ExchangeDeliveryLogRepository logRepository;
    private final ExchangeDeliveryLogImageRepository logImageRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final SecurityUtils securityUtils;
    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;

    private static final Set<String> ALLOWED_EVIDENCE_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final int MAX_EVIDENCE_IMAGES = 5;
    private static final long MAX_EVIDENCE_IMAGE_SIZE = 5L * 1024L * 1024L;

    private static final Map<ExchangeDeliveryStatus, Set<ExchangeDeliveryStatus>> TRANSITIONS = Map.of(
            ExchangeDeliveryStatus.PREPARING, Set.of(ExchangeDeliveryStatus.SHIPPING,
                    ExchangeDeliveryStatus.CANCELLED, ExchangeDeliveryStatus.CANCELED_BY_DAMAGED),
            ExchangeDeliveryStatus.SHIPPING, Set.of(ExchangeDeliveryStatus.DELIVERED,
                    ExchangeDeliveryStatus.FAILED_DELIVERY, ExchangeDeliveryStatus.RETURNING,
                    ExchangeDeliveryStatus.CANCELED_BY_DAMAGED),
            ExchangeDeliveryStatus.FAILED_DELIVERY, Set.of(ExchangeDeliveryStatus.SHIPPING,
                    ExchangeDeliveryStatus.RETURNING, ExchangeDeliveryStatus.CANCELED_BY_DAMAGED),
            ExchangeDeliveryStatus.FAILED, Set.of(ExchangeDeliveryStatus.SHIPPING,
                    ExchangeDeliveryStatus.RETURNING, ExchangeDeliveryStatus.CANCELED_BY_DAMAGED),
            ExchangeDeliveryStatus.RETURNING, Set.of(ExchangeDeliveryStatus.RETURNED_TO_SHOP,
                    ExchangeDeliveryStatus.CANCELED_BY_DAMAGED),
            ExchangeDeliveryStatus.RETURNED_TO_SHOP, Set.of(ExchangeDeliveryStatus.PREPARING),
            ExchangeDeliveryStatus.CANCELLED, Set.of(ExchangeDeliveryStatus.PREPARING),
            ExchangeDeliveryStatus.CANCELED_BY_DAMAGED, Set.of(ExchangeDeliveryStatus.PREPARING)
    );

    private static final Set<ExchangeDeliveryStatus> EVIDENCE_REQUIRED = Set.of(
            ExchangeDeliveryStatus.FAILED_DELIVERY,
            ExchangeDeliveryStatus.RETURNING,
            ExchangeDeliveryStatus.CANCELED_BY_DAMAGED
    );

    @Override
    @Transactional(readOnly = true)
    public Page<ExchangeDeliveryResponse> search(ExchangeDeliveryStatus status, String keyword,
                                                 LocalDateTime fromDate, LocalDateTime toDate,
                                                 Pageable pageable) {
        String normalized = keyword == null || keyword.isBlank() ? null : keyword.trim();
        return repository.search(status, normalized, fromDate, toDate, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ExchangeDeliveryResponse getById(Long id) {
        return toResponse(repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu giao hàng đổi")));
    }

    @Override
    public ExchangeDeliveryResponse update(Long id, UpdateExchangeDeliveryRequest request,
                                           List<MultipartFile> images) {
        List<MultipartFile> evidenceFiles = normalizeAndValidateEvidenceImages(request.getStatus(), images);
        ExchangeDelivery delivery = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu giao hàng đổi"));
        if (request.getStatus() != null && request.getStatus() != delivery.getStatus()) {
            if (!TRANSITIONS.getOrDefault(delivery.getStatus(), Set.of()).contains(request.getStatus())) {
                throw new BadRequestException("Không thể chuyển trạng thái giao hàng từ "
                        + delivery.getStatus() + " sang " + request.getStatus());
            }
            validateTransitionPayload(request, evidenceFiles);
            ExchangeDeliveryStatus previous = delivery.getStatus();
            ExchangeDeliveryStatus next = request.getStatus();
            if (next == ExchangeDeliveryStatus.PREPARING && isRetryableTerminalStatus(previous)) {
                allocateInventoryForRetry(delivery);
            }
            handleInventoryForTerminalStatus(delivery, next, request);
            delivery.setStatus(next);
            if (next == ExchangeDeliveryStatus.PREPARING) {
                delivery.setShippedAt(null);
                delivery.setDeliveredAt(null);
                delivery.setReturnedAt(null);
                delivery.setCancelledAt(null);
            }
            if (next == ExchangeDeliveryStatus.SHIPPING) {
                delivery.setShippedAt(LocalDateTime.now());
            }
            if (next == ExchangeDeliveryStatus.DELIVERED) {
                delivery.setDeliveredAt(LocalDateTime.now());
            }
            if (next == ExchangeDeliveryStatus.RETURNED_TO_SHOP) {
                delivery.setReturnedAt(LocalDateTime.now());
            }
            if (next == ExchangeDeliveryStatus.CANCELLED || next == ExchangeDeliveryStatus.CANCELED_BY_DAMAGED) {
                delivery.setCancelledAt(LocalDateTime.now());
            }
            ExchangeDeliveryLog log = saveLog(delivery, previous, next, request);
            saveEvidenceImages(log, evidenceFiles);
        }
        return toResponse(repository.save(delivery));
    }

    private void validateTransitionPayload(UpdateExchangeDeliveryRequest request, List<MultipartFile> images) {
        ExchangeDeliveryStatus next = request.getStatus();
        if (EVIDENCE_REQUIRED.contains(next)) {
            if (request.getNote() == null || request.getNote().isBlank()) {
                throw new BadRequestException("Vui lòng nhập lý do khi cập nhật trạng thái sự cố giao hàng");
            }
            if (images.isEmpty()) {
                throw new BadRequestException("Vui lòng tải lên ít nhất một ảnh bằng chứng");
            }
        }
    }

    private void handleInventoryForTerminalStatus(ExchangeDelivery delivery,
                                                   ExchangeDeliveryStatus next,
                                                   UpdateExchangeDeliveryRequest request) {
        if (Boolean.TRUE.equals(delivery.getInventoryRestored())) {
            return;
        }
        if (next != ExchangeDeliveryStatus.CANCELLED
                && next != ExchangeDeliveryStatus.RETURNED_TO_SHOP
                && next != ExchangeDeliveryStatus.CANCELED_BY_DAMAGED) {
            return;
        }

        Map<Long, Integer> exchangeQuantity = delivery.getReturnRequest().getExchangeItems().stream()
                .filter(item -> item.getNewVariant() != null)
                .collect(Collectors.toMap(item -> item.getNewVariant().getVariantId(),
                        item -> item.getNewQuantity() == null ? 0 : item.getNewQuantity(), Integer::sum));
        Map<Long, Integer> damagedQuantity = new HashMap<>();
        if (next == ExchangeDeliveryStatus.CANCELED_BY_DAMAGED) {
            if (request.getDamagedItems() == null || request.getDamagedItems().isEmpty()) {
                throw new BadRequestException("Phải khai báo số lượng hàng hỏng cho từng sản phẩm giao đổi");
            }
            request.getDamagedItems().forEach(item -> {
                if (damagedQuantity.putIfAbsent(item.getVariantId(), item.getDamagedQuantity()) != null) {
                    throw new BadRequestException("Sản phẩm hỏng bị khai báo trùng: " + item.getVariantId());
                }
            });
            if (!exchangeQuantity.keySet().equals(damagedQuantity.keySet())) {
                throw new BadRequestException("Danh sách hàng hỏng phải gồm đầy đủ sản phẩm giao đổi");
            }
            if (damagedQuantity.values().stream().mapToInt(Integer::intValue).sum() <= 0) {
                throw new BadRequestException("Tổng số lượng hàng hỏng phải lớn hơn 0");
            }
        }

        for (Map.Entry<Long, Integer> entry : exchangeQuantity.entrySet()) {
            ProductVariant variant = variantRepository.findByIdForUpdate(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể giao đổi"));
            int damaged = damagedQuantity.getOrDefault(entry.getKey(), 0);
            if (damaged < 0 || damaged > entry.getValue()) {
                throw new BadRequestException("Số lượng hàng hỏng không hợp lệ cho biến thể " + entry.getKey());
            }
            int restock = entry.getValue() - damaged;
            if (damaged > 0) {
                damageRepository.save(ExchangeDeliveryDamage.builder()
                        .exchangeDelivery(delivery)
                        .variant(variant)
                        .damagedQuantity(damaged)
                        .build());
            }
            if (restock > 0) {
                variant.setStockQuantity(variant.getStockQuantity() + restock);
                variantRepository.save(variant);
            }
        }
        delivery.setInventoryRestored(true);
    }

    private boolean isRetryableTerminalStatus(ExchangeDeliveryStatus status) {
        return status == ExchangeDeliveryStatus.RETURNED_TO_SHOP
                || status == ExchangeDeliveryStatus.CANCELLED
                || status == ExchangeDeliveryStatus.CANCELED_BY_DAMAGED;
    }

    private void allocateInventoryForRetry(ExchangeDelivery delivery) {
        if (!Boolean.TRUE.equals(delivery.getInventoryRestored())) {
            return;
        }
        Map<Long, Integer> exchangeQuantity = delivery.getReturnRequest().getExchangeItems().stream()
                .filter(item -> item.getNewVariant() != null)
                .collect(Collectors.toMap(item -> item.getNewVariant().getVariantId(),
                        item -> item.getNewQuantity() == null ? 0 : item.getNewQuantity(), Integer::sum));

        Map<Long, ProductVariant> lockedVariants = new HashMap<>();
        for (Map.Entry<Long, Integer> entry : exchangeQuantity.entrySet()) {
            ProductVariant variant = variantRepository.findByIdForUpdate(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể giao đổi"));
            if (variant.getAvailableStock() < entry.getValue()) {
                throw new BadRequestException("Không đủ tồn kho để chuẩn bị giao lại sản phẩm đổi: "
                        + variant.getProduct().getProductName());
            }
            lockedVariants.put(entry.getKey(), variant);
        }
        for (Map.Entry<Long, Integer> entry : exchangeQuantity.entrySet()) {
            ProductVariant variant = lockedVariants.get(entry.getKey());
            variant.setStockQuantity(variant.getStockQuantity() - entry.getValue());
            variantRepository.save(variant);
        }
        delivery.setInventoryRestored(false);
    }

    private ExchangeDeliveryLog saveLog(ExchangeDelivery delivery, ExchangeDeliveryStatus previous,
                                        ExchangeDeliveryStatus next, UpdateExchangeDeliveryRequest request) {
        User actor = securityUtils.getCurrentUserIdOrNull() == null ? null
                : userRepository.findById(securityUtils.getCurrentUserIdOrNull()).orElse(null);
        ExchangeDeliveryLog savedLog = logRepository.save(ExchangeDeliveryLog.builder()
                .exchangeDelivery(delivery)
                .previousStatus(previous)
                .currentStatus(next)
                .note(request.getNote() == null ? null : request.getNote().trim())
                .createdBy(actor)
                .build());
        delivery.getLogs().add(savedLog);
        return savedLog;
    }

    private List<MultipartFile> normalizeAndValidateEvidenceImages(
            ExchangeDeliveryStatus requestedStatus, List<MultipartFile> images) {
        List<MultipartFile> normalized = images == null ? List.of()
                : images.stream().filter(Objects::nonNull).filter(file -> !file.isEmpty()).toList();
        if (requestedStatus != null && EVIDENCE_REQUIRED.contains(requestedStatus) && normalized.isEmpty()) {
            throw new BadRequestException("Trạng thái này bắt buộc phải có ít nhất một ảnh bằng chứng");
        }
        if (normalized.size() > MAX_EVIDENCE_IMAGES) {
            throw new BadRequestException("Chỉ được tải lên tối đa 5 ảnh bằng chứng");
        }
        for (MultipartFile file : normalized) {
            if (file.getSize() > MAX_EVIDENCE_IMAGE_SIZE) {
                throw new BadRequestException("Mỗi ảnh bằng chứng không được vượt quá 5 MB");
            }
            String contentType = file.getContentType() == null ? ""
                    : file.getContentType().toLowerCase(Locale.ROOT);
            if (!ALLOWED_EVIDENCE_CONTENT_TYPES.contains(contentType) || !hasSupportedImageSignature(file)) {
                throw new BadRequestException("Ảnh bằng chứng chỉ hỗ trợ định dạng JPEG, PNG hoặc WebP");
            }
        }
        return normalized;
    }

    private boolean hasSupportedImageSignature(MultipartFile file) {
        try {
            byte[] header = file.getInputStream().readNBytes(12);
            boolean jpeg = header.length >= 3 && (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
            boolean png = header.length >= 8 && (header[0] & 0xFF) == 0x89
                    && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                    && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A;
            boolean webp = header.length >= 12 && header[0] == 'R' && header[1] == 'I'
                    && header[2] == 'F' && header[3] == 'F' && header[8] == 'W'
                    && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            return jpeg || png || webp;
        } catch (IOException e) {
            return false;
        }
    }

    private void saveEvidenceImages(ExchangeDeliveryLog log, List<MultipartFile> files) {
        if (files.isEmpty()) return;
        List<ImageUploadMessage> messages = new ArrayList<>();
        for (MultipartFile file : files) {
            String tempPath = localStorageService.saveTempFile(file);
            ExchangeDeliveryLogImage image = logImageRepository.save(ExchangeDeliveryLogImage.builder()
                    .log(log)
                    .imageUrl(localStorageService.getTempUrl(tempPath))
                    .build());
            log.getImages().add(image);
            messages.add(ImageUploadMessage.builder()
                    .id(image.getImageId())
                    .table("EXCHANGE_DELIVERY_LOG_IMAGE")
                    .tempFilePath(tempPath)
                    .action(ImageUploadMessage.ActionType.CREATE_EXCHANGE_DELIVERY_EVIDENCE)
                    .build());
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messages.forEach(imageUploadProducer::sendUploadMessage);
            }
        });
    }

    private ExchangeDeliveryResponse toResponse(ExchangeDelivery d) {
        var rr = d.getReturnRequest();
        var processedBy = rr.getProcessedBy();
        var customer = rr.getCustomer() != null ? rr.getCustomer() : rr.getOrder().getCustomer();
        return ExchangeDeliveryResponse.builder()
                .exchangeDeliveryId(d.getExchangeDeliveryId()).deliveryCode(d.getDeliveryCode())
                .status(d.getStatus()).fulfillmentMethod(d.getFulfillmentMethod()).returnId(rr.getReturnId()).orderId(rr.getOrder().getOrderId())
                .orderCode(rr.getOrderCode())
                .customerId(customer != null ? customer.getCustomerId() : null)
                .customerCode(customer != null ? customer.getCustomerCode() : null)
                .receiverName(d.getReceiverName()).receiverPhone(d.getReceiverPhone())
                .processedById(processedBy != null ? processedBy.getUserId() : null)
                .processedByName(processedBy == null ? null : (processedBy.getFullName() != null && !processedBy.getFullName().isBlank() ? processedBy.getFullName() : processedBy.getUsername()))
                .deliveryAddress(d.getDeliveryAddress())
                .shippingFee(d.getShippingFee()).note(d.getNote()).shippedAt(d.getShippedAt())
                .deliveredAt(d.getDeliveredAt()).returnedAt(d.getReturnedAt()).cancelledAt(d.getCancelledAt())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt())
                .items(rr.getExchangeItems().stream().map(item -> ExchangeItemResponse.builder()
                        .exchangeItemId(item.getExchangeItemId())
                        .sourceVariantId(item.getSourceVariant() == null ? null : item.getSourceVariant().getVariantId())
                        .sourceProductName(item.getSourceVariant() == null || item.getSourceVariant().getProduct() == null
                                ? null : item.getSourceVariant().getProduct().getProductName())
                        .sourceColor(item.getSourceVariant() == null ? null : item.getSourceVariant().getColor())
                        .sourceSize(item.getSourceVariant() == null ? null : item.getSourceVariant().getSize())
                        .variantId(item.getNewVariant() == null ? null : item.getNewVariant().getVariantId())
                        .productName(item.getNewProductName()).color(item.getNewColor()).size(item.getNewSize())
                        .quantity(item.getNewQuantity()).priceDifference(item.getPriceDifference()).build()).toList())
                .history(d.getLogs().stream().map(log -> {
                    User actor = log.getCreatedBy();
                    List<String> images = new ArrayList<>(log.getImages().stream()
                            .map(ExchangeDeliveryLogImage::getImageUrl).toList());
                    return ExchangeDeliveryLogResponse.builder()
                            .logId(log.getLogId()).previousStatus(log.getPreviousStatus())
                            .currentStatus(log.getCurrentStatus()).note(log.getNote()).evidenceImages(images)
                            .createdById(actor == null ? null : actor.getUserId())
                            .createdByName(actor == null ? "Hệ thống" : (actor.getFullName() == null || actor.getFullName().isBlank()
                                    ? actor.getUsername() : actor.getFullName()))
                            .createdAt(log.getCreatedAt()).build();
                }).toList())
                .build();
    }
}
