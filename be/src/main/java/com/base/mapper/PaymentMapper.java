package com.base.mapper;

import com.base.dto.response.payment.PaymentResponse;
import com.base.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PaymentMapper {

    private final ModelMapper modelMapper;

    public PaymentResponse toResponse(Payment payment) {
        PaymentResponse res = modelMapper.map(payment, PaymentResponse.class);

        if (payment.getOrder() != null) {
            res.setOrderId(payment.getOrder().getOrderId());
            res.setOrderCode(payment.getOrder().getOrderCode());
        }

        return res;
    }
}
