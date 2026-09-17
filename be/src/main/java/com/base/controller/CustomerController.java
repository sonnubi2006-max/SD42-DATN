package com.base.controller;

import com.base.dto.request.address.AddressRequest;
import com.base.dto.request.customer.CustomerRequest;
import com.base.dto.request.customer.UpdateCustomerProfileRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.address.AddressResponse;
import com.base.dto.response.customer.CustomerResponse;
import com.base.dto.response.customer.CustomerStatisticsResponse;
import com.base.dto.response.user.UserResponse;
import com.base.entity.Customer;
import com.base.enums.CustomerSource;
import com.base.service.AddressService;
import com.base.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final AddressService addressService;

    @GetMapping("/manager/customers")
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "customerId") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) CustomerSource source,
            @RequestParam(required = false) Customer.CustomerStatus status
    ) {
        Sort.Direction dir = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));
        return ResponseEntity.ok(ApiResponse.success(
                customerService.getAll(keyword, source, status, pageable)));
    }

    @GetMapping("/manager/customers/statistics")
    public ResponseEntity<ApiResponse<CustomerStatisticsResponse>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(customerService.getStatistics()));
    }

    @PostMapping("/manager/customers")
    public ResponseEntity<ApiResponse<CustomerResponse>> create(
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(customerService.create(request)));
    }

    @GetMapping("/manager/customers/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(customerService.getById(id)));
    }

    @GetMapping("/manager/customers/{id}/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(addressService.getAddressesByCustomerId(id)));
    }

    @PatchMapping("/manager/customers/{id}/addresses/{addressId}/default")
    public ResponseEntity<ApiResponse<Void>> setDefaultAddress(
            @PathVariable Long id,
            @PathVariable Long addressId) {
        addressService.setDefaultByCustomerId(id, addressId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/manager/customers/{id}/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(addressService.createAddressForCustomer(id, request)));
    }

    @PutMapping("/manager/customers/{id}/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Long id,
            @PathVariable Long addressId,
            @Valid @RequestBody AddressRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                addressService.updateAddressForCustomer(id, addressId, request)));
    }

    @DeleteMapping("/manager/customers/{id}/addresses/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Long id,
            @PathVariable Long addressId) {
        addressService.deleteAddressForCustomer(id, addressId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/manager/customers/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(ApiResponse.success(customerService.update(id, request)));
    }

    @PatchMapping("/manager/customers/{id}/status")
    public ResponseEntity<ApiResponse<Void>> setStatus(
            @PathVariable Long id,
            @RequestParam Customer.CustomerStatus status) {
        customerService.setStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/manager/customers/search")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> searchForPos(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(customerService.searchForPos(keyword)));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCurrentUser() {
        return ResponseEntity.ok(ApiResponse.success(customerService.getCurrentUser()));
    }

    @PutMapping("/customers/profile")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCurrentProfile(
            @Valid @RequestBody UpdateCustomerProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(customerService.updateCurrentProfile(request)));
    }
}
