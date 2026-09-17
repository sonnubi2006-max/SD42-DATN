package com.base.controller;

import com.base.dto.request.user.*;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.user.UserResponse;
import com.base.dto.response.user.UserStatisticProjection;
import com.base.entity.User;
import com.base.enums.RoleUser;
import com.base.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(userService.getCurrentUser(userDetails)));
    }

    @GetMapping("/manager/users")
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(
            @RequestParam(required = false) User.UserStatus status,
            @RequestParam(required = false) RoleUser role,
            @RequestParam(required = false) String keyword,
            Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(keyword, status, role, pageable)));
    }

    @GetMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserByAdmin(
            @PathVariable Long id,
            @Valid @ModelAttribute AdminUpdateUserRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateUserByAdmin(id, request, file)));
    }

    @PutMapping("/admin/users/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateStatusUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateStatusUser(id)));
    }

    @PostMapping(value = "/admin/users", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> createAccountByAdmin(
            @Valid @ModelAttribute CreateAccountRequest staff,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.createAccountByAdmin(staff, file)));
    }

    @PutMapping(value = "/profile", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateProfile(request)));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        userService.changePassword(request,userDetails);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/users/statistics")
    public ResponseEntity<ApiResponse<UserStatisticProjection>> getUserStatistics() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserStatistics()));
    }
}
