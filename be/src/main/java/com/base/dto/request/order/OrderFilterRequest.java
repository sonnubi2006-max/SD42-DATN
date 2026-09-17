package com.base.dto.request.order;

import com.base.enums.OrderStatus;
import com.base.enums.OrderDateBasis;
import com.base.enums.OrderType;
import com.base.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Getter @Setter
public class OrderFilterRequest {

    private String keyword;          

    private OrderStatus orderStatus;

    private OrderType orderType;

    private PaymentMethod paymentMethod;

    private Long userId;

    private Long staffId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime toDate;

    private OrderDateBasis dateBasis = OrderDateBasis.CREATED;

    private int page    = 0;
    private int size    = 20;
    private String sortBy  = "createdAt";
    private String sortDir = "desc";
}
