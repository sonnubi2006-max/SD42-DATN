package com.base.service.impl;

import com.base.dto.request.ImageUploadBannerMessage;
import com.base.dto.request.ImageUploadBrandMessage;
import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.brand.CreateBrandRequest;
import com.base.dto.request.brand.UpdateBrandRequest;
import com.base.dto.response.brand.BrandStatisticProjection;
import com.base.entity.Banner;
import com.base.entity.Brand;
import com.base.enums.BrandStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.BrandRepository;
import com.base.repository.ProductRepository;
import com.base.service.BrandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BrandServiceImpl implements BrandService {
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ModelMapper modelMapper;
    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;

    @Override
    public Page<Brand> getBrands(BrandStatus status, String keyword, Pageable pageable) {
        return brandRepository.findBrands(status, keyword, pageable);
    }

    @Override
    public Brand save(CreateBrandRequest request, MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Ảnh không được để trống");
        }

        if (brandRepository.existsByBrandName(request.getBrandName())) {
            throw new BadRequestException("Tên thương hiệu đã tồn tại");
        }

        String tempPath = localStorageService.saveTempFile(file);
        String tempUrl = localStorageService.getTempUrl(tempPath);

        Brand brand = modelMapper.map(request, Brand.class);
        brand.setBrandLogo(tempUrl);
        brand.setBrandStatus(request.getBrandStatus());
        brand.setBrandCode(generateBrandCode());

        brand = brandRepository.save(brand);

        imageUploadProducer.sendUploadMessage(
                ImageUploadMessage.builder()
                        .id(brand.getBrandId())
                        .table("BRAND")
                        .tempFilePath(tempPath)
                        .action(ImageUploadMessage.ActionType.CREATE_BRAND)
                        .build()
        );

        return brandRepository.save(brand);
    }

    @Override
    public Brand update(Long id, UpdateBrandRequest request, MultipartFile file) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Thương hiệu", "id", id));

        if (brandRepository.existsByBrandNameAndBrandIdNot(
                request.getBrandName(), id)) {
            throw new BadRequestException("Tên thương hiệu đã tồn tại");
        }

        if(file != null && !file.isEmpty()) {
            String tempPath = localStorageService.saveTempFile(file);
            String tempUrl = localStorageService.getTempUrl(tempPath);

            brand.setBrandLogo(tempUrl);

            imageUploadProducer.sendUploadMessage(
                    ImageUploadMessage.builder()
                            .id(brand.getBrandId())
                            .table("BRAND")
                            .tempFilePath(tempPath)
                            .action(ImageUploadMessage.ActionType.UPDATE_BRAND)
                            .build()
            );
        }
        brand.setBrandName(request.getBrandName());
        brand.setBrandStatus(request.getBrandStatus());

        if (brand.getBrandCode() == null || brand.getBrandCode().isBlank()) {
            brand.setBrandCode(generateBrandCode());
        }

        log.info("Update brand={}", brand.getBrandId());
        return brandRepository.save(brand);
    }

    private String generateBrandCode() {
        String code;
        do {
            code = "BRD_" + java.util.UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();
        } while (brandRepository.existsByBrandCode(code));
        return code;
    }

    @Override
    public void delete(Long id) {
        if (productRepository.existsByBrand_BrandId(id)) {
            throw new BadRequestException(
                    "Không thể xóa thương hiệu vì đang có sản phẩm thuộc thương hiệu này"
            );
        }
        brandRepository.deleteById(id);
    }

    @Override
    public Brand findById(Long id) {
        return brandRepository.findById(id).orElseThrow(() ->
                new ResourceNotFoundException("Thương hiệu","id",id));
    }

    @Override
    public BrandStatisticProjection getBrandStatistics() {
        return brandRepository.getBrandStatistics();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Brand> exportBrands(BrandStatus status, String keyword, List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            return brandRepository.findAllById(ids);
        }
        return brandRepository.findBrands(
                status,
                keyword,
                PageRequest.of(0, 999999, Sort.by(Sort.Direction.DESC, "brandId"))
        ).getContent();
    }
}
