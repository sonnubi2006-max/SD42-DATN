package com.base.service;

import com.base.dto.request.banner.BannerCreateRequest;
import com.base.dto.request.banner.BannerUpdateRequest;
import com.base.dto.response.banner.BannerResponse;
import com.base.dto.response.banner.BannerStatisticProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface BannerService {
    Page<BannerResponse> getBanners(String keyword, Boolean isActive, Boolean checkDate, Pageable pageable);

    BannerResponse getBanner(Long bannerId);

    BannerStatisticProjection getBannerStatistics();

    BannerResponse createBanner(BannerCreateRequest banner, MultipartFile image);

    BannerResponse updateBanner(Long bannerId, BannerUpdateRequest banner, MultipartFile image);

    void deleteBanner(Long bannerId);

    void updateStatusBanner(Long bannerId);
}
