package com.base.controller;

import com.base.dto.response.ApiResponse;
import com.base.dto.response.wishlist.WishlistResponse;
import com.base.service.WishlistService;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;
    private final SecurityUtils securityUtils;

    private Long getCurrentUserId() {
        return securityUtils.getCurrentUserId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<WishlistResponse>>> getMyWishlist(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String keyword
    ) {

        Sort.Direction sortDirection =
                direction.equalsIgnoreCase("asc")
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(sortDirection, sort)
        );

        return ResponseEntity.ok(
                ApiResponse.success(
                        wishlistService.getUserWishlist(
                                getCurrentUserId(),
                                keyword,
                                pageable
                        )
                )
        );
    }

    @PostMapping("/{variantId}")
    public ResponseEntity<ApiResponse<WishlistResponse>> addToWishlist(
            @PathVariable Long variantId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        wishlistService.addToWishlist(
                                getCurrentUserId(),
                                variantId
                        )
                )
        );
    }

    @DeleteMapping("/{variantId}")
    public ResponseEntity<ApiResponse<Void>> removeFromWishlist(
            @PathVariable Long variantId
    ) {

        wishlistService.removeFromWishlist(
                getCurrentUserId(),
                variantId
        );

        return ResponseEntity.ok(
                ApiResponse.success(null)
        );
    }

    @PutMapping("/{variantId}/toggle")
    public ResponseEntity<ApiResponse<Boolean>> toggleWishlist(
            @PathVariable Long variantId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        wishlistService.toggleWishlist(
                                getCurrentUserId(),
                                variantId
                        )
                )
        );
    }

    @GetMapping("/{variantId}/exists")
    public ResponseEntity<ApiResponse<Boolean>> existsInWishlist(
            @PathVariable Long variantId
    ) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        wishlistService.existsInWishlist(
                                getCurrentUserId(),
                                variantId
                        )
                )
        );
    }

    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Long>> countWishlist(
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        wishlistService.countWishlist(
                                getCurrentUserId()
                        )
                )
        );
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<Void>> clearWishlist() {

        wishlistService.clearWishlist(getCurrentUserId());

        return ResponseEntity.ok(
                ApiResponse.success(null)
        );
    }
}
