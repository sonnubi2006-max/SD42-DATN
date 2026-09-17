package com.base.utils;

import com.base.dto.request.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    public Long getCurrentUserId() {

        Long userId = getCurrentUserIdOrNull();
        if (userId == null) {
            throw new IllegalStateException("Không tìm thấy thông tin người dùng đã xác thực");
        }
        return userId;
    }

    public Long getCurrentUserIdOrNull() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
            return null;
        }

        return userDetails.getUserId();
    }

    public boolean hasAnyRole(String... roles) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> Arrays.stream(roles)
                        .map(role -> "ROLE_" + role)
                        .anyMatch(authority.getAuthority()::equals));
    }
}
