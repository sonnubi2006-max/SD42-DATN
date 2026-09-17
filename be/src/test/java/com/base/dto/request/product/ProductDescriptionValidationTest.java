package com.base.dto.request.product;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductDescriptionValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();
    }

    @Test
    void createProductAllowsBlankDescription() {
        CreateProductRequest request = new CreateProductRequest();
        request.setProductName("Áo sơ mi");
        request.setDescription("   ");

        assertTrue(validator.validate(request).isEmpty());
    }

    @Test
    void updateProductAllowsBlankDescription() {
        UpdateProductRequest request = new UpdateProductRequest();
        request.setProductName("Áo sơ mi");
        request.setDescription("");

        assertTrue(validator.validate(request).isEmpty());
    }
}
