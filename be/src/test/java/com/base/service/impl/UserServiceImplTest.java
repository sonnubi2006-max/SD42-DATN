package com.base.service.impl;

import com.base.dto.request.user.UpdateUserRequest;
import com.base.dto.response.user.UserResponse;
import com.base.entity.User;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.queue.EmailProducer;
import com.base.queue.ImageUploadProducer;
import com.base.repository.CustomerRepository;
import com.base.repository.UserRepository;
import com.base.utils.CredentialGenerator;
import com.base.utils.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private ModelMapper modelMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private SecurityUtils securityUtils;
    @Mock private CredentialGenerator credentialGenerator;
    @Mock private EmailProducer emailProducer;
    @Mock private LocalStorageService localStorageService;
    @Mock private ImageUploadProducer imageUploadProducer;

    @InjectMocks private UserServiceImpl userService;

    @Test
    void updateProfileReturnsUpdatedUserAndPreservesAvatar() {
        User user = User.builder()
                .userId(7L)
                .fullName("Tên cũ")
                .phone("0911111111")
                .avatar("avatar-cu.jpg")
                .gender("MALE")
                .birthday(LocalDate.of(1995, 1, 1))
                .build();
        UpdateUserRequest request = validRequest();
        request.setFullName("  Nguyễn   Văn An  ");

        UserResponse expected = new UserResponse();
        expected.setUserId(7L);
        expected.setFullName("Nguyễn Văn An");

        when(securityUtils.getCurrentUserId()).thenReturn(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneAndUserIdIsNot("0912345678", 7L)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(modelMapper.map(user, UserResponse.class)).thenReturn(expected);

        UserResponse actual = userService.updateProfile(request);

        assertSame(expected, actual);
        assertEquals("Nguyễn Văn An", user.getFullName());
        assertEquals("0912345678", user.getPhone());
        assertEquals("avatar-cu.jpg", user.getAvatar());
        verify(userRepository).save(user);
    }

    @Test
    void updateProfileRejectsPhoneOwnedByAnotherUser() {
        User user = User.builder().userId(7L).build();
        UpdateUserRequest request = validRequest();

        when(securityUtils.getCurrentUserId()).thenReturn(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userRepository.existsByPhoneAndUserIdIsNot("0912345678", 7L)).thenReturn(true);

        assertThrows(
                ResourceAlreadyExistsException.class,
                () -> userService.updateProfile(request)
        );
        verify(userRepository, never()).save(any(User.class));
    }

    private UpdateUserRequest validRequest() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Nguyễn Văn An");
        request.setPhone("0912345678");
        request.setGender("MALE");
        request.setBirthday(LocalDate.now().minusYears(20));
        return request;
    }
}
