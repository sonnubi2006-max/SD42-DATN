package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.user.*;
import com.base.dto.response.user.UserResponse;
import com.base.dto.response.user.UserStatisticProjection;
import com.base.entity.Customer;
import com.base.entity.User;
import com.base.enums.EmailType;
import com.base.enums.RoleUser;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.exception.ResourceNotFoundException;
import com.base.exception.UnauthorizedException;
import com.base.queue.EmailProducer;
import com.base.queue.ImageUploadProducer;
import com.base.repository.CustomerRepository;
import com.base.repository.UserRepository;
import com.base.service.UserService;
import com.base.utils.CredentialGenerator;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;
    private final CredentialGenerator credentialGenerator;
    private final EmailProducer emailProducer;

    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;

    @Value("${app.frontend.admin-url}")
    private String adminUrl;

    @Override
    public UserResponse getCurrentUser(UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", userDetails.getUsername()));

        return modelMapper.map(user, UserResponse.class);
    }

    @Override
    public Page<User> getAllUsers(String keyword, User.UserStatus status, RoleUser role, Pageable pageable) {
        return userRepository.search(keyword, status, role, pageable);
    }

    @Override
    @Transactional
    public UserResponse createAccountByAdmin(CreateAccountRequest request, MultipartFile file) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResourceAlreadyExistsException("Email đã tồn tại");
        }

        if (!request.getCccd().isEmpty() && userRepository.existsByCccd(request.getCccd())) {
            throw new ResourceAlreadyExistsException("CCCD đã tồn tại");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ResourceAlreadyExistsException("Số điện thoại đã tồn tại");
        }

        String username = generateUniqueUsername(request.getEmail());
        String rawPassword = credentialGenerator.generatePassword();

        User user = User.builder()
                .username(username)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .province(request.getProvince())
                .gender(request.getGender() == null ? "MALE" : request.getGender())
                .birthday(request.getBirthday())
                .cccd(request.getCccd())
                .district(request.getDistrict())
                .ward(request.getWard())
                .streetAddress(request.getStreetAddress())
                .password(passwordEncoder.encode(rawPassword))
                .role(request.getRole())
                .build();

        userRepository.save(user);

        emailProducer.send(EmailMessage.builder()
                .to(user.getEmail())
                .recipientName(user.getFullName())
                .type(EmailType.ACCOUNT_CREATED)
                .data(Map.of(
                        "username", username,
                        "password", rawPassword,
                        "loginUrl", adminUrl + "/login"
                ))
                .build());

        return modelMapper.map(user, UserResponse.class);
    }

    private String generateUniqueUsername(String email) {
        String username;
        do {
            username = credentialGenerator.generateUsername(email);
        } while (userRepository.existsByUsername(username));
        return username;
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
    }

    @Override
    public UserResponse updateUserByAdmin(Long id, AdminUpdateUserRequest update, MultipartFile file) {
        User user =  userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!update.getCccd().isEmpty() && userRepository.existsByCccdAndUserIdIsNot(update.getCccd(), user.getUserId())) {
            throw new ResourceAlreadyExistsException("CCCD đã tồn tại");
        }

        if (userRepository.existsByPhoneAndUserIdIsNot(update.getPhone(), user.getUserId())) {
            throw new ResourceAlreadyExistsException("Số điện thoại đã tồn tại");
        }

        user.setFullName(update.getFullName());
        user.setPhone(update.getPhone());
        user.setAvatar(update.getAvatar());
        user.setGender(update.getGender());
        user.setBirthday(update.getBirthday());
        user.setStatus(update.getStatus());
        user.setRole(update.getRole());
        user.setProvince(update.getProvince());
        user.setDistrict(update.getDistrict());
        user.setCccd(update.getCccd());
        user.setWard(update.getWard());
        user.setStreetAddress(update.getStreetAddress());

        if(file != null && !file.isEmpty()) {
            String tempPath = localStorageService.saveTempFile(file);
            String tempUrl = localStorageService.getTempUrl(tempPath);
            String currentAvatar = user.getAvatar();
            user.setAvatar(tempUrl);
            imageUploadProducer.sendUploadMessage(
                    ImageUploadMessage.builder()
                            .id(user.getUserId())
                            .table("USER")
                            .tempFilePath(tempPath)
                            .oldImageUrl(currentAvatar)
                            .action(ImageUploadMessage.ActionType.UPDATE_USER)
                            .build()
            );
        }
        userRepository.save(user);

        return modelMapper.map(user, UserResponse.class);

    }

    @Override
    public UserResponse updateStatusUser(Long id) {
       User user = this.getUserById(id);
        user.setStatus(
                user.getStatus().equals(User.UserStatus.ACTIVE)
                ? User.UserStatus.INACTIVE
                : User.UserStatus.ACTIVE
        );
         userRepository.save(user);
        return modelMapper.map(user, UserResponse.class);

    }

    @Override
    @Transactional
    public UserResponse updateProfile(UpdateUserRequest update) {

        Long userId = securityUtils.getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Vui lòng đăng nhập!"));

        String phone = update.getPhone().trim();
        if (userRepository.existsByPhoneAndUserIdIsNot(phone, userId)) {
            throw new ResourceAlreadyExistsException("Số điện thoại đã tồn tại");
        }

        user.setFullName(update.getFullName().trim().replaceAll("\\s+", " "));
        user.setPhone(phone);
        user.setGender(update.getGender());
        user.setBirthday(update.getBirthday());

        userRepository.save(user);
        return modelMapper.map(user, UserResponse.class);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request, UserDetails userDetails) {

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User", "username", userDetails.getUsername()));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public UserStatisticProjection getUserStatistics() {
        return userRepository.getUserStatistics();
    }
}
