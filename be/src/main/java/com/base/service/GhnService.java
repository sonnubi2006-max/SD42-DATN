package com.base.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface GhnService {
    List<Map<String, Object>> getProvinces();
    List<Map<String, Object>> getProvincesV2();
    List<Map<String, Object>> getDistricts(Integer provinceId);
    List<Map<String, Object>> getWards(Integer districtId);

    List<Map<String, Object>> getWardsByProvince(Integer provinceId);

    List<Map<String, Object>> getWardsV2(Integer provinceCode, String provinceName);
    Map<String, Object> resolveLegacyAddressV2(String wardName, String districtName, String provinceName);
    BigDecimal calculateFee(Integer toDistrictId, String toWardCode, Integer weight);

    String getDistrictNameForWard(String provinceName, String wardName);
    ResolvedAddressNames resolveNames(String provinceCodeStr, String ghnWardCode);
    ResolvedAddressNames resolveNames(Integer ghnProvinceId, Integer ghnDistrictId, String ghnWardCode);
    ResolvedAddressCodes resolveCodes(String provinceName, String districtName, String wardName);

    class ResolvedAddressNames {
        private String provinceName;
        private String districtName;
        private String wardName;

        public ResolvedAddressNames(String provinceName, String districtName, String wardName) {
            this.provinceName = provinceName;
            this.districtName = districtName;
            this.wardName = wardName;
        }

        public String getProvinceName() { return provinceName; }
        public String getDistrictName() { return districtName; }
        public String getWardName() { return wardName; }
    }

    class ResolvedAddressCodes {
        private final Integer provinceId;
        private final Integer districtId;
        private final String wardCode;

        public ResolvedAddressCodes(Integer provinceId, Integer districtId, String wardCode) {
            this.provinceId = provinceId;
            this.districtId = districtId;
            this.wardCode = wardCode;
        }

        public Integer getProvinceId() { return provinceId; }
        public Integer getDistrictId() { return districtId; }
        public String getWardCode() { return wardCode; }

        public boolean isResolved() {
            return provinceId != null && provinceId > 0
                    && districtId != null && districtId > 0
                    && wardCode != null && !wardCode.isBlank();
        }
    }

}
