package com.base.service;

import com.base.dto.request.customer.CustomerRequest;
import com.base.dto.request.customer.UpdateCustomerProfileRequest;
import com.base.dto.response.customer.CustomerResponse;
import com.base.dto.response.customer.CustomerStatisticsResponse;
import com.base.entity.Customer;
import com.base.entity.User;
import com.base.enums.CustomerSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CustomerService {

    Customer findOrCreateByEmail(String email, String fullName, String phone);

    Page<CustomerResponse> getAll(String keyword, CustomerSource source,
                                  Customer.CustomerStatus status, Pageable pageable);

    CustomerResponse create(CustomerRequest request);

    CustomerResponse getCurrentUser();

    CustomerResponse updateCurrentProfile(UpdateCustomerProfileRequest request);

    CustomerResponse getById(Long id);

    CustomerResponse update(Long id, CustomerRequest request);

    void setStatus(Long id, Customer.CustomerStatus status);

    CustomerStatisticsResponse getStatistics();

    List<CustomerResponse> searchForPos(String keyword);

    CustomerResponse toResponse(Customer customer);
}
