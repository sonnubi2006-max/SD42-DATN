package com.base.service.impl;

import com.base.entity.Customer;
import com.base.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuestOrderLinkServiceImplTest {

    @Mock private OrderRepository orderRepository;

    @InjectMocks private GuestOrderLinkServiceImpl guestOrderLinkService;

    @Test
    void linksOnlyUnassignedOrdersUsingNormalizedEmail() {
        Customer customer = Customer.builder()
                .customerId(17L)
                .email("  Customer@Example.COM ")
                .build();
        when(orderRepository.linkGuestOrdersToCustomerByEmail(customer, "customer@example.com"))
                .thenReturn(3);

        int linked = guestOrderLinkService.linkUnassignedOrders(customer);

        assertEquals(3, linked);
        verify(orderRepository)
                .linkGuestOrdersToCustomerByEmail(customer, "customer@example.com");
    }

    @Test
    void skipsCustomerWithoutPersistedIdOrEmail() {
        Customer customer = Customer.builder().email("customer@example.com").build();

        assertEquals(0, guestOrderLinkService.linkUnassignedOrders(customer));
        assertEquals(0, guestOrderLinkService.linkUnassignedOrders(
                Customer.builder().customerId(17L).email(" ").build()
        ));

        verify(orderRepository, never())
                .linkGuestOrdersToCustomerByEmail(customer, "customer@example.com");
    }
}
