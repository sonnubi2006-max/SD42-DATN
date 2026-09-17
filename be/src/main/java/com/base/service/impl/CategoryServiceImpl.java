package com.base.service.impl;

import com.base.dto.request.category.CreateCategoryRequest;
import com.base.dto.request.category.UpdateCategoryRequest;
import com.base.dto.response.category.CategoryStatisticProjection;
import com.base.entity.Category;
import com.base.enums.CategoryStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.repository.CategoryRepository;
import com.base.repository.ProductRepository;
import com.base.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ModelMapper modelMapper;

    @Override
    public Page<Category> getCategories(CategoryStatus status, String categoryName, Pageable pageable) {
        return categoryRepository.findCategories(status, categoryName, pageable);
    }

    @Override
    public Category save(CreateCategoryRequest request) {
        request.setCategoryName(validateAndNormalizeName(request.getCategoryName()));

        if (categoryRepository.existsByCategoryName(request.getCategoryName())) {
            throw new BadRequestException("Tên danh mục đã tồn tại");
        }

        Category category = modelMapper.map(request, Category.class);
        category.setCategoryCode(generateCategoryCode());

        return categoryRepository.save(category);
    }

    @Override
    public Category update(Long id, UpdateCategoryRequest request) {
        request.setCategoryName(validateAndNormalizeName(request.getCategoryName()));
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Danh mục", "id", id));

        if (categoryRepository.existsByCategoryNameAndCategoryIdNot(
                request.getCategoryName(), id)) {
            throw new BadRequestException("Tên danh mục đã tồn tại");
        }

        modelMapper.map(request, category);
        category.setCategoryDescription(request.getCategoryDescription());

        if (category.getCategoryCode() == null || category.getCategoryCode().isBlank()) {
            category.setCategoryCode(generateCategoryCode());
        }

        return categoryRepository.save(category);
    }

    private String validateAndNormalizeName(String categoryName) {
        String normalized = categoryName == null
                ? ""
                : categoryName.replaceAll("\\s+", " ").trim();
        if (normalized.length() < 2 || normalized.length() > 100) {
            throw new BadRequestException("Tên danh mục phải từ 2 đến 100 ký tự");
        }
        return normalized;
    }

    private String generateCategoryCode() {
        String code;
        do {
            code = "CAT_" + java.util.UUID.randomUUID()
                    .toString()
                    .substring(0, 8)
                    .toUpperCase();
        } while (categoryRepository.existsByCategoryCode(code));
        return code;
    }

    @Override
    public void delete(Long id) {
        if (productRepository.existsByCategory_CategoryId(id)) {
            throw new BadRequestException(
                    "Không thể xóa danh mục vì đang có sản phẩm thuộc danh mục này"
            );
        }
        categoryRepository.deleteById(id);
    }

    @Override
    public Category findById(Long id) {
        return categoryRepository.findById(id).orElseThrow(() ->
                        new ResourceNotFoundException("Danh mục","id",id));
    }

    @Override
    public CategoryStatisticProjection getCategoryStatistics() {
        return categoryRepository.getCategoryStatistics();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> exportCategories(CategoryStatus status, String keyword, List<Long> ids) {
        if (ids != null && !ids.isEmpty()) {
            return categoryRepository.findAllById(ids);
        }
        return categoryRepository.findCategories(
                status,
                keyword,
                PageRequest.of(0, 999999, Sort.by(Sort.Direction.DESC, "categoryId"))
        ).getContent();
    }
}
