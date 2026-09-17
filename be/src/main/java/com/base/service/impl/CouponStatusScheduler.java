package com.base.service.impl;

import com.base.service.CouponService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CouponStatusScheduler {

    private final CouponService couponService;

    @Scheduled(cron = "0 7 3 * * *")
    public void refreshDaily() {
        int changed = couponService.refreshAllStatuses();
        log.info("[PHIẾU GIẢM GIÁ] Tác vụ cập nhật trạng thái hằng ngày: {} phiếu thay đổi", changed);
    }
}
