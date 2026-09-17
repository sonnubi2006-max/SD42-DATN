package com.base.service;

import com.base.dto.request.category.CreateCategoryRequest;
import com.base.dto.request.category.UpdateCategoryRequest;
import com.base.dto.response.category.CategoryStatisticProjection;
import com.base.entity.Category;
import com.base.enums.CategoryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {
    Page<Category> getCategories(CategoryStatus status, String categoryName, Pageable pageable);
    Category save(CreateCategoryRequest category);
    Category update(Long id, UpdateCategoryRequest category);
    void delete(Long id);
    Category findById(Long id);
    CategoryStatisticProjection getCategoryStatistics();
    List<Category> exportCategories(CategoryStatus status, String keyword, List<Long> ids);
}
