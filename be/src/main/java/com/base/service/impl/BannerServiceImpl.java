package com.base.service.impl;

import com.base.dto.request.ImageUploadBannerMessage;
import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.banner.BannerCreateRequest;
import com.base.dto.request.banner.BannerUpdateRequest;
import com.base.dto.response.banner.BannerResponse;
import com.base.dto.response.banner.BannerStatisticProjection;
import com.base.entity.Banner;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.BannerRepository;
import com.base.service.BannerService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional
public class BannerServiceImpl implements BannerService {
    private final BannerRepository bannerRepository;
    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;

    private final ModelMapper modelMapper;

    @Override
    public Page<BannerResponse> getBanners(String keyword, Boolean isActive, Boolean checkDate, Pageable pageable) {
        return bannerRepository.search(keyword, isActive, checkDate, java.time.LocalDateTime.now(), pageable).map(banner -> modelMapper.map(banner, BannerResponse.class));
    }

    @Override
    public BannerResponse getBanner(Long bannerId) {
        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy Banner: " + bannerId));

        return modelMapper.map(banner, BannerResponse.class);
    }

    @Override
    public BannerStatisticProjection getBannerStatistics() {
        return bannerRepository.getBannerStatistics();
    }

    @Override
    public BannerResponse createBanner(BannerCreateRequest request,
                                       MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn ảnh banner");
        }

        String tempPath = localStorageService.saveTempFile(file);
        String tempUrl = localStorageService.getTempUrl(tempPath);

        Banner banner = modelMapper.map(request, Banner.class);
        banner.setImageUrl(tempUrl);

        banner = bannerRepository.save(banner);

        imageUploadProducer.sendUploadMessage(
                ImageUploadMessage.builder()
                        .id(banner.getBannerId())
                        .table("BANNER")
                        .tempFilePath(tempPath)
                        .action(ImageUploadMessage.ActionType.CREATE_BANNER)
                        .build()
        );

        return modelMapper.map(banner, BannerResponse.class);
    }

    @Override
    public BannerResponse updateBanner(
            Long bannerId,
            BannerUpdateRequest request,
            MultipartFile file) {

        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy Banner: " + bannerId));

        banner.setTitle(request.getTitle());
        banner.setRedirectUrl(request.getRedirectUrl());
        if (request.getIsActive() != null) {
            banner.setIsActive(request.getIsActive());
        }
        banner.setStartDate(request.getStartDate());
        banner.setEndDate(request.getEndDate());

        if (file != null && !file.isEmpty()) {
            String tempPath = localStorageService.saveTempFile(file);
            String tempUrl = localStorageService.getTempUrl(tempPath);

            banner.setImageUrl(tempUrl);

            imageUploadProducer.sendUploadMessage(
                    ImageUploadMessage.builder()
                            .id(banner.getBannerId())
                            .table("BANNER")
                            .tempFilePath(tempPath)
                            .action(ImageUploadMessage.ActionType.UPDATE_BANNER)
                            .build());
        }

        Banner savedBanner = bannerRepository.save(banner);

        return modelMapper.map(savedBanner, BannerResponse.class);
    }

    @Override
    public void deleteBanner(Long bannerId) {
        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy Banner: " + bannerId));

        bannerRepository.delete(banner);
    }

    @Override
    public void updateStatusBanner(Long bannerId) {
        Banner banner = bannerRepository.findById(bannerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Không tìm thấy Banner: " + bannerId));

        banner.setIsActive(!banner.getIsActive());
        bannerRepository.save(banner);
    }
}
