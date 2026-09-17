package com.base.service.impl;

import com.base.dto.request.address.AddressRequest;
import com.base.dto.response.address.AddressResponse;
import com.base.entity.Address;
import com.base.entity.Customer;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.AddressRepository;
import com.base.repository.CustomerRepository;
import com.base.service.AddressService;
import com.base.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.base.service.GhnService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AddressServiceImpl implements AddressService {

    private final AddressRepository  addressRepository;
    private final CustomerRepository customerRepository;
    private final CustomerService    customerService;
    private final ModelMapper        modelMapper;
    private final GhnService         ghnService;

    @Override
    public AddressResponse createAddress(Long userId, AddressRequest request) {

        Customer customer = customerRepository.findById(userId).orElseThrow();

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            resetDefaultAddress(userId);
        }

        boolean hasNoAddress = addressRepository.countByCustomerCustomerId(userId) == 0;

        Address address = modelMapper.map(request, Address.class);
        address.setAddressId(null);
        address.setCustomer(customer);
        address.setIsDefault(hasNoAddress || Boolean.TRUE.equals(request.getIsDefault()));
        enrichAddressNames(address, request);

        Address saved = addressRepository.save(address);
        log.info("Created address id={} for customerId={}", saved.getAddressId(), userId);

        return toResponse(saved);
    }

    @Override
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        Address address = findById(addressId);
        assertBelongs(address, userId);

        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
            resetDefaultAddress(address.getCustomer().getCustomerId());
            address.setIsDefault(true);
        }

        modelMapper.map(request, address);
        enrichAddressNames(address, request);
        Address saved = addressRepository.save(address);
        log.info("Updated address id={}", addressId);

        return toResponse(saved);
    }

    @Override
    public void deleteAddress(Long userId, Long addressId) {
        Address address = findById(addressId);
        assertBelongs(address, userId);
        Long customerId = address.getCustomer().getCustomerId();

        addressRepository.delete(address);
        log.info("Deleted address id={}", addressId);

        if (address.getIsDefault()) {
            addressRepository.findFirstByCustomerCustomerIdOrderByAddressIdAsc(customerId)
                    .ifPresent(next -> {
                        next.setIsDefault(true);
                        addressRepository.save(next);
                        log.info("Auto-set new default address id={} for customerId={}",
                                next.getAddressId(), customerId);
                    });
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressById(Long userId, Long addressId) {
        Address address = findById(addressId);
        assertBelongs(address, userId);
        return toResponse(address);
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getAddressByIdForAdmin(Long addressId) {
        return toResponse(findById(addressId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddressesByUser(Long userId) {
        return customerRepository.findById(userId)
                .map(c -> addressRepository
                        .findByCustomerCustomerIdOrderByIsDefaultDescAddressIdAsc(c.getCustomerId())
                        .stream()
                        .map(this::toResponse)
                        .toList())
                .orElseGet(List::of);
    }

    @Override
    @Transactional(readOnly = true)
    public AddressResponse getDefaultAddress(Long userId) {
        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Người dùng chưa có hồ sơ khách hàng: " + userId));
        return addressRepository.findByCustomerCustomerIdAndIsDefaultTrue(customer.getCustomerId())
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Khách hàng không có địa chỉ mặc định: " + customer.getCustomerId()));
    }

    @Override
    public void setDefaultAddress(Long userId, Long addressId) {
        Customer customer = customerRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng!"));

        Address address = findById(addressId);

        if (!address.getCustomer().getCustomerId().equals(userId)) {
            throw new BadRequestException(
                    "Address id=" + addressId + " does not belong to customerId=" + userId);
        }

        if (address.getIsDefault()) {
            log.info("Address id={} is already the default", addressId);
            return;
        }

        resetDefaultAddress(userId);
        address.setIsDefault(true);
        addressRepository.save(address);
        log.info("Set default address id={} for customerId={}", addressId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddressesByCustomerId(Long customerId) {
        return addressRepository
                .findByCustomerCustomerIdOrderByIsDefaultDescAddressIdAsc(customerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public void setDefaultByCustomerId(Long customerId, Long addressId) {
        Address address = findById(addressId);

        if (!address.getCustomer().getCustomerId().equals(customerId)) {
            throw new BadRequestException(
                    "Address id=" + addressId + " does not belong to customerId=" + customerId);
        }
        if (address.getIsDefault()) return;

        resetDefaultAddress(customerId);
        address.setIsDefault(true);
        addressRepository.save(address);
        log.info("[Admin] Set default address id={} for customerId={}", addressId, customerId);
    }

    @Override
    public AddressResponse createAddressForCustomer(Long customerId, AddressRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng: " + customerId));

        if (Boolean.TRUE.equals(request.getIsDefault())) {
            resetDefaultAddress(customerId);
        }
        boolean hasNoAddress = addressRepository.countByCustomerCustomerId(customerId) == 0;

        Address address = modelMapper.map(request, Address.class);
        address.setAddressId(null);
        address.setCustomer(customer);
        address.setIsDefault(hasNoAddress || Boolean.TRUE.equals(request.getIsDefault()));
        enrichAddressNames(address, request);

        Address saved = addressRepository.save(address);
        log.info("[Admin] Tạo địa chỉ id={} cho customerId={}", saved.getAddressId(), customerId);
        return toResponse(saved);
    }

    @Override
    public AddressResponse updateAddressForCustomer(Long customerId, Long addressId, AddressRequest request) {
        Address address = findById(addressId);
        assertBelongs(address, customerId);

        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.getIsDefault()) {
            resetDefaultAddress(customerId);
            address.setIsDefault(true);
        }
        modelMapper.map(request, address);
        enrichAddressNames(address, request);
        return toResponse(addressRepository.save(address));
    }

    @Override
    public void deleteAddressForCustomer(Long customerId, Long addressId) {
        Address address = findById(addressId);
        assertBelongs(address, customerId);

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);

        if (wasDefault) {
            addressRepository.findFirstByCustomerCustomerIdOrderByAddressIdAsc(customerId)
                    .ifPresent(next -> {
                        next.setIsDefault(true);
                        addressRepository.save(next);
                    });
        }
    }

    private void assertBelongs(Address address, Long customerId) {
        if (address.getCustomer() == null
                || !address.getCustomer().getCustomerId().equals(customerId)) {
            throw new BadRequestException(
                    "Địa chỉ id=" + address.getAddressId() + " không thuộc khách hàng " + customerId);
        }
    }

    private Address findById(Long addressId) {
        return addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy địa chỉ: " + addressId));
    }

    private void resetDefaultAddress(Long customerId) {
        addressRepository.findByCustomerCustomerIdAndIsDefaultTrue(customerId)
                .ifPresent(addr -> {
                    addr.setIsDefault(false);
                    addressRepository.save(addr);
                });
    }

    private void enrichAddressNames(Address address, AddressRequest request) {
        boolean hasAnyGhnCode = request.getGhnProvinceId() != null
                || request.getGhnDistrictId() != null
                || (request.getGhnWardCode() != null && !request.getGhnWardCode().isBlank());
        if (hasAnyGhnCode) {
            if (request.getGhnProvinceId() == null || request.getGhnProvinceId() <= 0
                    || request.getGhnDistrictId() == null || request.getGhnDistrictId() <= 0
                    || request.getGhnWardCode() == null || request.getGhnWardCode().isBlank()) {
                throw new BadRequestException("Địa chỉ phải có đầy đủ mã tỉnh, quận/huyện và phường/xã GHN");
            }

            GhnService.ResolvedAddressNames names = ghnService.resolveNames(
                    request.getGhnProvinceId(), request.getGhnDistrictId(), request.getGhnWardCode());
            if (names == null || "-".equals(names.getProvinceName())
                    || "-".equals(names.getDistrictName()) || "-".equals(names.getWardName())) {
                throw new BadRequestException("Mã địa chỉ GHN không hợp lệ hoặc không còn được hỗ trợ");
            }

            address.setProvinceName(usableName(request.getProvinceName(), request.getProvince()));
            address.setDistrictName(usableName(request.getDistrictName(), request.getDistrict()));
            address.setWardName(usableName(request.getWardName(), request.getWard()));
            return;
        }

        // Khi người dùng đổi sang một địa chỉ 2 cấp chưa có ánh xạ GHN, phải xóa
        // mã kỹ thuật cũ để checkout không tính phí cho nhầm phường/xã trước đó.
        address.setGhnProvinceId(null);
        address.setGhnDistrictId(null);
        address.setGhnWardCode(null);

        if (request.getProvinceName() != null && !request.getProvinceName().isBlank()) {
            address.setProvinceName(request.getProvinceName());
        }
        if (request.getDistrictName() != null && !request.getDistrictName().isBlank()) {
            address.setDistrictName(request.getDistrictName());
        }
        if (request.getWardName() != null && !request.getWardName().isBlank()) {
            address.setWardName(request.getWardName());
        }

        if (address.getProvinceName() == null || address.getProvinceName().isBlank() || "-".equals(address.getProvinceName())
                || address.getWardName() == null || address.getWardName().isBlank() || "-".equals(address.getWardName())) {
            try {
                GhnService.ResolvedAddressNames names = ghnService.resolveNames(address.getProvince(), address.getWard());
                if (names != null) {
                    if (names.getProvinceName() != null && !"-".equals(names.getProvinceName())) {
                        address.setProvinceName(names.getProvinceName());
                    }
                    if (names.getDistrictName() != null && !"-".equals(names.getDistrictName())) {
                        address.setDistrictName(names.getDistrictName());
                    }
                    if (names.getWardName() != null && !"-".equals(names.getWardName())) {
                        address.setWardName(names.getWardName());
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể tự động resolve tên địa chỉ khi lưu: {}", e.getMessage());
            }
        }
    }

    private AddressResponse toResponse(Address address) {
        AddressResponse res = modelMapper.map(address, AddressResponse.class);
        if (res.getGhnProvinceId() == null || res.getGhnDistrictId() == null
                || res.getGhnWardCode() == null || res.getGhnWardCode().isBlank()) {
            String provinceName = usableName(address.getProvinceName(), address.getProvince());
            String districtName = usableName(address.getDistrictName(), address.getDistrict());
            String wardName = usableName(address.getWardName(), address.getWard());
            GhnService.ResolvedAddressCodes codes = ghnService.resolveCodes(
                    provinceName, districtName, wardName);
            if (codes != null && codes.isResolved()) {
                res.setGhnProvinceId(codes.getProvinceId());
                res.setGhnDistrictId(codes.getDistrictId());
                res.setGhnWardCode(codes.getWardCode());
            }
        }
        if (address.getProvinceName() != null && !address.getProvinceName().isBlank() && !"-".equals(address.getProvinceName())
                && address.getWardName() != null && !address.getWardName().isBlank() && !"-".equals(address.getWardName())) {
            res.setProvinceName(address.getProvinceName());
            res.setDistrictName(address.getDistrictName() != null ? address.getDistrictName() : "-");
            res.setWardName(address.getWardName());
            return res;
        }

        try {
            GhnService.ResolvedAddressNames names = ghnService.resolveNames(address.getProvince(), address.getWard());
            res.setProvinceName(names.getProvinceName());
            res.setDistrictName(names.getDistrictName());
            res.setWardName(names.getWardName());
        } catch (Exception e) {
            log.error("Lỗi resolve tên địa chỉ trong toResponse: {}", e.getMessage());
            res.setProvinceName("-");
            res.setDistrictName("-");
            res.setWardName("-");
        }
        return res;
    }

    private String usableName(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() && !"-".equals(preferred)
                ? preferred
                : fallback;
    }
}
