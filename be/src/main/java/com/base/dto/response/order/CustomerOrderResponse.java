package com.base.dto.response.order;

import com.base.dto.response.address.AddressResponse;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CustomerOrderResponse {
    private Long customerId;
    private String fullName;
    private String phone;
    private AddressResponse address;
}
