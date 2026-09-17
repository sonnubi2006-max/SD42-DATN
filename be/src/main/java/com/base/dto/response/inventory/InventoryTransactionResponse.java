package com.base.dto.response.inventory;

import com.base.enums.InventoryTransactionType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InventoryTransactionResponse {

    private Long transactionId;

    private Long inventoryId;

    private InventoryTransactionType type;

    private Integer quantity;

    private Integer beforeQuantity;

    private Integer afterQuantity;

    private String referenceCode;

    private LocalDateTime createdAt;
}
