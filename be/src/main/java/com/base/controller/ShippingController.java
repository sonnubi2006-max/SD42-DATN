package com.base.controller;

import com.base.dto.response.ApiResponse;
import com.base.service.GhnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final GhnService ghnService;

    @GetMapping("/ghn/provinces")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProvinces() {
        return ResponseEntity.ok(ApiResponse.success(ghnService.getProvinces()));
    }

    @GetMapping("/ghn/provinces-v2")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProvincesV2() {
        return ResponseEntity.ok(ApiResponse.success(ghnService.getProvincesV2()));
    }

    @GetMapping("/ghn/districts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDistricts(@RequestParam Integer provinceId) {
        return ResponseEntity.ok(ApiResponse.success(ghnService.getDistricts(provinceId)));
    }

    @GetMapping("/ghn/wards")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWards(@RequestParam Integer districtId) {
        return ResponseEntity.ok(ApiResponse.success(ghnService.getWards(districtId)));
    }

    @GetMapping("/ghn/fee")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateFee(
            @RequestParam Integer toDistrictId,
            @RequestParam String toWardCode,
            @RequestParam(required = false) Integer weight
    ) {
        return ResponseEntity.ok(ApiResponse.success(ghnService.calculateFee(toDistrictId, toWardCode, weight)));
    }

    @GetMapping("/ghn/wards-by-province")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWardsByProvince(
            @RequestParam Integer provinceId
    ) {
        return ResponseEntity.ok(ApiResponse.success(ghnService.getWardsByProvince(provinceId)));
    }

    @GetMapping("/ghn/wards-v2")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWardsV2(
            @RequestParam Integer provinceCode,
            @RequestParam(required = false) String provinceName
    ) {
        return ResponseEntity.ok(ApiResponse.success(ghnService.getWardsV2(provinceCode, provinceName)));
    }

    @GetMapping("/address/resolve-v2")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveLegacyAddressV2(
            @RequestParam String ward,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String province
    ) {
        return ResponseEntity.ok(ApiResponse.success(ghnService.resolveLegacyAddressV2(ward, district, province)));
    }
}
