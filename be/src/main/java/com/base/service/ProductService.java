package com.base.service;

import com.base.dto.request.product.CreateProductRequest;
import com.base.dto.request.product.UpdateProductRequest;
import com.base.dto.response.product.ProductResponse;
import com.base.entity.Product;
import com.base.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {

    ProductResponse createProduct(CreateProductRequest request, List<MultipartFile> files);
    ProductResponse getById(Long id);
    ProductResponse getByCode(String productCode);
    ProductResponse getByIdAdmin(Long id);
    ProductResponse updateProduct(Long id, UpdateProductRequest request, List<MultipartFile> files);
    void deleteProduct(Long id);
    void restoreProduct(Long id);

    Page<ProductResponse> filterProducts(Long categoryId, Long brandId,
                                         BigDecimal minPrice, BigDecimal maxPrice,
                                         ProductStatus status, String keyword,
                                         Pageable pageable);

    ProductResponse changeStatus(Long id, ProductStatus status);

    void bulkDelete(List<Long> ids);
    void bulkUpdateStatus(List<Long> ids, ProductStatus status);

    void updateRating(Long productId, BigDecimal newRating);

    List<ProductResponse> getTopRated(int limit);
    List<ProductResponse> getBestSellers(int limit);
    Page<ProductResponse> getDeleted(Pageable pageable);

    List<Product> exportProducts(Long categoryId, Long brandId, BigDecimal minPrice, BigDecimal maxPrice,
                                 ProductStatus status, String keyword, List<Long> ids);

    java.util.Map<String, BigDecimal> getActivePriceRange();
}
