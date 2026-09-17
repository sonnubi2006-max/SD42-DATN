package com.base.service;

import com.base.dto.request.product.ProductVariantRequest;
import com.base.dto.response.product.ProductImageResponse;
import com.base.dto.response.product.ProductResponse;
import com.base.dto.response.product.ProductVariantResponse;
import com.base.dto.response.product.VariantDamageResponse;
import com.base.entity.ProductVariant;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface ProductVariantService {

    ProductVariantResponse addVariant(Long productId, ProductVariantRequest request, MultipartFile file);

    List<ProductVariantResponse> addVariantsBulk(Long productId,
                                                 List<ProductVariantRequest> requests,
                                                 List<MultipartFile> files);

    ProductVariantResponse findByBarcode(String barcode);

    ProductVariantResponse findById(Long variantId);

    VariantDamageResponse getDamageHistory(Long variantId, String keyword, String source,
                                           LocalDateTime fromDate, LocalDateTime toDate,
                                           int page, int size);

    byte[] generateVariantQrCode(Long variantId);

    ProductVariantResponse updateVariant(Long variantId, ProductVariantRequest request, MultipartFile file);

    void deleteVariant(Long variantId);

    ProductVariantResponse updateVariantStatus(Long variantId, ProductVariantStatus status);

    List<ProductVariantResponse> getVariantsByProduct(Long productId);

    void bulkDelete(List<Long> ids);
    void bulkUpdateStatus(List<Long> ids, ProductVariantStatus status);
    void restoreProduct(Long id);

    Page<ProductVariantResponse> filterProductVariants(
            String keyword,
            Long productId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ProductVariantStatus status,
            Pageable pageable
    );
}
