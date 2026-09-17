package com.base.service.impl;

import com.base.dto.request.address.AddressRequest;
import com.base.entity.Address;
import com.base.entity.Customer;
import com.base.exception.BadRequestException;
import com.base.repository.AddressRepository;
import com.base.repository.CustomerRepository;
import com.base.service.CustomerService;
import com.base.service.GhnService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AddressServiceImplTest {

    @Mock AddressRepository addressRepository;
    @Mock CustomerRepository customerRepository;
    @Mock CustomerService customerService;
    @Mock ModelMapper modelMapper;
    @Mock GhnService ghnService;

    private AddressServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AddressServiceImpl(
                addressRepository, customerRepository, customerService, modelMapper, ghnService);
    }

    @Test
    void customerCannotReadAnotherCustomersAddress() {
        when(addressRepository.findById(10L)).thenReturn(Optional.of(addressOwnedBy(2L)));

        assertThrows(BadRequestException.class, () -> service.getAddressById(1L, 10L));
    }

    @Test
    void customerCannotUpdateAnotherCustomersAddress() {
        when(addressRepository.findById(10L)).thenReturn(Optional.of(addressOwnedBy(2L)));

        assertThrows(BadRequestException.class,
                () -> service.updateAddress(1L, 10L, new AddressRequest()));
        verify(addressRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void customerCannotDeleteAnotherCustomersAddress() {
        when(addressRepository.findById(10L)).thenReturn(Optional.of(addressOwnedBy(2L)));

        assertThrows(BadRequestException.class, () -> service.deleteAddress(1L, 10L));
        verify(addressRepository, never()).delete(org.mockito.ArgumentMatchers.any());
    }

    private Address addressOwnedBy(Long customerId) {
        Customer customer = new Customer();
        customer.setCustomerId(customerId);
        Address address = new Address();
        address.setAddressId(10L);
        address.setCustomer(customer);
        return address;
    }
}
