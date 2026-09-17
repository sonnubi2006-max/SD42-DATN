package com.base.repository;

import com.base.entity.Customer;
import com.base.entity.Order;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

@DataJpaTest(properties = {
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never"
})
class OrderRepositoryTest {

    @Autowired private OrderRepository orderRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private EntityManager entityManager;

    @Test
    void linkGuestOrdersMatchesNormalizedEmailAndNeverReassignsOwnedOrder() {
        Customer customer = customerRepository.save(Customer.builder()
                .email("customer@example.com")
                .build());
        Customer anotherCustomer = customerRepository.save(Customer.builder()
                .email("another@example.com")
                .build());

        Order matchingGuestOrder = orderRepository.save(Order.builder()
                .orderCode("GUEST-MATCH")
                .guestEmail("  Customer@Example.COM ")
                .build());
        Order differentGuestOrder = orderRepository.save(Order.builder()
                .orderCode("GUEST-DIFFERENT")
                .guestEmail("different@example.com")
                .build());
        Order alreadyOwnedOrder = orderRepository.save(Order.builder()
                .orderCode("OWNED-MATCH")
                .guestEmail("customer@example.com")
                .customer(anotherCustomer)
                .build());

        int linked = orderRepository.linkGuestOrdersToCustomerByEmail(
                customer, "customer@example.com"
        );
        entityManager.clear();

        assertEquals(1, linked);
        assertEquals(customer.getCustomerId(), orderRepository.findById(matchingGuestOrder.getOrderId())
                .orElseThrow().getCustomer().getCustomerId());
        assertNull(orderRepository.findById(differentGuestOrder.getOrderId())
                .orElseThrow().getCustomer());
        assertEquals(anotherCustomer.getCustomerId(), orderRepository.findById(alreadyOwnedOrder.getOrderId())
                .orElseThrow().getCustomer().getCustomerId());
    }
}
