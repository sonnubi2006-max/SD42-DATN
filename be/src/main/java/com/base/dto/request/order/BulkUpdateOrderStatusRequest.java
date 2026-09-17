package com.base.dto.request.order;

import com.base.enums.OrderStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkUpdateOrderStatusRequest {

    @NotEmpty(message = "Danh sách mã đơn hàng không được để trống")
    private List<Long> orderIds;

    @NotNull(message = "Trạng thái đơn hàng không được để trống")
    private OrderStatus orderStatus;

    private String note;
}
