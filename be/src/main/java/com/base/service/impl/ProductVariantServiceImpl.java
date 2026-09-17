package com.base.service.impl;

import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.ImageUploadProductMessage;
import com.base.dto.request.product.ProductVariantRequest;
import com.base.dto.response.product.ProductImageResponse;
import com.base.dto.response.product.ProductVariantResponse;
import com.base.dto.response.product.VariantDamageResponse;
import com.base.entity.Product;
import com.base.entity.ProductImage;
import com.base.entity.ProductVariant;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.ProductImageRepository;
import com.base.repository.ProductRepository;
import com.base.repository.ProductVariantRepository;
import com.base.service.ProductVariantService;
import com.base.utils.BarcodeGenerator;
import com.base.utils.SkuGenerator;
import com.base.utils.QrCodeGenerator;
import com.base.repository.PromotionRepository;
import com.base.repository.ReservationRepository;
import com.base.repository.OrderDetailRepository;
import com.base.repository.ReturnItemRepository;
import com.base.repository.ExchangeDeliveryDamageRepository;
import com.base.entity.Promotion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ProductVariantServiceImpl implements ProductVariantService {

    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository   imageRepository;
    private final ProductRepository        productRepository;
    private final LocalStorageService      localStorageService;
    private final ImageUploadProducer      imageUploadProducer;
    private final SkuGenerator             skuGenerator;
    private final BarcodeGenerator         barcodeGenerator;
    private final QrCodeGenerator          qrCodeGenerator;
    private final PromotionRepository      promotionRepository;
    private final ReservationRepository    reservationRepository;
    private final OrderDetailRepository    orderDetailRepository;
    private final ReturnItemRepository     returnItemRepository;
    private final ExchangeDeliveryDamageRepository exchangeDeliveryDamageRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional
    public ProductVariantResponse addVariant(Long productId,
                                             ProductVariantRequest request,
                                             MultipartFile file) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BadRequestException(
                        "Product không tồn tại: " + productId));

        return toResponse(persistVariant(product, request, file));
    }

    @Override
    @Transactional
    public List<ProductVariantResponse> addVariantsBulk(Long productId,
                                                        List<ProductVariantRequest> requests,
                                                        List<MultipartFile> files) {
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Danh sách biến thể trống");
        }
        if (files == null || files.size() != requests.size()) {
            throw new BadRequestException(
                    "Số lượng ảnh không khớp số biến thể: " + requests.size()
                            + " biến thể nhưng " + (files == null ? 0 : files.size()) + " ảnh");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sản phẩm không tồn tại: " + productId));

        Set<String> batchKeys = new HashSet<>();
        List<ProductVariantResponse> result = new ArrayList<>(requests.size());

        for (int i = 0; i < requests.size(); i++) {
            ProductVariantRequest req = requests.get(i);
            String key = (nullToEmpty(req.getColor()) + "|" + nullToEmpty(req.getSize()))
                    .toLowerCase();
            if (!batchKeys.add(key)) {
                throw new BadRequestException("Trùng biến thể trong danh sách: "
                        + req.getColor() + " - " + req.getSize());
            }
            result.add(toResponse(persistVariant(product, req, files.get(i))));
        }

        log.info("Thêm bulk {} variant thành công cho productId={}", result.size(), productId);
        return result;
    }

    private ProductVariant persistVariant(Product product,
                                          ProductVariantRequest request,
                                          MultipartFile file) {
        validateImageFile(file);

        if (variantRepository.existsByProduct_ProductIdAndSizeIgnoreCaseAndColorIgnoreCase(
                product.getProductId(), request.getSize(), request.getColor())) {
            throw new BadRequestException("Đã tồn tại biến thể: "
                    + request.getColor() + " - " + request.getSize());
        }

        String variantCode  = skuGenerator.generate(
                    product.getProductCode(),
                    request.getColor(),
                    request.getSize(),
                    variantRepository::existsByVariantCode);

        validatePrices(request);

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .variantCode(variantCode)
                .size(request.getSize())
                .color(request.getColor())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .status(resolveStatus(request))
                .build();

        ProductVariant saved = variantRepository.save(variant);

        if (saved.getBarcode() == null || saved.getBarcode().isBlank()) {
            saved.setBarcode(barcodeGenerator.generateEan13(saved.getVariantId()));
        }

        saved = uploadImage(file, saved);

        log.info("Thêm variant thành công: variantCode={} barcode={} productId={}",
                saved.getVariantCode(), saved.getBarcode(), product.getProductId());
        return saved;
    }

    private ProductVariantStatus resolveStatus(ProductVariantRequest request) {
        if (request.getStatus() != null) {
            return request.getStatus();
        }
        int stock = request.getStockQuantity() != null ? request.getStockQuantity() : 0;
        return stock > 0 ? ProductVariantStatus.ACTIVE : ProductVariantStatus.INACTIVE;
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductVariantResponse findByBarcode(String barcode) {
        String normalizedCode = barcode == null ? "" : barcode.trim();
        ProductVariant variant = variantRepository.findByBarcode(normalizedCode)
                .or(() -> variantRepository.findByVariantCode(normalizedCode))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy biến thể với mã: " + normalizedCode));
        return toResponse(variant);
    }

    @Override
    @Transactional
    public byte[] generateVariantQrCode(Long variantId) {
        ProductVariant variant = findVariantById(variantId);
        if (variant.getBarcode() == null || variant.getBarcode().isBlank()) {
            variant.setBarcode(barcodeGenerator.generateEan13(variant.getVariantId()));
            variantRepository.save(variant);
        }
        return qrCodeGenerator.generatePng(variant.getBarcode());
    }

    @Override
    @Transactional
    public ProductVariantResponse updateVariant(Long variantId,
                                                ProductVariantRequest request,
                                                MultipartFile file) {
        ProductVariant variant = findVariantById(variantId);

        variant.setPrice(request.getPrice());
        validatePrices(request);

        if (request.getStockQuantity() != null ) {
            if (request.getStockQuantity() < 0) {
                throw new BadRequestException("Tồn kho không được âm");
            }
            variant.setStockQuantity(request.getStockQuantity());
        }

        if (request.getStatus() != null) {
            variant.setStatus(request.getStatus());
        }

        variant = variantRepository.save(variant);

        if (file != null && !file.isEmpty()) {
            validateImageFile(file);

            variant = updateImage(file, variant);
        }

        log.info("Cập nhật variant thành công: variantId={}", variantId);
        return toResponse(variant);
    }

    @Override
    @Transactional
    public void deleteVariant(Long variantId) {
        ProductVariant variant = findVariantById(variantId);
        variant.setStatus(ProductVariantStatus.INACTIVE);
        variantRepository.save(variant);
        log.info("Xóa variant thành công: variantId={}", variantId);
    }

    @Override
    @Transactional
    public void restoreProduct(Long variantId) {
        ProductVariant variant = findVariantById(variantId);

        if (!variant.getStatus().name().equals("INACTIVE")) {
            throw new BadRequestException("Sản phẩm chưa bị xóa: " + variantId);
        }

        variant.setStatus(ProductVariantStatus.ACTIVE);
        variantRepository.save(variant);
        log.info("Restored product id={}", variantId);
    }

    @Override
    public Page<ProductVariantResponse> filterProductVariants(String keyword, Long productId, BigDecimal minPrice, BigDecimal maxPrice, ProductVariantStatus status, Pageable pageable) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return variantRepository.filterProductVariants(productId,minPrice,maxPrice,status,keyword,pageable)
                .map(v -> toResponse(v, activePromotions));
    }

    @Override
    public ProductVariantResponse findById(Long variantId) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return variantRepository.findById(variantId)
                .map(v -> toResponse(v, activePromotions))
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại!"));
    }

    @Override
    @Transactional(readOnly = true)
    public VariantDamageResponse getDamageHistory(Long variantId, String keyword, String source,
                                                  LocalDateTime fromDate, LocalDateTime toDate,
                                                  int page, int size) {
        if (page < 0) throw new BadRequestException("Trang không được nhỏ hơn 0");
        if (size < 1 || size > 100) {
            throw new BadRequestException("Số bản ghi mỗi trang phải từ 1 đến 100");
        }
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BadRequestException("Ngày bắt đầu không được sau ngày kết thúc");
        }

        String normalizedKeyword = keyword == null || keyword.isBlank()
                ? null : keyword.trim().toLowerCase(java.util.Locale.ROOT);
        String normalizedSource = source == null || source.isBlank()
                ? null : source.trim().toUpperCase(java.util.Locale.ROOT);
        if (normalizedSource != null
                && !Set.of("ORDER_DELIVERY", "EXCHANGE_RETURN", "EXCHANGE_DELIVERY")
                        .contains(normalizedSource)) {
            throw new BadRequestException("Nguồn ghi nhận hàng hỏng không hợp lệ");
        }

        ProductVariant variant = findVariantById(variantId);
        List<VariantDamageResponse.DamageRecord> records = new ArrayList<>();

        orderDetailRepository.findDamagedByVariantId(variantId).forEach(detail ->
                records.add(VariantDamageResponse.DamageRecord.builder()
                        .source("ORDER_DELIVERY")
                        .sourceId(detail.getOrderDetailId())
                        .orderId(detail.getOrder().getOrderId())
                        .orderCode(detail.getOrder().getOrderCode())
                        .damagedQuantity(detail.getDamagedQuantity())
                        .recordedAt(detail.getOrder().getUpdatedAt())
                        .build()));

        returnItemRepository.findCompletedDamagedByVariantId(variantId).forEach(item ->
                records.add(VariantDamageResponse.DamageRecord.builder()
                        .source("EXCHANGE_RETURN")
                        .sourceId(item.getReturnRequest().getReturnId())
                        .orderId(item.getReturnRequest().getOrder().getOrderId())
                        .orderCode(item.getReturnRequest().getOrderCode())
                        .damagedQuantity(item.getDamagedQuantity())
                        .recordedAt(item.getReturnRequest().getUpdatedAt())
                        .build()));

        exchangeDeliveryDamageRepository.findByVariantIdWithDelivery(variantId).forEach(damage -> {
            var delivery = damage.getExchangeDelivery();
            var returnRequest = delivery.getReturnRequest();
            records.add(VariantDamageResponse.DamageRecord.builder()
                    .source("EXCHANGE_DELIVERY")
                    .sourceId(delivery.getExchangeDeliveryId())
                    .orderId(returnRequest.getOrder().getOrderId())
                    .orderCode(returnRequest.getOrderCode())
                    .damagedQuantity(damage.getDamagedQuantity())
                    .recordedAt(damage.getCreatedAt())
                    .build());
        });

        records.sort(java.util.Comparator.comparing(
                VariantDamageResponse.DamageRecord::getRecordedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())));
        int total = records.stream().mapToInt(r -> r.getDamagedQuantity() == null ? 0 : r.getDamagedQuantity()).sum();

        List<VariantDamageResponse.DamageRecord> filteredRecords = records.stream()
                .filter(record -> normalizedKeyword == null
                        || (record.getOrderCode() != null
                        && record.getOrderCode().toLowerCase(java.util.Locale.ROOT).contains(normalizedKeyword)))
                .filter(record -> normalizedSource == null || normalizedSource.equals(record.getSource()))
                .filter(record -> fromDate == null
                        || (record.getRecordedAt() != null && !record.getRecordedAt().isBefore(fromDate)))
                .filter(record -> toDate == null
                        || (record.getRecordedAt() != null && !record.getRecordedAt().isAfter(toDate)))
                .toList();

        int filteredTotal = filteredRecords.stream()
                .mapToInt(record -> record.getDamagedQuantity() == null ? 0 : record.getDamagedQuantity())
                .sum();
        int totalPages = (filteredRecords.size() + size - 1) / size;
        int fromIndex = (int) Math.min((long) page * size, filteredRecords.size());
        int toIndex = Math.min(fromIndex + size, filteredRecords.size());
        List<VariantDamageResponse.DamageRecord> pageRecords =
                new ArrayList<>(filteredRecords.subList(fromIndex, toIndex));

        return VariantDamageResponse.builder()
                .variantId(variantId)
                .variantCode(variant.getVariantCode())
                .totalDamagedQuantity(total)
                .filteredDamagedQuantity(filteredTotal)
                .totalElements((long) filteredRecords.size())
                .totalPages(totalPages)
                .page(page)
                .size(size)
                .first(page == 0)
                .last(totalPages == 0 || page >= totalPages - 1)
                .records(pageRecords)
                .build();
    }

    @Override
    @Transactional
    public void bulkDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;

        List<ProductVariant> products = variantRepository.findAllById(ids)
                .stream()
                .toList();

        products.forEach(p -> p.setStatus(ProductVariantStatus.INACTIVE));
        variantRepository.saveAll(products);
        log.info("Bulk soft-deleted {} products", products.size());
    }

    @Override
    @Transactional
    public void bulkUpdateStatus(List<Long> ids, ProductVariantStatus status) {
        if (ids == null || ids.isEmpty()) {
            throw new BadRequestException("Danh sách mã biến thể không được để trống");
        }
        if (status == null) {
            throw new BadRequestException("Trạng thái biến thể không được để trống");
        }

        Set<Long> uniqueIds = new HashSet<>(ids);
        if (uniqueIds.size() != ids.size()) {
            throw new BadRequestException("Danh sách mã biến thể không được chứa giá trị trùng lặp");
        }

        List<ProductVariant> products = variantRepository.findAllById(uniqueIds)
                .stream()
                .toList();

        Set<Long> foundIds = products.stream()
                .map(ProductVariant::getVariantId)
                .collect(Collectors.toSet());
        Set<Long> missingIds = new HashSet<>(uniqueIds);
        missingIds.removeAll(foundIds);
        if (!missingIds.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy biến thể: " + missingIds);
        }

        products.forEach(p -> p.setStatus(status));
        variantRepository.saveAll(products);
        log.info("Bulk updated status={} for {} products", status, products.size());
    }

    @Override
    public ProductVariantResponse updateVariantStatus(Long variantId, ProductVariantStatus status) {
        ProductVariant variant = findVariantById(variantId);

        variant.setStatus(status);

        return toResponse(variantRepository.save(variant));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getVariantsByProduct(Long productId) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return variantRepository.findByProduct_ProductId(productId)
                .stream()
                .map(v -> toResponse(v, activePromotions))
                .toList();
    }

    private ProductVariant findVariantById(Long id) {
        return variantRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Biến thể không tồn tại: " + id));
    }

    private ProductVariant updateImage(MultipartFile file, ProductVariant variant) {
        ProductImage image = imageRepository.findById(variant.getImage().getImageId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ảnh không tồn tại: " + variant.getImage().getImageId()));

        String tempPath = localStorageService.saveTempFile(file);
        String tempUrl  = localStorageService.getTempUrl(tempPath);

        if (tempUrl == null || tempUrl.isBlank()) {
            throw new IllegalStateException("Không thể lấy URL file tạm");
        }

        imageUploadProducer.sendUploadMessage(
                ImageUploadMessage.builder()
                        .id(image.getImageId())
                        .table("PRODUCT")
                        .tempFilePath(tempPath)
                        .action(ImageUploadMessage.ActionType.DELETE_PRODUCT)
                        .build()
        );

        image.setImageUrl(tempUrl);

        image = imageRepository.saveAndFlush(image);

        imageUploadProducer.sendUploadMessage(
                ImageUploadMessage.builder()
                        .id(image.getImageId())
                        .table("PRODUCT")
                        .tempFilePath(tempPath)
                        .action(ImageUploadMessage.ActionType.CREATE_PRODUCT)
                        .build()
        );

        variant.setImage(image);

        return variant;
    }

    private ProductVariant uploadImage(MultipartFile file, ProductVariant variant) {
        String tempPath = localStorageService.saveTempFile(file);
        String tempUrl  = localStorageService.getTempUrl(tempPath);

        if (tempUrl == null || tempUrl.isBlank()) {
            throw new IllegalStateException("Không thể lấy URL file tạm");
        }

        ProductImage image = ProductImage.builder()
                .variant(variant)
                .imageUrl(tempUrl)
                .thumbnail(true)
                .build();

        image = imageRepository.saveAndFlush(image);

        imageUploadProducer.sendUploadMessage(
                ImageUploadMessage.builder()
                        .id(image.getImageId())
                        .table("PRODUCT")
                        .tempFilePath(tempPath)
                        .action(ImageUploadMessage.ActionType.CREATE_PRODUCT)
                        .build()
        );

        variant.setImage(image);
        return variant;
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File ảnh không được để trống");
        }

        long maxSize = 5 * 1024 * 1024L; 
        if (file.getSize() > maxSize) {
            throw new BadRequestException(
                    String.format("File không được vượt quá 5MB. Hiện tại: %.2fMB",
                            file.getSize() / (1024.0 * 1024.0)));
        }

        List<String> allowedTypes = List.of(
                "image/jpeg", "image/png", "image/webp",
                "image/gif", "image/avif", "image/bmp");
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new BadRequestException(
                    "Định dạng không hợp lệ. Chỉ chấp nhận: JPG, JPEG, PNG, WEBP, GIF, AVIF, BMP");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            throw new BadRequestException("Tên file không hợp lệ");
        }

        List<String> allowedExtensions = List.of(
                ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".bmp");
        String lower = filename.toLowerCase();
        boolean validExt = allowedExtensions.stream().anyMatch(lower::endsWith);
        if (!validExt) {
            throw new BadRequestException(
                    "Extension không hợp lệ. Chỉ chấp nhận: .jpg, .jpeg, .png, .webp, .gif, .avif, .bmp");
        }
    }

    private ProductVariantResponse toResponse(ProductVariant variant) {
        return toResponse(variant, promotionRepository.findActivePromotions(LocalDateTime.now()));
    }

    private ProductVariantResponse toResponse(ProductVariant variant, List<Promotion> activePromotions) {
        ProductVariantResponse response = modelMapper.map(variant, ProductVariantResponse.class);
        int activePosReservations = reservationRepository
                .sumActivePosQuantityByVariantId(variant.getVariantId());
        int activeOnlineReservations = reservationRepository
                .sumActiveOnlineQuantityByVariantId(variant.getVariantId());
        int deductedReservations = variant.getReservedQuantity() != null
                ? variant.getReservedQuantity() : 0;
        int posSellableStock = Math.max(
                0,
                variant.getAvailableStock()
                        + deductedReservations
                        - activePosReservations);
        response.setStockQuantity(posSellableStock);
        response.setAvailableStock(Math.max(
                0, posSellableStock - activeOnlineReservations));
        long orderDamaged = java.util.Optional.ofNullable(
                orderDetailRepository.sumDamagedQuantityByVariantId(variant.getVariantId())).orElse(0L);
        long returnDamaged = java.util.Optional.ofNullable(
                returnItemRepository.sumCompletedDamagedQuantityByVariantId(variant.getVariantId())).orElse(0L);
        long exchangeDeliveryDamaged = java.util.Optional.ofNullable(
                exchangeDeliveryDamageRepository.sumDamagedQuantityByVariantId(variant.getVariantId())).orElse(0L);
        response.setDamagedQuantity(Math.toIntExact(
                orderDamaged + returnDamaged + exchangeDeliveryDamaged));

        if (variant.getProduct() != null) {
            response.setProductId(variant.getProduct().getProductId());
            response.setProductName(variant.getProduct().getProductName());
            response.setProductCode(variant.getProduct().getProductCode());
        }

        if (variant.getImage() != null) {
            response.setImage(toImageResponse(variant.getImage()));
        }

        BigDecimal originalPrice = variant.getPrice();
        BigDecimal salePrice = originalPrice;
        Integer discountPercentage = 0;

        if (activePromotions != null && !activePromotions.isEmpty() && originalPrice != null) {
            Promotion bestPromo = null;
            BigDecimal bestPrice = originalPrice;

            for (Promotion p : activePromotions) {
                Long categoryId = (variant.getProduct() != null && variant.getProduct().getCategory() != null)
                        ? variant.getProduct().getCategory().getCategoryId()
                        : null;
                Long productId = variant.getProduct() != null ? variant.getProduct().getProductId() : null;

                if (p.appliesToVariant(variant.getVariantId(), productId, categoryId)) {
                    BigDecimal promoPrice;
                    if (p.isPercentage()) {
                        BigDecimal discount = originalPrice.multiply(p.getDiscountValue())
                                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                        if (p.getMaxDiscountAmount() != null) {
                            discount = discount.min(p.getMaxDiscountAmount());
                        }
                        promoPrice = originalPrice.subtract(discount).max(BigDecimal.ZERO);
                    } else {
                        promoPrice = originalPrice.subtract(p.getDiscountValue()).max(BigDecimal.ZERO);
                    }

                    if (promoPrice.compareTo(bestPrice) < 0) {
                        bestPrice = promoPrice;
                        bestPromo = p;
                    }
                }
            }

            if (bestPromo != null) {
                salePrice = bestPrice;
                if (originalPrice.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal discountAmt = originalPrice.subtract(salePrice);
                    discountPercentage = discountAmt.multiply(BigDecimal.valueOf(100))
                            .divide(originalPrice, 0, RoundingMode.HALF_UP)
                            .intValue();
                }
            }
        }

        response.setSalePrice(salePrice);
        response.setDiscountPercentage(discountPercentage);

        return response;
    }

    private ProductImageResponse toImageResponse(ProductImage image) {
        ProductImageResponse res = new ProductImageResponse();
        res.setImageId(image.getImageId());
        res.setImageUrl(image.getImageUrl());
        res.setThumbnail(image.isThumbnail());
        return res;
    }

    private void validatePrices(ProductVariantRequest request) {
        if (request.getPrice() == null || request.getPrice().signum() < 0) {
            throw new BadRequestException("Giá bán không hợp lệ");
        }

        if (request.getStockQuantity() != null && request.getStockQuantity() < 0) {
            throw new BadRequestException("Tồn kho không được âm");
        }
    }
}
