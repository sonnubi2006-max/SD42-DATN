package com.base.service;

import com.base.dto.response.product.TopWishlistProductResponse;
import com.base.dto.response.wishlist.WishlistResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WishlistService {

    WishlistResponse addToWishlist(Long userId, Long variantId);

    void removeFromWishlist(Long userId, Long variantId);

    boolean toggleWishlist(Long userId, Long variantId);

    boolean existsInWishlist(Long userId, Long variantId);

    Page<WishlistResponse> getUserWishlist(Long userId, String keyword, Pageable pageable);

    long countWishlist(Long userId);

    void clearWishlist(Long userId);

    List<TopWishlistProductResponse> getTopWishlistProducts(
            Integer limit
    );
}
