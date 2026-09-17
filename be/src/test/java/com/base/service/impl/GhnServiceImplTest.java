package com.base.service.impl;

import com.base.exception.BadRequestException;
import com.base.exception.ShippingProviderException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GhnServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    private GhnServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new GhnServiceImpl(restTemplate);
        ReflectionTestUtils.setField(service, "token", "test-token");
        ReflectionTestUtils.setField(service, "shopId", "123456");
        ReflectionTestUtils.setField(service, "fromDistrictId", 3440);
        ReflectionTestUtils.setField(service, "apiUrl", "https://dev-online-gateway.ghn.vn/shiip/public-api");
    }

    @Test
    void calculateFeeRejectsNonGhnAddressCodes() {
        assertThrows(BadRequestException.class, () -> service.calculateFee(0, "", 500));
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void calculateFeeReturnsGhnTotal() {
        Map<String, Object> availableServices = Map.of(
                "data", List.of(Map.of(
                        "service_id", 53320,
                        "service_type_id", 2)));
        Map<String, Object> feeResponse = Map.of(
                "data", Map.of("total", 42000));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(availableServices))
                .thenReturn(ResponseEntity.ok(feeResponse));

        BigDecimal fee = service.calculateFee(1452, "21012", 500);

        assertEquals(new BigDecimal("42000"), fee);
    }

    @Test
    @SuppressWarnings({"rawtypes", "unchecked"})
    void calculateFeeDoesNotHideInvalidGhnResponseBehindFixedFee() {
        Map<String, Object> availableServices = Map.of(
                "data", List.of(Map.of(
                        "service_id", 53320,
                        "service_type_id", 2)));

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(Map.class)))
                .thenReturn(ResponseEntity.ok(availableServices))
                .thenReturn(ResponseEntity.ok(Map.of("data", Map.of())));

        assertThrows(ShippingProviderException.class,
                () -> service.calculateFee(1452, "21012", 500));
    }

}
