package com.base.service.impl;

import com.base.dto.request.cart.CartItemRequest;
import com.base.dto.response.cart.*;
import com.base.entity.*;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ForbiddenException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.*;
import com.base.service.CartService;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CartRepository cartRepository;
    private final PromotionRepository promotionRepository;
    private final ReservationRepository reservationRepository;
    private final ModelMapper modelMapper;
    private final SecurityUtils securityUtils;

    @Override
    public CartResponse getMyCart() {
        Long userId = securityUtils.getCurrentUserId();

        Cart cart = cartRepository.findByCustomer_CustomerId(userId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giỏ hàng!"));

        List<Promotion> activePromotions = promotionRepository
                .findActivePromotions(java.time.LocalDateTime.now());
        List<CartItemResponse> cartItems = cart.getItems().stream()
                .map(cartItem -> {
                    BigDecimal currentPrice = getEffectivePrice(
                            cartItem.getVariant(), activePromotions);
                    if (cartItem.getPrice() == null
                            || cartItem.getPrice().compareTo(currentPrice) != 0) {
                        cartItem.setPrice(currentPrice);
                    }
                    return toResponse(cartItem, activePromotions);
                })
                .collect(Collectors.toList());

        CartResponse cartResponse = new CartResponse();
        cartResponse.setCartId(cart.getCartId());
        cartResponse.setItems(cartItems);
        return cartResponse;
    }

    @Override
    public CartItemResponse addToCart(CartItemRequest cartItemRequest) {
        Long userId = securityUtils.getCurrentUserId();

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ProductVariant variant = productVariantRepository
                .findByVariantIdAndStatusAndProduct_Status(
                        cartItemRequest.getVariantId(),
                        ProductVariantStatus.ACTIVE,
                        ProductStatus.ACTIVE
                )
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không còn bán!"));

        int onlineAvailableStock = getOnlineAvailableStock(variant);
        if (onlineAvailableStock <= 0) {
            throw new BadRequestException("Sản phẩm hiện không có sẵn!");
        }

        if (cartItemRequest.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }

        Cart cart = cartRepository.findByCustomer_CustomerId(userId)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder().customer(customer).build()
                ));

        CartItem cartItem = cartItemRepository
                .findByCart_CartIdAndVariant_VariantId(cart.getCartId(), variant.getVariantId())
                .orElse(null);

        List<Promotion> activePromotions = promotionRepository.findActivePromotions(java.time.LocalDateTime.now());
        BigDecimal currentPrice = getEffectivePrice(variant, activePromotions);

        if (cartItem != null) {
            int newQuantity = cartItem.getQuantity() + cartItemRequest.getQuantity();

            if (newQuantity > onlineAvailableStock) {
                throw new BadRequestException(
                        "Số lượng vượt quá tồn kho. Hiện còn " + onlineAvailableStock
                );
            }

            cartItem.setQuantity(newQuantity);
            cartItem.setPrice(currentPrice);

        } else {
            if (cartItemRequest.getQuantity() > onlineAvailableStock) {
                throw new BadRequestException(
                        "Số lượng vượt quá tồn kho. Hiện còn " + onlineAvailableStock
                );
            }

            cartItem = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(cartItemRequest.getQuantity())
                    .price(currentPrice)
                    .build();
        }

        cartItem = cartItemRepository.save(cartItem);

        return toResponse(cartItem);
    }

    @Override
    public CartItemResponse updateQuantity(CartItemRequest request) {
        Long userId = securityUtils.getCurrentUserId();

        Cart cart = cartRepository.findByCustomer_CustomerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giỏ hàng"));

        CartItem cartItem = cartItemRepository
                .findByCartAndVariantForUpdate(cart.getCartId(), request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng"));

        ProductVariant variant = loadAvailableVariantForUpdate(request.getVariantId());
        cartItem.setVariant(variant);

        if (request.getQuantity() <= 0) {
            throw new BadRequestException("Số lượng phải lớn hơn 0");
        }

        List<Promotion> activePromotions = promotionRepository.findActivePromotions(java.time.LocalDateTime.now());
        BigDecimal currentPrice = getEffectivePrice(variant, activePromotions);

        int onlineAvailableStock = getOnlineAvailableStock(variant);
        if (request.getQuantity() > onlineAvailableStock) {
            throw new BadRequestException("Chỉ còn " + onlineAvailableStock + " sản phẩm");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItem.setPrice(currentPrice);

        return toResponse(cartItemRepository.save(cartItem));
    }

    @Override
    public CartItemResponse increaseQuantity(Long cartItemId) {
        Long userId = securityUtils.getCurrentUserId();

        CartItem cartItem = cartItemRepository.findByIdForUpdate(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng"));

        validateOwnership(cartItem, userId);

        ProductVariant variant = loadAvailableVariantForUpdate(
                cartItem.getVariant().getVariantId());
        cartItem.setVariant(variant);

        List<Promotion> activePromotions = promotionRepository.findActivePromotions(java.time.LocalDateTime.now());
        BigDecimal currentPrice = getEffectivePrice(variant, activePromotions);

        int onlineAvailableStock = getOnlineAvailableStock(variant);
        if (cartItem.getQuantity() + 1 > onlineAvailableStock) {
            throw new BadRequestException(
                    "Số lượng vượt quá tồn kho. Hiện còn " + onlineAvailableStock);
        }

        cartItem.setQuantity(cartItem.getQuantity() + 1);
        cartItem.setPrice(currentPrice);

        return toResponse(cartItemRepository.save(cartItem));
    }

    @Override
    public Optional<CartItemResponse> decreaseQuantity(Long cartItemId) {
        Long userId = securityUtils.getCurrentUserId();

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng"));

        validateOwnership(cartItem, userId);

        if (cartItem.getQuantity() <= 1) {
            cartItemRepository.delete(cartItem);
            return Optional.empty();
        }

        cartItem.setQuantity(cartItem.getQuantity() - 1);

        return Optional.of(toResponse(cartItemRepository.save(cartItem)));
    }

    @Override
    public void removeItem(Long cartItemId) {
        Long userId = securityUtils.getCurrentUserId();

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm trong giỏ hàng"));

        validateOwnership(cartItem, userId);

        cartItemRepository.delete(cartItem);
    }

    @Override
    public void removeItems(List<Long> cartItemIds) {
        Long userId = securityUtils.getCurrentUserId();

        Cart cart = cartRepository.findByCustomer_CustomerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giỏ hàng"));

        List<CartItem> items = cartItemRepository.findAllById(cartItemIds);

        List<CartItem> ownedItems = items.stream()
                .filter(item -> item.getCart().getCartId().equals(cart.getCartId()))
                .toList();

        if (ownedItems.size() != cartItemIds.size()) {
            throw new BadRequestException("Một số item không thuộc giỏ hàng của bạn");
        }

        cartItemRepository.deleteAll(ownedItems);
    }

    @Override
    public void clearCart() {
        Long userId = securityUtils.getCurrentUserId();

        Cart cart = cartRepository.findByCustomer_CustomerId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giỏ hàng"));

        cartItemRepository.deleteByCart_CartId(cart.getCartId());
    }

    @Override
    @Transactional(readOnly = true)
    public Long countItems() {
        Long userId = securityUtils.getCurrentUserId();

        return cartRepository.findByCustomer_CustomerId(userId)
                .map(cart -> cart.getItems().stream()
                        .mapToLong(CartItem::getQuantity)
                        .sum())
                .orElse(0L);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsInCart(Long variantId) {
        Long userId = securityUtils.getCurrentUserId();

        return cartRepository.findByCustomer_CustomerId(userId)
                .map(cart -> cartItemRepository.existsByCart_CartIdAndVariant_VariantId(
                        cart.getCartId(), variantId))
                .orElse(false); 
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateTotal() {
        Long userId = securityUtils.getCurrentUserId();
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(java.time.LocalDateTime.now());

        return cartRepository.findByCustomer_CustomerId(userId)
                .map(cart -> cart.getItems().stream()
                        .map(item -> getEffectivePrice(item.getVariant(), activePromotions)
                                .multiply(BigDecimal.valueOf(item.getQuantity())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .orElse(BigDecimal.ZERO);
    }

    private void validateOwnership(CartItem cartItem, Long userId) {
        if (!cartItem.getCart().getCustomer().getCustomerId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền thao tác item này");
        }
    }

    private BigDecimal getEffectivePrice(ProductVariant variant, List<Promotion> activePromotions) {
        BigDecimal originalPrice = variant.getPrice();
        BigDecimal salePrice = originalPrice;

        if (activePromotions != null && !activePromotions.isEmpty() && originalPrice != null) {
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
                                .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
                        if (p.getMaxDiscountAmount() != null) {
                            discount = discount.min(p.getMaxDiscountAmount());
                        }
                        promoPrice = originalPrice.subtract(discount).max(BigDecimal.ZERO);
                    } else {
                        promoPrice = originalPrice.subtract(p.getDiscountValue()).max(BigDecimal.ZERO);
                    }

                    if (promoPrice.compareTo(bestPrice) < 0) {
                        bestPrice = promoPrice;
                    }
                }
            }
            salePrice = bestPrice;
        }
        return salePrice;
    }

    private CartItemResponse toResponse(CartItem cartItem) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(java.time.LocalDateTime.now());
        return toResponse(cartItem, activePromotions);
    }

    private ProductVariant loadAvailableVariantForUpdate(Long variantId) {
        ProductVariant variant = productVariantRepository.findByIdForUpdate(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không còn tồn tại"));
        if (variant.getStatus() != ProductVariantStatus.ACTIVE
                || variant.getProduct() == null
                || variant.getProduct().getStatus() != ProductStatus.ACTIVE) {
            throw new BadRequestException("Sản phẩm hiện không còn được bán");
        }
        return variant;
    }

    private CartItemResponse toResponse(
            CartItem cartItem,
            List<Promotion> activePromotions
    ) {
        ProductVariant variant = cartItem.getVariant();
        BigDecimal salePrice = getEffectivePrice(variant, activePromotions);

        CartProductResponse productResponse = CartProductResponse.builder()
                .productId(variant.getProduct().getProductId())
                .productName(variant.getProduct().getProductName())
                .status(variant.getProduct().getStatus() != null ? variant.getProduct().getStatus().name() : null)
                .build();

        CartVariantResponse variantResponse = CartVariantResponse.builder()
                .variantId(variant.getVariantId())
                .price(variant.getPrice())
                .salePrice(salePrice)
                .size(variant.getSize())
                .color(variant.getColor())
                .stockQuantity(getOnlineAvailableStock(variant))
                .status(variant.getStatus() != null ? variant.getStatus().name() : null)
                .image(modelMapper.map(variant.getImage(), CartVariantImageResponse.class))
                .product(productResponse)
                .build();

        return CartItemResponse.builder()
                .cartItemId(cartItem.getCartItemId())
                .variant(variantResponse)
                .quantity(cartItem.getQuantity())
                .price(salePrice)
                .build();
    }

    private int getOnlineAvailableStock(ProductVariant variant) {
        int stockQuantity = variant.getStockQuantity() != null
                ? variant.getStockQuantity() : 0;
        int onlineHeldQuantity = reservationRepository
                .sumActiveOnlineQuantityByVariantId(variant.getVariantId());
        return Math.max(0, stockQuantity - onlineHeldQuantity);
    }
}
