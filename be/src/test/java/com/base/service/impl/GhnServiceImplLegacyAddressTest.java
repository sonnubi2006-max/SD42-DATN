package com.base.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GhnServiceImplLegacyAddressTest {

    @Test
    void resolvesLegacyDuyHaiAddressToDuyHaNinhBinh() {
        RestTemplate restTemplate = mock(RestTemplate.class);
        GhnServiceImpl service = new GhnServiceImpl(restTemplate);

        when(restTemplate.getForObject(any(URI.class), eq(List.class))).thenReturn(List.of(
                Map.of(
                        "source_code", 13342,
                        "ward", Map.of(
                                "name", "Phường Duy Hà",
                                "code", 13336,
                                "province_code", 37
                        )
                ),
                Map.of(
                        "source_code", 20638,
                        "ward", Map.of(
                                "name", "Xã Duy Nghĩa",
                                "code", 20635,
                                "province_code", 48
                        )
                )
        ));
        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v1/w/13342", Map.class
        )).thenReturn(Map.of("name", "Phường Duy Hải", "district_code", 349));
        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v1/d/349", Map.class
        )).thenReturn(Map.of("name", "Thị xã Duy Tiên", "province_code", 35));
        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v1/p/35", Map.class
        )).thenReturn(Map.of("name", "Tỉnh Hà Nam"));

        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v1/w/20638", Map.class
        )).thenReturn(Map.of("name", "Xã Duy Hải", "district_code", 497));
        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v1/d/497", Map.class
        )).thenReturn(Map.of("name", "Huyện Duy Xuyên", "province_code", 49));
        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v1/p/49", Map.class
        )).thenReturn(Map.of("name", "Tỉnh Quảng Nam"));

        when(restTemplate.getForObject(
                "https://provinces.open-api.vn/api/v2/p/", List.class
        )).thenReturn(List.of(
                Map.of("name", "Tỉnh Ninh Bình", "code", 37),
                Map.of("name", "Thành phố Đà Nẵng", "code", 48)
        ));

        Map<String, Object> result = service.resolveLegacyAddressV2(
                "Duy Hải",
                "Thị xã Duy Tiên",
                "Hà Nam"
        );

        assertThat(result).containsEntry("provinceCode", 37);
        assertThat(result).containsEntry("province", "Tỉnh Ninh Bình");
        assertThat(result).containsEntry("wardCode", 13336);
        assertThat(result).containsEntry("ward", "Phường Duy Hà");
    }
}
