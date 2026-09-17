package com.base.entity;

import jakarta.persistence.Column;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReturnUnicodeColumnMappingTest {

    @Test
    void mapsReturnTextFieldsToNvarchar() throws NoSuchFieldException {
        assertColumnDefinition(ReturnRequest.class, "orderCode", "NVARCHAR(255)");
        assertColumnDefinition(ReturnRequest.class, "customerName", "NVARCHAR(55)");
        assertColumnDefinition(ReturnRequest.class, "customerPhone", "NVARCHAR(255)");
        assertColumnDefinition(ReturnRequest.class, "status", "NVARCHAR(255)");
        assertColumnDefinition(ReturnRequest.class, "returnType", "NVARCHAR(255)");
        assertColumnDefinition(ReturnRequest.class, "note", "NVARCHAR(MAX)");
        assertColumnDefinition(ReturnRequest.class, "rejectReason", "NVARCHAR(MAX)");

        assertColumnDefinition(ReturnItem.class, "productName", "NVARCHAR(255)");
        assertColumnDefinition(ReturnItem.class, "sku", "NVARCHAR(255)");
        assertColumnDefinition(ReturnItem.class, "color", "NVARCHAR(25)");
        assertColumnDefinition(ReturnItem.class, "size", "NVARCHAR(25)");
        assertColumnDefinition(ReturnItem.class, "reason", "NVARCHAR(MAX)");

        assertColumnDefinition(ExchangeItem.class, "newProductName", "NVARCHAR(255)");
        assertColumnDefinition(ExchangeItem.class, "newColor", "NVARCHAR(25)");
        assertColumnDefinition(ExchangeItem.class, "newSize", "NVARCHAR(25)");
    }

    private void assertColumnDefinition(
            Class<?> entityType,
            String fieldName,
            String expectedDefinition
    ) throws NoSuchFieldException {
        Field field = entityType.getDeclaredField(fieldName);
        Column column = field.getAnnotation(Column.class);

        assertEquals(expectedDefinition, column.columnDefinition());
    }
}
