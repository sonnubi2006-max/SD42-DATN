package com.base.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RedisInventoryClaimServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private RedisInventoryClaimService inventoryClaimService;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        inventoryClaimService = new RedisInventoryClaimService(stringRedisTemplate);
    }

    @Test
    void synchronizeStock_shouldOverwriteStaleRedisStockWithDatabaseStock() {
        inventoryClaimService.synchronizeStock(20L, 5);

        verify(valueOperations).set("inventory:variant:20:stock", "5");
    }
}
