package com.base.dto.response.order;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUpdateOrderStatusResponse {
    private int successCount;
    private int failedCount;
    private List<Long> updatedOrderIds;
    private List<String> errorMessages;
}
