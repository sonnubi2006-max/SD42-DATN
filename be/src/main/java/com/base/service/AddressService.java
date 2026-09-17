package com.base.service;

import com.base.dto.request.address.AddressRequest;
import com.base.dto.response.address.AddressResponse;

import java.util.List;

public interface AddressService {

    AddressResponse createAddress(Long userId, AddressRequest request);

    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);

    void deleteAddress(Long userId, Long addressId);

    AddressResponse getAddressById(Long userId, Long addressId);

    AddressResponse getAddressByIdForAdmin(Long addressId);

    List<AddressResponse> getAddressesByUser(Long userId);

    AddressResponse getDefaultAddress(Long userId);

    void setDefaultAddress(Long userId, Long addressId);

    List<AddressResponse> getAddressesByCustomerId(Long customerId);

    void setDefaultByCustomerId(Long customerId, Long addressId);

    AddressResponse createAddressForCustomer(Long customerId, AddressRequest request);

    AddressResponse updateAddressForCustomer(Long customerId, Long addressId, AddressRequest request);

    void deleteAddressForCustomer(Long customerId, Long addressId);
}
