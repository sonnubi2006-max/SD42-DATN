package com.base.dto.response.category;

public interface CategoryStatisticProjection {

    Long getTotalCategories();

    Long getActiveCategories();

    Long getInactiveCategories();
}