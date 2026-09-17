package com.base.controller;

import com.base.dto.request.category.CreateCategoryRequest;
import com.base.dto.request.category.UpdateCategoryRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.category.CategoryStatisticProjection;
import com.base.entity.Category;
import com.base.enums.CategoryStatus;
import com.base.excels.CategoryExcelExporter;
import com.base.service.CategoryService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping("/category")
    public ResponseEntity<ApiResponse<Page<Category>>> getAllCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "categoryId") String sort,
            @RequestParam(required = false) CategoryStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort.Direction sortDirection = direction.equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sortBy = Sort.by(sortDirection, sort);
        Pageable pageable = PageRequest.of(page, size, sortBy);
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategories(status, keyword, pageable)));
    }

    @GetMapping("/category/export/excel")
    public void exportToExcel(
            HttpServletResponse response,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "categoryId") String sort,
            @RequestParam(required = false) CategoryStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) List<Long> ids
    ) throws IOException {

        List<Category> categoryList = categoryService.exportCategories(status, keyword, ids);

        response.setContentType("application/octet-stream");

        DateFormat dateFormatter =
                new SimpleDateFormat("yyyy-MM-dd_HH:mm:ss");

        String currentDateTime =
                dateFormatter.format(new Date());

        String headerKey = "Content-Disposition";

        String headerValue =
                "attachment; filename=categories_"
                        + currentDateTime
                        + ".xlsx";

        response.setHeader(headerKey, headerValue);

        CategoryExcelExporter excelExporter =
                new CategoryExcelExporter(categoryList);

        excelExporter.export(response);
    }

    @GetMapping("/category/{id}")
    public ResponseEntity<ApiResponse<Category>> getCategory(@PathVariable Long id) {
        Category category = categoryService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    @PostMapping("/admin/category")
    public ResponseEntity<ApiResponse<Category>> createCategory(@Valid @RequestBody CreateCategoryRequest category) {
        return ResponseEntity.status(HttpStatus.CREATED).body((ApiResponse.success(categoryService.save(category))));
    }

    @PutMapping("/admin/category/{id}")
    public ResponseEntity<ApiResponse<Category>> updateCategory(@PathVariable Long id, @Valid @RequestBody UpdateCategoryRequest category) {
        return ResponseEntity.ok((ApiResponse.success(categoryService.update(id, category))));
    }

    @DeleteMapping("/admin/category/{id}")
    public ResponseEntity<ApiResponse<?>> deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/category/statistics")
    public ResponseEntity<ApiResponse<CategoryStatisticProjection>> getCategoryStatistics() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoryStatistics()));
    }
}
