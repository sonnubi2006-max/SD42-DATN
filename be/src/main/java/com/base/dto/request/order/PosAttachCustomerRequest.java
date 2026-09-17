package com.base.dto.request.order;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PosAttachCustomerRequest {

    private Long customerId;

    @Email(message = "Email không hợp lệ")
    private String email;

    private String fullName;

    private String phone;

    private Boolean clear;
}
