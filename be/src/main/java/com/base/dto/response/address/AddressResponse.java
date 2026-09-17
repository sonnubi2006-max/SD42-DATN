package com.base.dto.response.address;

import lombok.Data;

@Data
public class AddressResponse {

    private Long addressId;

    private String consigneeName;

    private String phone;

    private String province;

    private String district;

    private String ward;

    private Integer ghnProvinceId;

    private Integer ghnDistrictId;

    private String ghnWardCode;

    private String streetAddress;

    private Boolean isDefault;

    private String provinceName;

    private String districtName;

    private String wardName;
}
