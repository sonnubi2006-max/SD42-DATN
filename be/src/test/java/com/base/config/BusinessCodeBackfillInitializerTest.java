package com.base.config;

import com.base.entity.Customer;
import com.base.entity.Promotion;
import com.base.entity.User;
import com.base.repository.CustomerRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BusinessCodeBackfillInitializerTest {

    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PromotionRepository promotionRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;

    @Test
    void backfillsMissingCodesAndEnsuresUniqueIndexes() {
        Customer customer = new Customer();
        User user = new User();
        Promotion promotion = new Promotion();
        when(customerRepository.findAll()).thenReturn(List.of(customer));
        when(userRepository.findAll()).thenReturn(List.of(user));
        when(promotionRepository.findAll()).thenReturn(List.of(promotion));

        BusinessCodeBackfillInitializer initializer = new BusinessCodeBackfillInitializer(
                customerRepository, userRepository, promotionRepository, jdbcTemplate
        );

        initializer.run();

        assertTrue(customer.getCustomerCode().matches("CUS_[0-9A-F]{8}"));
        assertTrue(user.getUserCode().matches("USR_[0-9A-F]{8}"));
        assertTrue(promotion.getPromotionCode().matches("PROM_[0-9A-F]{8}"));
        verify(customerRepository).flush();
        verify(userRepository).flush();
        verify(promotionRepository).flush();
        verify(jdbcTemplate, times(3)).execute(org.mockito.ArgumentMatchers.anyString());
    }
}
