package com.base.service.impl;

import com.base.dto.request.customer.CustomerRequest;
import com.base.dto.request.customer.UpdateCustomerProfileRequest;
import com.base.dto.response.address.AddressResponse;
import com.base.dto.response.customer.CustomerResponse;
import com.base.dto.response.customer.CustomerStatisticsResponse;
import com.base.entity.Address;
import com.base.entity.Customer;
import com.base.entity.User;
import com.base.enums.CustomerSource;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.CustomerRepository;
import com.base.repository.UserRepository;
import com.base.service.CustomerService;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final SecurityUtils securityUtils;
    private final ModelMapper modelMapper;

    @Override
    public Customer findOrCreateByEmail(String email, String fullName, String phone) {
        String normalized = normalizeEmail(email);

        if (normalized != null) {
            Optional<Customer> existing = customerRepository.findByEmail(normalized);
            if (existing.isPresent()) {
                Customer c = existing.get();
                if (isBlank(c.getFullName()) && !isBlank(fullName)) c.setFullName(fullName.trim());
                if (isBlank(c.getPhone()) && !isBlank(phone)) c.setPhone(phone.trim());
                return c;
            }
        }

        if (phone != null && !phone.isBlank()) {
            Optional<Customer> existingByPhone = customerRepository.findByPhone(phone.trim());
            if (existingByPhone.isPresent()) {
                Customer c = existingByPhone.get();
                if (isBlank(c.getFullName()) && !isBlank(fullName)) c.setFullName(fullName.trim());
                if (isBlank(c.getEmail()) && normalized != null) c.setEmail(normalized);
                return c;
            }
        }

        if (normalized == null) {
            String suffix = (phone != null && !phone.isBlank()) ? phone.trim() : java.util.UUID.randomUUID().toString().substring(0, 8);
            normalized = "guest_" + suffix + "@guest.datn";
        }

        Customer created = customerRepository.save(Customer.builder()
                .email(normalized)
                .fullName(trimToNull(fullName))
                .phone(trimToNull(phone))
                .source(CustomerSource.GUEST)
                .build());
        log.info("[Customer] Tạo GUEST id={} email={}", created.getCustomerId(), normalized);
        return created;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getAll(String keyword, CustomerSource source,
                                         Customer.CustomerStatus status, Pageable pageable) {
        return customerRepository
                .filterCustomers(trimToNull(keyword), source, status, pageable)
                .map(this::toResponse);
    }

    @Override
    public CustomerResponse create(CustomerRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (email != null && customerRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được dùng bởi khách khác: " + email);
        }
        Customer c = customerRepository.save(Customer.builder()
                .email(email)
                .fullName(trimToNull(request.getFullName()))
                .phone(trimToNull(request.getPhone()))
                .gender(request.getGender() == null ? "MALE" : request.getGender())
                .birthday(request.getBirthday())
                .avatar(trimToNull(request.getAvatar()))
                .emailSubscribed(request.getEmailSubscribed() == null ? Boolean.TRUE : request.getEmailSubscribed())
                .source(CustomerSource.GUEST)
                .build());
        log.info("[Customer] Admin tạo khách id={} email={}", c.getCustomerId(), email);
        return toResponse(c);
    }

    @Override
    public CustomerResponse getCurrentUser() {
        Long customerId = securityUtils.getCurrentUserId();

        return toResponse(findEntity(customerId));
    }

    @Override
    public CustomerResponse updateCurrentProfile(UpdateCustomerProfileRequest request) {
        Customer customer = findEntity(securityUtils.getCurrentUserId());

        customer.setFullName(request.getFullName().trim().replaceAll("\\s+", " "));
        customer.setPhone(request.getPhone().trim());
        customer.setGender(request.getGender());
        customer.setBirthday(request.getBirthday());
        if (request.getAvatar() != null) {
            customer.setAvatar(trimToNull(request.getAvatar()));
        }

        return toResponse(customerRepository.save(customer));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerResponse getById(Long id) {
        return toResponse(findEntity(id));
    }

    @Override
    public CustomerResponse update(Long id, CustomerRequest request) {
        Customer c = findEntity(id);

        String newEmail = normalizeEmail(request.getEmail());
        if (newEmail != null && !newEmail.equals(c.getEmail())
                && customerRepository.existsByEmail(newEmail)) {
            throw new BadRequestException("Email đã được dùng bởi khách khác: " + newEmail);
        }
        if (newEmail != null) c.setEmail(newEmail);

        if (request.getFullName() != null) c.setFullName(trimToNull(request.getFullName()));
        if (request.getPhone() != null) c.setPhone(trimToNull(request.getPhone()));
        if (request.getGender() != null) c.setGender(request.getGender());
        if (request.getBirthday() != null) c.setBirthday(request.getBirthday());
        if (request.getAvatar() != null) c.setAvatar(request.getAvatar());
        if (request.getEmailSubscribed() != null) c.setEmailSubscribed(request.getEmailSubscribed());

        return toResponse(c);
    }

    @Override
    public void setStatus(Long id, Customer.CustomerStatus status) {
        Customer c = findEntity(id);
        c.setStatus(status);
        log.info("[Customer] id={} -> status={}", id, status);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerStatisticsResponse getStatistics() {
        return CustomerStatisticsResponse.builder()
                .total(customerRepository.count())
                .guest(customerRepository.countBySource(CustomerSource.GUEST))
                .registered(customerRepository.countBySource(CustomerSource.REGISTERED))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerResponse> searchForPos(String keyword) {
        return customerRepository
                .filterCustomers(trimToNull(keyword), null, Customer.CustomerStatus.ACTIVE,
                        PageRequest.of(0, 10))
                .map(this::toResponse)
                .getContent();
    }

    @Override
    public CustomerResponse toResponse(Customer c) {
        CustomerResponse r = new CustomerResponse();
        r.setCustomerId(c.getCustomerId());
        r.setCustomerCode(c.getCustomerCode());
        r.setEmail(c.getEmail());
        r.setFullName(c.getFullName());
        r.setPhone(c.getPhone());
        r.setGender(c.getGender());
        r.setBirthday(c.getBirthday());
        r.setAvatar(c.getAvatar());
        r.setSource(c.getSource());
        r.setStatus(c.getStatus() != null ? c.getStatus().name() : null);
        r.setEmailSubscribed(c.getEmailSubscribed());
        r.setCreatedAt(c.getCreatedAt());
        r.setUpdatedAt(c.getUpdatedAt());

        c.getAddresses()
                .stream()
                .filter(Address::getIsDefault)
                .findFirst().ifPresent(address -> r.setAddress(modelMapper.map(address, AddressResponse.class)));
        return r;
    }

    private Customer findEntity(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng: " + id));
    }

    private static String normalizeEmail(String email) {
        if (isBlank(email)) return null;
        return email.trim().toLowerCase();
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
