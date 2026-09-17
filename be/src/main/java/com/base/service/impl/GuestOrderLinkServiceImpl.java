package com.base.service.impl;

import com.base.entity.Customer;
import com.base.repository.OrderRepository;
import com.base.service.GuestOrderLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuestOrderLinkServiceImpl implements GuestOrderLinkService {

    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public int linkUnassignedOrders(Customer customer) {
        if (customer == null || customer.getCustomerId() == null) {
            return 0;
        }

        String normalizedEmail = normalizeEmail(customer.getEmail());
        if (normalizedEmail == null) {
            return 0;
        }

        int linkedOrders = orderRepository.linkGuestOrdersToCustomerByEmail(customer, normalizedEmail);
        if (linkedOrders > 0) {
            log.info("[GuestOrderLink] Đã gắn {} đơn khách vãng lai vào customerId={}",
                    linkedOrders, customer.getCustomerId());
        }
        return linkedOrders;
    }

    private static String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
