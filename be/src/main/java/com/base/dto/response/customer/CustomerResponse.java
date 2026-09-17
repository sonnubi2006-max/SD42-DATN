package com.base.dto.response.customer;

import com.base.dto.response.address.AddressResponse;
import com.base.enums.CustomerSource;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CustomerResponse {
    private Long customerId;
    private String customerCode;
    private String email;
    private String fullName;
    private String phone;
    private String gender;
    private LocalDate birthday;
    private String avatar;
    private CustomerSource source;
    private String status;
    private Boolean emailSubscribed;
    private AddressResponse address;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
