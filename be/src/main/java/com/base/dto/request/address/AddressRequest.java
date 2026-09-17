package com.base.dto.request.address;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {

    @NotBlank
    private String consigneeName;

    @NotBlank
    private String phone;

    @NotBlank
    private String province;

    private String district;

    @NotBlank
    private String ward;

    private Integer ghnProvinceId;

    private Integer ghnDistrictId;

    private String ghnWardCode;

    @NotBlank
    private String streetAddress;

    private Boolean isDefault;

    private String provinceName;

    private String districtName;

    private String wardName;
}
