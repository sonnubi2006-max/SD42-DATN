package com.base.service.impl;

import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.ImageUploadProductMessage;
import com.base.dto.request.product.CreateProductRequest;
import com.base.dto.request.product.UpdateProductRequest;
import com.base.dto.response.brand.BrandResponse;
import com.base.dto.response.category.CategoryResponse;
import com.base.dto.response.product.ProductImageResponse;
import com.base.dto.response.product.ProductResponse;
import com.base.dto.response.product.ProductVariantResponse;
import com.base.entity.Brand;
import com.base.entity.Category;
import com.base.entity.Product;
import com.base.entity.ProductImage;
import com.base.enums.ProductStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.BrandRepository;
import com.base.repository.CategoryRepository;
import com.base.repository.ProductImageRepository;
import com.base.repository.ProductRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.OrderDetailRepository;
import com.base.repository.ReservationRepository;
import com.base.repository.ReturnItemRepository;
import com.base.repository.ExchangeDeliveryDamageRepository;
import com.base.entity.Promotion;
import com.base.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.Map;
import java.util.stream.Collectors;
import java.text.Normalizer;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private static final int MAX_PRODUCT_IMAGES = 5;

    private final ProductRepository      productRepository;
    private final CategoryRepository     categoryRepository;
    private final BrandRepository        brandRepository;
    private final ModelMapper            modelMapper;
    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;
    private final ProductImageRepository imageRepository;
    private final PromotionRepository    promotionRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderDetailRepository    orderDetailRepository;
    private final ReservationRepository    reservationRepository;
    private final ReturnItemRepository      returnItemRepository;
    private final ExchangeDeliveryDamageRepository exchangeDeliveryDamageRepository;

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest request, List<MultipartFile> files) {

        List<MultipartFile> normalizedFiles = normalizeFiles(files);
        if (normalizedFiles.isEmpty()) {
            throw new BadRequestException("Sản phẩm cần ít nhất 1 ảnh");
        }
        if (normalizedFiles.size() > MAX_PRODUCT_IMAGES) {
            throw new BadRequestException("Mỗi sản phẩm chỉ được có tối đa 5 ảnh");
        }

        if (productRepository.existsByProductName(request.getProductName())) {
            throw new ResourceAlreadyExistsException("Tên sản phẩm đã tồn tại: " + request.getProductName());
        }

        String productSlug = toNormalizer(request.getProductName(), "-");

        if (productRepository.existsByProductSlug(productSlug)) {
            throw new ResourceAlreadyExistsException("Tên sản phẩm đã tồn tại: " + request.getProductName());
        }

        Category category = categoryRepository.findById(request.getCategoryId()).orElseThrow(() -> new ResourceNotFoundException("Danh mục không tồn tại!"));

        Brand brand = brandRepository.findById(request.getBrandId()).orElseThrow(() -> new ResourceNotFoundException("Thương hiệu không tồn tại!"));

        String productCode = generateProductCode();

        Product product = new Product();

        product.setProductName(request.getProductName());
        product.setProductCode(productCode);
        product.setProductSlug(productSlug);
        product.setDescription(normalizeOptionalText(request.getDescription()));

        product.setCategory(category);
        product.setBrand(brand);

        product.setProductId(null);
        product.setAverageRating(BigDecimal.ZERO);
        product.setStatus(request.getStatus());

        product = uploadImage(normalizedFiles, product, ImageUploadMessage.ActionType.CREATE_PRODUCT);

        log.info("Created product id={}", product.getProductId());

        return toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return toResponse(findActiveById(id), activePromotions);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getByCode(String productCode) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        Product product = productRepository
                .findByProductCodeAndStatus(productCode, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm!"));
        return toResponse(product, activePromotions);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getByIdAdmin(Long id) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return toResponse(productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm!")), activePromotions);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> filterProducts(Long categoryId, Long brandId,
                                                BigDecimal minPrice, BigDecimal maxPrice,
                                                ProductStatus status, String keyword,
                                                Pageable pageable) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        System.out.println(keyword);
        boolean isPriceAsc = false;
        boolean isPriceDesc = false;
        if (pageable.getSort().isSorted()) {
            for (Sort.Order order : pageable.getSort()) {
                if (order.getProperty().contains("price")) {
                    if (order.getDirection().isAscending()) {
                        isPriceAsc = true;
                    } else {
                        isPriceDesc = true;
                    }
                }
            }
        }

        Page<Product> productPage;
        if (isPriceAsc) {
            Pageable unpagedSort = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
            productPage = productRepository.filterProductsOrderByPriceAsc(categoryId, brandId, minPrice, maxPrice, status, keyword, unpagedSort);
        } else if (isPriceDesc) {
            Pageable unpagedSort = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
            productPage = productRepository.filterProductsOrderByPriceDesc(categoryId, brandId, minPrice, maxPrice, status, keyword, unpagedSort);
        } else {
            productPage = productRepository.filterProducts(categoryId, brandId, minPrice, maxPrice, status, keyword, pageable);
        }

        return productPage.map(p -> toResponse(p, activePromotions));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getTopRated(int limit) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return productRepository
                .findTop10HighestRatedProducts(PageRequest.of(0, 10))
                .stream()
                .limit(limit)
                .map(p -> toResponse(p, activePromotions))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getBestSellers(int limit) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return productRepository
                .findTopSellingProducts(PageRequest.of(0, limit))
                .stream()
                .map(p -> toResponse(p, activePromotions))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getDeleted(Pageable pageable) {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDateTime.now());
        return productRepository
                .findAllByStatus(ProductStatus.INACTIVE, pageable)
                .map(p -> toResponse(p, activePromotions));
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, UpdateProductRequest request, List<MultipartFile> files) {

        Product product = findById(id);
        List<MultipartFile> normalizedFiles = normalizeFiles(files);
        Set<Long> imageIdsToDelete = request.getImagesDelete() == null
                ? Collections.emptySet()
                : new LinkedHashSet<>(request.getImagesDelete());
        Set<Long> currentImageIds = product.getImages().stream()
                .map(ProductImage::getImageId)
                .collect(Collectors.toSet());
        if (!currentImageIds.containsAll(imageIdsToDelete)) {
            throw new BadRequestException("Có ảnh cần xóa không thuộc sản phẩm này");
        }
        int finalImageCount = currentImageIds.size() - imageIdsToDelete.size() + normalizedFiles.size();
        if (finalImageCount > MAX_PRODUCT_IMAGES) {
            throw new BadRequestException("Mỗi sản phẩm chỉ được có tối đa 5 ảnh, tính cả ảnh hiện có");
        }
        if (finalImageCount < 1) {
            throw new BadRequestException("Sản phẩm cần ít nhất 1 ảnh");
        }

        if (productRepository.existsByProductNameAndProductIdNot(request.getProductName(), id)) {
            throw new ResourceAlreadyExistsException("Tên sản phẩm đã tồn tại: " + request.getProductName());
        }

        String productSlug = toNormalizer(request.getProductName(), "-");

        if (productRepository.existsByProductSlugAndProductIdNot(productSlug, id)) {
            throw new ResourceAlreadyExistsException("Tên sản phẩm đã tồn tại: " + request.getProductName());
        }

        if (request.getProductName() != null) {
            product.setProductName(request.getProductName());
            product.setProductSlug(productSlug);
        }

        product.setDescription(normalizeOptionalText(request.getDescription()));

        if (request.getCategoryId() != null) {
            product.setCategory(resolveCategory(request.getCategoryId()));
        }

        if (request.getBrandId() != null) {
            product.setBrand(resolveBrand(request.getBrandId()));
        }

        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        if (!imageIdsToDelete.isEmpty()) {
            deleteImage(imageIdsToDelete, product);
        }
        product = uploadImage(normalizedFiles, product, ImageUploadMessage.ActionType.UPDATE_PRODUCT);

        return toResponse(product);
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void deleteImage(Set<Long> imageIds, Product product) {
            for (Long imageId : imageIds) {
                ProductImage image = product.getImages().stream()
                        .filter(item -> imageId.equals(item.getImageId()))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException("Ảnh không thuộc sản phẩm này"));
                imageUploadProducer.sendUploadMessage(
                        ImageUploadMessage.builder()
                                .id(imageId)
                                .table("PRODUCT")
                                .oldImageUrl(image.getImageUrl())
                                .action(ImageUploadMessage.ActionType.DELETE_PRODUCT)
                                .build()
                );
            }
            product.getImages().removeIf(image -> imageIds.contains(image.getImageId()));
    }

    private List<MultipartFile> normalizeFiles(List<MultipartFile> files) {
        if (files == null) return List.of();
        return files.stream()
                .filter(Objects::nonNull)
                .filter(file -> !file.isEmpty())
                .toList();
    }

    private Product uploadImage(List<MultipartFile> files, Product product, ImageUploadMessage.ActionType type) {
        product = productRepository.save(product);

        if (files != null && !files.isEmpty()) {

            for (MultipartFile file : files) {
                String tempPath = localStorageService.saveTempFile(file);
                String tempUrl = localStorageService.getTempUrl(tempPath);

                ProductImage image = ProductImage.builder()
                        .product(product)
                        .imageUrl(tempUrl)
                        .thumbnail(false)
                        .build();
                image = imageRepository.save(image);

                imageUploadProducer.sendUploadMessage(
                        ImageUploadMessage.builder()
                                .id(image.getImageId())
                                .table("PRODUCT")
                                .tempFilePath(tempPath)
                                .action(type ==
                                        ImageUploadMessage.ActionType.CREATE_PRODUCT
                                        ? ImageUploadMessage.ActionType.CREATE_PRODUCT
                                        : ImageUploadMessage.ActionType.UPDATE_PRODUCT
                                )
                                .build()
                );

                product.getImages().add(image);
            }
        }
        return product;
    }

    @Override
    @Transactional
    public ProductResponse changeStatus(Long id, ProductStatus status) {
        Product product = productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm!"));
        product.setStatus(status);
        return toResponse(productRepository.save(product));
    }

    @Override
    @Transactional
    public void restoreProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));

        if (!product.getStatus().equals(ProductStatus.INACTIVE)) {
            throw new BadRequestException("Sản phẩm chưa bị xóa: " + id);
        }

        product.setStatus(ProductStatus.ACTIVE);
        productRepository.save(product);
        log.info("Restored product id={}", id);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = findActiveById(id);
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
        log.info("Soft-deleted product id={}", id);
    }

    @Override
    @Transactional
    public void bulkDelete(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return;

        List<Product> products = productRepository.findAllById(ids)
                .stream()
                .filter(p -> !p.getStatus().equals(ProductStatus.INACTIVE))
                .toList();

        products.forEach(p -> p.setStatus(ProductStatus.INACTIVE));
        productRepository.saveAll(products);
        log.info("Bulk soft-deleted {} products", products.size());
    }

    @Override
    @Transactional
    public void bulkUpdateStatus(List<Long> ids, ProductStatus status) {
        if (ids == null || ids.isEmpty()) return;

        List<Product> products = productRepository.findAllById(ids)
                .stream()
                .toList();

        products.forEach(p -> p.setStatus(status));
        productRepository.saveAll(products);
        log.info("Bulk updated status={} for {} products", status, products.size());
    }

    @Override
    @Transactional
    public void updateRating(Long productId, BigDecimal newRating) {

        log.info("Updated rating for product id={}:",
                productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> exportProducts(Long categoryId, Long brandId, BigDecimal minPrice, BigDecimal maxPrice,
                                        ProductStatus status, String keyword, List<Long> ids) {

        if (ids != null && !ids.isEmpty()) {
            return productRepository.findAllById(ids);
        }

        return productRepository.filterProductsForExport(
                categoryId,
                brandId,
                minPrice,
                maxPrice,
                status,
                keyword
        );
    }

    private Product findActiveById(Long id) {
        return productRepository.findByProductIdAndStatus(id, ProductStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));
    }

    private Product findById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + id));
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục: " + categoryId));
    }

    private Brand resolveBrand(Long brandId) {
        if (brandId == null) return null;
        return brandRepository.findById(brandId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thương hiệu: " + brandId));
    }

    private String toNormalizer(String s, String type) {
        return Normalizer
                .normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim()
                .toLowerCase()
                .replaceAll("\\s+", type);
    }

    private String generateProductCode() {
        String code;

        do {
            code = "PROD_" + UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();

        } while (productRepository.existsByProductCode(code));

        return code;
    }

    private ProductResponse toResponse(Product product) {
        return toResponse(product, promotionRepository.findActivePromotions(LocalDateTime.now()));
    }

    private ProductResponse toResponse(Product product, List<Promotion> activePromotions) {

        ProductResponse response = modelMapper.map(product, ProductResponse.class);

        Map<Long, Long> deliveryDamageByVariant = orderDetailRepository
                .findDamageTotalsByProductId(product.getProductId()).stream()
                .collect(Collectors.toMap(OrderDetailRepository.VariantDamageTotal::getVariantId,
                        OrderDetailRepository.VariantDamageTotal::getDamagedQuantity));
        Map<Long, Long> exchangeDamageByVariant = returnItemRepository
                .findCompletedDamageTotalsByProductId(product.getProductId()).stream()
                .collect(Collectors.toMap(ReturnItemRepository.VariantDamageTotal::getVariantId,
                        ReturnItemRepository.VariantDamageTotal::getDamagedQuantity));
        Map<Long, Long> exchangeDeliveryDamageByVariant = exchangeDeliveryDamageRepository
                .findDamageTotalsByProductId(product.getProductId()).stream()
                .collect(Collectors.toMap(
                        ExchangeDeliveryDamageRepository.VariantDamageTotal::getVariantId,
                        ExchangeDeliveryDamageRepository.VariantDamageTotal::getDamagedQuantity));

        Long totalSold = orderDetailRepository.sumSoldQuantityByProduct(product.getProductId());
        response.setTotalSold(totalSold);
        int totalDamaged = product.getVariants() == null ? 0 : product.getVariants().stream()
                .mapToInt(v -> Math.toIntExact(deliveryDamageByVariant.getOrDefault(v.getVariantId(), 0L)
                        + exchangeDamageByVariant.getOrDefault(v.getVariantId(), 0L)
                        + exchangeDeliveryDamageByVariant.getOrDefault(v.getVariantId(), 0L))).sum();
        response.setDamagedQuantity(totalDamaged);

        if (product.getCategory() != null) {
            response.setCategory(modelMapper.map(product.getCategory(), CategoryResponse.class));
        }

        if (product.getBrand() != null) {
            response.setBrand(modelMapper.map(product.getBrand(), BrandResponse.class));
        }

        if (product.getImages() != null) {
            response.setImages(
                    product.getImages().stream()
                            .map(img -> modelMapper.map(img, ProductImageResponse.class))
                            .collect(Collectors.toList())
            );
        }

        if (product.getVariants() != null) {
            response.setVariants(
                    product.getVariants().stream()
                            .map(v -> {
                                ProductVariantResponse varRes = new ProductVariantResponse();
                                varRes.setVariantId(v.getVariantId());
                                varRes.setVariantCode(v.getVariantCode());
                                varRes.setSize(v.getSize());
                                varRes.setColor(v.getColor());
                                varRes.setPrice(v.getPrice());
                                varRes.setBarcode(v.getBarcode());
                                varRes.setStatus(v.getStatus());
                                int activePosReservations = reservationRepository
                                        .sumActivePosQuantityByVariantId(v.getVariantId());
                                int activeOnlineReservations = reservationRepository
                                        .sumActiveOnlineQuantityByVariantId(v.getVariantId());
                                int deductedReservations = v.getReservedQuantity() != null
                                        ? v.getReservedQuantity() : 0;
                                int posSellableStock = Math.max(
                                        0,
                                        v.getAvailableStock()
                                                + deductedReservations
                                                - activePosReservations);
                                varRes.setStockQuantity(posSellableStock);
                                varRes.setAvailableStock(Math.max(
                                        0, posSellableStock - activeOnlineReservations));
                                long deliveryDamaged = deliveryDamageByVariant.getOrDefault(v.getVariantId(), 0L);
                                long exchangeDamaged = exchangeDamageByVariant.getOrDefault(v.getVariantId(), 0L);
                                long exchangeDeliveryDamaged = exchangeDeliveryDamageByVariant
                                        .getOrDefault(v.getVariantId(), 0L);
                                varRes.setDamagedQuantity(Math.toIntExact(
                                        deliveryDamaged + exchangeDamaged + exchangeDeliveryDamaged));
                                if (v.getImage() != null) {
                                    varRes.setImage(modelMapper.map(v.getImage(), ProductImageResponse.class));
                                }

                                varRes.setProductName(product.getProductName());
                                varRes.setProductCode(product.getProductCode());
                                varRes.setProductId(product.getProductId());

                                BigDecimal originalPrice = v.getPrice();
                                BigDecimal salePrice = originalPrice;
                                Integer discountPercentage = 0;

                                if (activePromotions != null && !activePromotions.isEmpty() && originalPrice != null) {
                                    Promotion bestPromo = null;
                                    BigDecimal bestPrice = originalPrice;

                                    for (Promotion p : activePromotions) {
                                        Long categoryId = product.getCategory() != null ? product.getCategory().getCategoryId() : null;

                                        if (p.appliesToVariant(v.getVariantId(), product.getProductId(), categoryId)) {
                                            BigDecimal promoPrice;
                                            if (p.isPercentage()) {
                                                BigDecimal discount = originalPrice.multiply(p.getDiscountValue())
                                                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                                                if (p.getMaxDiscountAmount() != null) {
                                                    discount = discount.min(p.getMaxDiscountAmount());
                                                }
                                                promoPrice = originalPrice.subtract(discount).max(BigDecimal.ZERO);
                                            } else {
                                                promoPrice = originalPrice.subtract(p.getDiscountValue()).max(BigDecimal.ZERO);
                                            }

                                            if (promoPrice.compareTo(bestPrice) < 0) {
                                                bestPrice = promoPrice;
                                                bestPromo = p;
                                            }
                                        }
                                    }

                                    if (bestPromo != null) {
                                        salePrice = bestPrice;
                                        if (originalPrice.compareTo(BigDecimal.ZERO) > 0) {
                                            BigDecimal discountAmt = originalPrice.subtract(salePrice);
                                            discountPercentage = discountAmt.multiply(BigDecimal.valueOf(100))
                                                    .divide(originalPrice, 0, RoundingMode.HALF_UP)
                                                    .intValue();
                                        }
                                    }
                                }

                                varRes.setSalePrice(salePrice);
                                varRes.setDiscountPercentage(discountPercentage);

                                return varRes;
                            })
                            .collect(Collectors.toList())
            );
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Map<String, BigDecimal> getActivePriceRange() {
        List<Object[]> result = productVariantRepository.getActivePriceRange();
        java.util.Map<String, BigDecimal> range = new java.util.HashMap<>();
        if (result != null && !result.isEmpty() && result.get(0) != null) {
            Object[] row = result.get(0);
            BigDecimal min = (BigDecimal) row[0];
            BigDecimal max = (BigDecimal) row[1];
            range.put("min", min != null ? min : BigDecimal.ZERO);
            range.put("max", max != null ? max : BigDecimal.ZERO);
        } else {
            range.put("min", BigDecimal.ZERO);
            range.put("max", BigDecimal.ZERO);
        }
        return range;
    }
}
