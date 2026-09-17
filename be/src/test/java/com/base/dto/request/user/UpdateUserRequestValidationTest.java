package com.base.dto.request.user;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

class UpdateUserRequestValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void acceptsValidAdminOrStaffProfile() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Nguyễn Văn An");
        request.setPhone("0912345678");
        request.setGender("MALE");
        request.setBirthday(LocalDate.now().minusYears(20));

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsInvalidProfileFieldsAndUnderageStaff() {
        UpdateUserRequest request = new UpdateUserRequest();
        request.setFullName("Nguyễn Văn 123");
        request.setPhone("0123456789");
        request.setGender("OTHER");
        request.setBirthday(LocalDate.now().minusYears(17));

        Set<String> invalidFields = validator.validate(request).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());

        assertTrue(invalidFields.contains("fullName"));
        assertTrue(invalidFields.contains("phone"));
        assertTrue(invalidFields.contains("gender"));
        assertTrue(invalidFields.contains("adult"));
    }

    @Test
    void returnsVietnameseMessagesForInvalidPasswordRequest() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("");
        request.setNewPassword("123");
        request.setConfirmPassword("");

        Set<String> messages = validator.validate(request).stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());

        assertTrue(messages.contains("Mật khẩu hiện tại không được để trống"));
        assertTrue(messages.contains("Mật khẩu mới phải từ 8 đến 100 ký tự"));
        assertTrue(messages.contains("Mật khẩu xác nhận không được để trống"));
    }
}
