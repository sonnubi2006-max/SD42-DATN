package com.base.service.impl;

import com.base.dto.request.promotion.PromotionRequest;
import com.base.dto.response.promotion.PromotionResponse;
import com.base.entity.Category;
import com.base.entity.Product;
import com.base.entity.ProductVariant;
import com.base.entity.Promotion;
import com.base.enums.DiscountType;
import com.base.enums.PromotionStatus;
import com.base.exception.BadRequestException;
import com.base.repository.CategoryRepository;
import com.base.repository.ProductRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.PromotionRepository;
import com.base.service.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository       promotionRepository;
    private final CategoryRepository        categoryRepository;
    private final ProductRepository         productRepository;
    private final ProductVariantRepository  productVariantRepository;
    private final ModelMapper               modelMapper;

    @Override
    @Transactional
    public PromotionResponse create(PromotionRequest request) {
        validateRequest(request);

        Promotion promotion = modelMapper.map(request, Promotion.class);
        if (request.getStatus() == PromotionStatus.CANCELLED) {
            promotion.setStatus(PromotionStatus.CANCELLED);
        } else {
            promotion.setStatus(resolveStatus(request.getStartDate(), request.getEndDate()));
        }
        promotion.setCreatedAt(LocalDateTime.now());

        resolveScope(promotion, request);

        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public PromotionResponse update(Long promotionId, PromotionRequest request) {
        validateRequest(request);
        Promotion promotion = findById(promotionId);

        modelMapper.map(request, promotion);

        promotion.setDescription(request.getDescription());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());

        if (request.getStatus() == PromotionStatus.CANCELLED) {
            promotion.setStatus(PromotionStatus.CANCELLED);
        } else {
            promotion.setStatus(resolveStatus(request.getStartDate(), request.getEndDate()));
        }
        resolveScope(promotion, request);

        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public PromotionResponse cancel(Long promotionId) {
        Promotion promotion = findById(promotionId);
        if (promotion.getStatus() == PromotionStatus.ENDED) {
            throw new IllegalStateException("Chương trình đã kết thúc, không thể huỷ");
        }
        promotion.setStatus(PromotionStatus.CANCELLED);
        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional
    public PromotionResponse toggleStatus(Long promotionId) {
        Promotion promotion = findById(promotionId);
        if (promotion.getStatus() == PromotionStatus.ENDED) {
            throw new IllegalStateException("Chương trình đã kết thúc, không thể đổi trạng thái");
        }
        if (promotion.getStatus() == PromotionStatus.CANCELLED) {
            promotion.setStatus(resolveStatus(promotion.getStartDate(), promotion.getEndDate()));
        } else {
            promotion.setStatus(PromotionStatus.CANCELLED);
        }
        return toResponse(promotionRepository.save(promotion));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> getAll(String keyword, String status, String applyType, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        PromotionStatus promotionStatus = status != null && !status.isBlank()
                ? PromotionStatus.valueOf(status.toUpperCase())
                : null;
        com.base.enums.ApplyType type = applyType != null && !applyType.isBlank()
                ? com.base.enums.ApplyType.valueOf(applyType.toUpperCase())
                : null;

        boolean isStatusFiltered = promotionStatus != null;
        boolean isCancelledFilter = promotionStatus == PromotionStatus.CANCELLED;
        boolean isUpcomingFilter = promotionStatus == PromotionStatus.UPCOMING;
        boolean isActiveFilter = promotionStatus == PromotionStatus.ACTIVE;
        boolean isEndedFilter = promotionStatus == PromotionStatus.ENDED;

        return promotionRepository.filterPromotions(
                keyword,
                isStatusFiltered,
                isCancelledFilter,
                isUpcomingFilter,
                isActiveFilter,
                isEndedFilter,
                type,
                startDate,
                endDate,
                LocalDateTime.now(),
                pageable
        ).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionResponse getById(Long promotionId) {
        return toResponse(findById(promotionId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromotionResponse> getActivePromotions() {
        return promotionRepository.findActivePromotions(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Promotion findById(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Đợt giảm giá không tồn tại: " + id));
    }

    private void resolveScope(Promotion promotion, PromotionRequest request) {
        promotion.getCategories().clear();
        promotion.getProducts().clear();
        promotion.getVariants().clear();

        if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
            Set<Long> ids = new HashSet<>(request.getCategoryIds());
            List<Category> categories = categoryRepository.findAllById(ids);
            if (categories.size() != ids.size()) {
                throw new BadRequestException("Danh sách danh mục chứa ID không tồn tại");
            }
            promotion.getCategories().addAll(categories);
        }

        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            Set<Long> ids = new HashSet<>(request.getProductIds());
            List<Product> products = productRepository.findAllById(ids);
            if (products.size() != ids.size()) {
                throw new BadRequestException("Danh sách sản phẩm chứa ID không tồn tại");
            }
            promotion.getProducts().addAll(products);
        }

        if (request.getVariantIds() != null && !request.getVariantIds().isEmpty()) {
            Set<Long> ids = new HashSet<>(request.getVariantIds());
            List<ProductVariant> variants = productVariantRepository.findAllById(ids);
            if (variants.size() != ids.size()) {
                throw new BadRequestException("Danh sách biến thể chứa ID không tồn tại");
            }
            promotion.getVariants().addAll(variants);
        }
    }

    private PromotionStatus resolveStatus(LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime now = LocalDateTime.now();
        if (endDate != null && now.isAfter(endDate)) {
            return PromotionStatus.ENDED;
        }
        if (startDate != null && now.isBefore(startDate)) {
            return PromotionStatus.UPCOMING;
        }
        return PromotionStatus.ACTIVE;
    }

    private void validateRequest(PromotionRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu chương trình khuyến mãi không được để trống");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new BadRequestException("Ngày bắt đầu và ngày kết thúc không được để trống");
        }
        if (!request.getStartDate().isBefore(request.getEndDate())) {
            throw new BadRequestException("Ngày bắt đầu phải trước ngày kết thúc");
        }
        if (request.getDiscountType() != DiscountType.PERCENTAGE) {
            throw new BadRequestException("Chương trình khuyến mãi chỉ áp dụng loại giảm giá theo phần trăm (%)");
        }
        if (request.getDiscountValue() == null
                || request.getDiscountValue().compareTo(java.math.BigDecimal.valueOf(100)) > 0
                || request.getDiscountValue().signum() <= 0) {
            throw new BadRequestException("Phần trăm giảm phải lớn hơn 0% và không vượt quá 100%");
        }
        if (request.getMaxDiscountAmount() != null && request.getMaxDiscountAmount().signum() <= 0) {
            throw new BadRequestException("Giới hạn giảm tối đa phải lớn hơn 0");
        }
        if (request.getApplyType() == null) {
            throw new BadRequestException("Loại áp dụng không được để trống");
        }
        if (request.getApplyType() == com.base.enums.ApplyType.ORDER) {
            throw new BadRequestException("Chương trình khuyến mãi không thể áp dụng cho toàn bộ đơn hàng (chỉ áp dụng sản phẩm/danh mục/biến thể)");
        }

        boolean hasCategories = request.getCategoryIds() != null && !request.getCategoryIds().isEmpty();
        boolean hasProducts = request.getProductIds() != null && !request.getProductIds().isEmpty();
        boolean hasVariants = request.getVariantIds() != null && !request.getVariantIds().isEmpty();

        switch (request.getApplyType()) {
            case CATEGORY -> {
                if (!hasCategories) {
                    throw new BadRequestException("Khuyến mãi theo danh mục phải chọn ít nhất một danh mục");
                }
            }
            case PRODUCT -> {
                if (!hasProducts) {
                    throw new BadRequestException("Khuyến mãi theo sản phẩm phải chọn ít nhất một sản phẩm");
                }
            }
            case VARIANT -> {
                if (!hasVariants) {
                    throw new BadRequestException("Khuyến mãi theo biến thể phải chọn ít nhất một biến thể");
                }
            }
            default -> throw new BadRequestException("Loại áp dụng khuyến mãi không hợp lệ");
        }
    }

    private PromotionResponse toResponse(Promotion promotion) {
        PromotionResponse response = modelMapper.map(promotion, PromotionResponse.class);

        if (promotion.getStatus() != PromotionStatus.CANCELLED) {
            LocalDateTime now = LocalDateTime.now();
            if (promotion.getEndDate() != null && now.isAfter(promotion.getEndDate())) {
                response.setStatus(PromotionStatus.ENDED);
            } else if (promotion.getStartDate() != null && now.isBefore(promotion.getStartDate())) {
                response.setStatus(PromotionStatus.UPCOMING);
            } else {
                response.setStatus(PromotionStatus.ACTIVE);
            }
        }

        response.setActive(promotion.isActive());
        response.setCategoryIds(
                promotion.getCategories().stream()
                        .map(Category::getCategoryId)
                        .collect(Collectors.toList())
        );
        response.setProductIds(
                promotion.getProducts().stream()
                        .map(Product::getProductId)
                        .collect(Collectors.toList())
        );
        response.setVariantIds(
                promotion.getVariants().stream()
                        .map(ProductVariant::getVariantId)
                        .collect(Collectors.toList())
        );
        return response;
    }
}
