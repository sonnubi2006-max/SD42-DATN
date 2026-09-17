package com.base.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RedisInventoryClaimService {

    private static final String CLAIM_SCRIPT = """
        local stockKey = KEYS[1]
        local claimKey = KEYS[2]
        local claimant = ARGV[1]
        local qty = tonumber(ARGV[2])

        if qty <= 0 then
          return 1
        end

        local stock = tonumber(redis.call('GET', stockKey) or '0')
        if stock < qty then
          return 0
        end

        if redis.call('SISMEMBER', claimKey, claimant) == 1 then
          return 1
        end

        redis.call('DECRBY', stockKey, qty)
        redis.call('SADD', claimKey, claimant)
        return 1
        """;

    private static final String RELEASE_SCRIPT = """
        local stockKey = KEYS[1]
        local claimKey = KEYS[2]
        local claimant = ARGV[1]
        local qty = tonumber(ARGV[2])

        if qty <= 0 then
          return 1
        end

        if redis.call('SISMEMBER', claimKey, claimant) == 0 then
          return 0
        end

        redis.call('SREM', claimKey, claimant)
        redis.call('INCRBY', stockKey, qty)
        return 1
        """;

    private final StringRedisTemplate stringRedisTemplate;

    private final DefaultRedisScript<Long> claimScript = new DefaultRedisScript<>(CLAIM_SCRIPT, Long.class);
    private final DefaultRedisScript<Long> releaseScript = new DefaultRedisScript<>(RELEASE_SCRIPT, Long.class);

    public void synchronizeStock(Long variantId, int currentStock) {
        String stockKey = buildStockKey(variantId);
        stringRedisTemplate.opsForValue().set(stockKey, String.valueOf(Math.max(0, currentStock)));
    }

    public boolean claimStock(Long variantId, String claimantKey, int quantity) {
        if (quantity <= 0) {
            return true;
        }

        Long result = stringRedisTemplate.execute(
                claimScript,
                List.of(buildStockKey(variantId), buildClaimKey(variantId)),
                claimantKey,
                String.valueOf(quantity)
        );

        return result != null && result == 1L;
    }

    public boolean releaseStock(Long variantId, String claimantKey, int quantity) {
        if (quantity <= 0) {
            return true;
        }

        Long result = stringRedisTemplate.execute(
                releaseScript,
                List.of(buildStockKey(variantId), buildClaimKey(variantId)),
                claimantKey,
                String.valueOf(quantity)
        );

        return result != null && result == 1L;
    }

    private String buildStockKey(Long variantId) {
        return "inventory:variant:" + variantId + ":stock";
    }

    private String buildClaimKey(Long variantId) {
        return "inventory:variant:" + variantId + ":claims";
    }
}
