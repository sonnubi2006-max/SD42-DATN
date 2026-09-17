package com.base.dto.request.returnRequest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import com.base.dto.request.order.OrderAddressRequest;
import com.base.enums.ExchangeFulfillmentMethod;

@Data
public class CreateReturnRequest {

    @NotNull(message = "Đơn hàng không được để trống")
    private Long orderId;

    private String orderCode;

    @NotBlank(message = "Tên khách hàng không được để trống")
    @Size(max = 100, message = "Tên khách hàng không được vượt quá 100 ký tự")
    private String customerName;

    @NotBlank(message = "Số điện thoại khách hàng không được để trống")
    @Pattern(regexp = "^0[35789]\\d{8}$", message = "Số điện thoại khách hàng không hợp lệ")
    private String customerPhone;

    private BigDecimal refundAmount;

    private com.base.enums.ReturnType returnType;

    private String note;

    private String images;

    @Valid
    @NotEmpty(message = "Danh sách sản phẩm trả không được để trống")
    private List<CreateReturnItemRequest> items;

    @Valid
    private List<CreateExchangeItemRequest> exchangeItems;

    private ExchangeFulfillmentMethod exchangeFulfillmentMethod;

    private BigDecimal exchangeShippingFee;

    @Valid
    private OrderAddressRequest exchangeDeliveryAddress;
}
