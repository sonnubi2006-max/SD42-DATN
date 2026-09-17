package com.base.service.impl;

import com.base.dto.request.customer.UpdateCustomerProfileRequest;
import com.base.dto.response.customer.CustomerResponse;
import com.base.entity.Customer;
import com.base.repository.CustomerRepository;
import com.base.utils.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private SecurityUtils securityUtils;
    @Mock private ModelMapper modelMapper;

    @InjectMocks private CustomerServiceImpl customerService;

    @Test
    void updateCurrentProfileUpdatesOnlyAuthenticatedCustomer() {
        Customer customer = Customer.builder()
                .customerId(12L)
                .email("customer@example.com")
                .fullName("Tên cũ")
                .phone("0911111111")
                .build();
        UpdateCustomerProfileRequest request = new UpdateCustomerProfileRequest();
        request.setFullName("  Nguyễn   Minh Anh  ");
        request.setPhone("0987654321");
        request.setGender("OTHER");
        request.setBirthday(LocalDate.of(2000, 5, 20));

        when(securityUtils.getCurrentUserId()).thenReturn(12L);
        when(customerRepository.findById(12L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(customer)).thenReturn(customer);

        CustomerResponse response = customerService.updateCurrentProfile(request);

        assertEquals(12L, response.getCustomerId());
        assertEquals("Nguyễn Minh Anh", customer.getFullName());
        assertEquals("0987654321", customer.getPhone());
        assertEquals("OTHER", customer.getGender());
        assertEquals(LocalDate.of(2000, 5, 20), customer.getBirthday());
        verify(customerRepository).save(customer);
    }
}
