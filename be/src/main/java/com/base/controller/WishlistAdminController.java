package com.base.controller;

import com.base.dto.response.ApiResponse;
import com.base.dto.response.wishlist.WishlistResponse;
import com.base.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/wishlist")
@RequiredArgsConstructor
public class WishlistAdminController {
    private final WishlistService wishlistService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<Page<WishlistResponse>>> getWishlistUser(
            @PathVariable Long userId,
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
                                userId,
                                keyword,
                                pageable
                        )
                )
        );
    }
}
