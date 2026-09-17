package com.base.exception.handler;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/test");
    }

    @Test
    void typeMismatchReturnsVietnameseMessage() {
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException(
                "abc", Long.class, "customerId", null, new IllegalArgumentException());

        ResponseEntity<ErrorResponse> response = handler.handleTypeMismatch(exception, request);

        assertError(response, HttpStatus.BAD_REQUEST,
                "Yêu cầu không hợp lệ",
                "Tham số 'customerId' không đúng định dạng yêu cầu");
    }

    @Test
    void missingParameterReturnsVietnameseMessage() {
        MissingServletRequestParameterException exception =
                new MissingServletRequestParameterException("couponId", "Long");

        ResponseEntity<ErrorResponse> response = handler.handleRequestBinding(exception, request);

        assertError(response, HttpStatus.BAD_REQUEST,
                "Yêu cầu không hợp lệ",
                "Yêu cầu đang thiếu tham số hoặc thông tin bắt buộc");
    }

    @Test
    void unsupportedMethodReturnsVietnameseMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleMethodNotSupported(
                new HttpRequestMethodNotSupportedException("TRACE"), request);

        assertError(response, HttpStatus.METHOD_NOT_ALLOWED,
                "Phương thức không được hỗ trợ",
                "Phương thức TRACE không được hỗ trợ cho đường dẫn này");
    }

    @Test
    void accessDeniedReturnsVietnameseMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleAccessDenied(
                new AccessDeniedException("Access denied"), request);

        assertError(response, HttpStatus.FORBIDDEN,
                "Không có quyền truy cập",
                "Bạn không có quyền thực hiện thao tác này");
    }

    @Test
    void dataIntegrityDoesNotExposeDatabaseMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleDataIntegrity(
                new DataIntegrityViolationException("duplicate key dbo.customer_email"), request);

        assertError(response, HttpStatus.CONFLICT,
                "Xung đột dữ liệu",
                "Dữ liệu bị trùng hoặc đang được sử dụng nên không thể thực hiện thao tác");
        assertThat(response.getBody().getMessage()).doesNotContain("dbo.customer_email");
    }

    @Test
    void unexpectedErrorReturnsSafeVietnameseMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(
                new RuntimeException("internal stack detail"), request);

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR,
                "Lỗi hệ thống",
                "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.");
        assertThat(response.getBody().getMessage()).doesNotContain("internal stack detail");
    }

    private void assertError(
            ResponseEntity<ErrorResponse> response,
            HttpStatus expectedStatus,
            String expectedError,
            String expectedMessage) {
        assertThat(response.getStatusCode()).isEqualTo(expectedStatus);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(expectedStatus.value());
        assertThat(response.getBody().getError()).isEqualTo(expectedError);
        assertThat(response.getBody().getMessage()).isEqualTo(expectedMessage);
        assertThat(response.getBody().getPath()).isEqualTo("/api/v1/test");
    }
}
