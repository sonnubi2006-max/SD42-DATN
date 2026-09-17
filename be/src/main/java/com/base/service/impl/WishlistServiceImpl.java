package com.base.service.impl;

import com.base.dto.response.product.TopWishlistProductResponse;
import com.base.dto.response.wishlist.WishlistResponse;
import com.base.entity.*;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.CustomerRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.UserRepository;
import com.base.repository.WishlistRepository;
import com.base.repository.PromotionRepository;
import com.base.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistServiceImpl implements WishlistService {
    private final WishlistRepository wishlistRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PromotionRepository promotionRepository;

    @Override
    public WishlistResponse addToWishlist(Long userId, Long variantId) {

        Customer user = customerRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", "id", userId));

        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("ProductVariant", "id", variantId));

        if (wishlistRepository.existsByCustomer_CustomerIdAndVariant_VariantId(userId, variantId)) {
            throw new ResourceAlreadyExistsException("Sản phẩm đã có trong danh sách yêu thích");
        }

        Wishlist wishlist = Wishlist.builder()
                .customer(user)
                .variant(variant)
                .build();

        wishlist = wishlistRepository.save(wishlist);

        return convertToDto(wishlist);
    }

    @Override
    public void removeFromWishlist(Long userId, Long variantId) {

        if (!wishlistRepository.existsByCustomer_CustomerIdAndVariant_VariantId(userId, variantId)) {
            throw new ResourceNotFoundException(
                    "Sản phẩm yêu thích", "mã biến thể", variantId
            );
        }

        wishlistRepository.deleteByCustomer_CustomerIdAndVariant_VariantId(
                userId,
                variantId
        );
    }

    @Override
    public boolean toggleWishlist(Long userId, Long variantId) {

        boolean exists = wishlistRepository
                .existsByCustomer_CustomerIdAndVariant_VariantId(
                        userId,
                        variantId
                );

        if (exists) {

            wishlistRepository.deleteByCustomer_CustomerIdAndVariant_VariantId(
                    userId,
                    variantId
            );

            return false;
        }

        addToWishlist(userId, variantId);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsInWishlist(Long userId, Long variantId) {

        return wishlistRepository
                .existsByCustomer_CustomerIdAndVariant_VariantId(
                        userId,
                        variantId
                );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WishlistResponse> getUserWishlist(
            Long userId,
            String keyword,
            Pageable pageable
    ) {

        return wishlistRepository
                .findWishlistByUserAndKeyword(userId, keyword, pageable)
                .map(this::convertToDto);
    }

    @Override
    @Transactional(readOnly = true)
    public long countWishlist(Long userId) {
        return wishlistRepository.countByCustomerCustomerId(userId);
    }

    @Override
    public void clearWishlist(Long userId) {
        wishlistRepository.deleteAllByCustomer_CustomerId(userId);
    }

    public WishlistResponse convertToDto(Wishlist wishlist) {
        if (wishlist == null) return null;

        WishlistResponse response = new WishlistResponse();
        response.setWishlistId(wishlist.getWishlistId());
        response.setCreatedAt(wishlist.getCreatedAt());

        ProductVariant variant = wishlist.getVariant();
        if (variant != null) {
            response.setVariantId(variant.getVariantId());
            response.setColor(variant.getColor());
            response.setSize(variant.getSize());
            response.setPrice(variant.getPrice());
            response.setStockQuantity(variant.getStockQuantity());
            response.setVariantStatus(variant.getStatus() != null ? variant.getStatus().name() : null);

            if (variant.getProduct() != null) {
                response.setProductId(variant.getProduct().getProductId());
                response.setProductName(variant.getProduct().getProductName());
                response.setProductCode(variant.getProduct().getProductCode());
                response.setProductSlug(variant.getProduct().getProductSlug());
                response.setProductStatus(variant.getProduct().getStatus() != null ? variant.getProduct().getStatus().name() : null);
            }

            if (variant.getImage() != null) {
                String defaultImageUrl = variant.getImage().getImageUrl();
                response.setImageUrl(defaultImageUrl);
            }

            BigDecimal originalPrice = variant.getPrice();
            BigDecimal salePrice = originalPrice;
            Integer discountPercentage = 0;

            List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
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
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopWishlistProductResponse> getTopWishlistProducts(
            Integer limit
    ) {

        return wishlistRepository
                .getTopWishlistProducts()
                .stream()
                .limit(limit)
                .map(item ->
                        TopWishlistProductResponse.builder()
                                .productId(item.getProductId())
                                .productName(item.getProductName())
                                .wishlistCount(item.getWishlistCount())
                                .build()
                )
                .toList();
    }
}
