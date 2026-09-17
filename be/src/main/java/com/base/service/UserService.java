package com.base.service;

import com.base.dto.request.user.*;
import com.base.dto.response.user.UserResponse;
import com.base.dto.response.user.UserStatisticProjection;
import com.base.entity.User;
import com.base.enums.RoleUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface UserService {
    UserResponse getCurrentUser(UserDetails userDetails);

    Page<User> getAllUsers(String keyword, User.UserStatus status, RoleUser role, Pageable pageable);

    UserResponse createAccountByAdmin(CreateAccountRequest request, MultipartFile file);

    User getUserById(Long id);

    UserResponse updateUserByAdmin(Long id, AdminUpdateUserRequest adminUpdateUserRequest, MultipartFile file);

    UserResponse updateStatusUser(Long id);

    UserResponse updateProfile(UpdateUserRequest request);

    void changePassword(ChangePasswordRequest request, UserDetails userDetails);

    UserStatisticProjection getUserStatistics();
}
