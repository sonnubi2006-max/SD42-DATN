package com.base.service.impl;

import com.base.exception.BadRequestException;
import com.base.exception.ShippingProviderException;
import com.base.service.GhnService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GhnServiceImpl implements GhnService {

    private static final Map<String, List<String>> GHN_PROVINCE_ALIASES = Map.ofEntries(
            Map.entry("tuyenquang", List.of("Tuyên Quang", "Hà Giang")),
            Map.entry("laocai", List.of("Lào Cai", "Yên Bái")),
            Map.entry("thainguyen", List.of("Thái Nguyên", "Bắc Kạn")),
            Map.entry("phutho", List.of("Phú Thọ", "Vĩnh Phúc", "Hòa Bình")),
            Map.entry("bacninh", List.of("Bắc Ninh", "Bắc Giang")),
            Map.entry("hungyen", List.of("Hưng Yên", "Thái Bình")),
            Map.entry("haiphong", List.of("Hải Phòng", "Hải Dương")),
            Map.entry("ninhbinh", List.of("Ninh Bình", "Hà Nam", "Nam Định")),
            Map.entry("quangtri", List.of("Quảng Trị", "Quảng Bình")),
            Map.entry("hue", List.of("Thừa Thiên Huế")),
            Map.entry("danang", List.of("Đà Nẵng", "Quảng Nam")),
            Map.entry("quangngai", List.of("Quảng Ngãi", "Kon Tum")),
            Map.entry("gialai", List.of("Gia Lai", "Bình Định")),
            Map.entry("khanhhoa", List.of("Khánh Hòa", "Ninh Thuận")),
            Map.entry("daklak", List.of("Đắk Lắk", "Phú Yên")),
            Map.entry("lamdong", List.of("Lâm Đồng", "Đắk Nông", "Bình Thuận")),
            Map.entry("dongnai", List.of("Đồng Nai", "Bình Phước")),
            Map.entry("hochiminh", List.of("Hồ Chí Minh", "Bình Dương", "Bà Rịa - Vũng Tàu")),
            Map.entry("tayninh", List.of("Tây Ninh", "Long An")),
            Map.entry("dongthap", List.of("Đồng Tháp", "Tiền Giang")),
            Map.entry("vinhlong", List.of("Vĩnh Long", "Bến Tre", "Trà Vinh")),
            Map.entry("angiang", List.of("An Giang", "Kiên Giang")),
            Map.entry("cantho", List.of("Cần Thơ", "Hậu Giang", "Sóc Trăng")),
            Map.entry("camau", List.of("Cà Mau", "Bạc Liêu"))
    );

    private final RestTemplate restTemplate;

    private final Map<Integer, List<Map<String, Object>>> wardsV2Cache = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<Integer, List<Map<String, Object>>> ghnDistrictsCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<Integer, List<Map<String, Object>>> ghnWardsCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<String, ResolvedAddressNames> resolvedNamesCache = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> legacyAddressV2Cache = new java.util.concurrent.ConcurrentHashMap<>();
    private final ConcurrentMap<String, BigDecimal> shippingFeeCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, Integer> ghnServiceIdCache = new ConcurrentHashMap<>();
    private final ConcurrentMap<Integer, Object> wardsV2Locks = new ConcurrentHashMap<>();
    private volatile List<Map<String, Object>> ghnProvincesCache = null;
    private volatile List<Map<String, Object>> openApiProvincesCache = null;

    private synchronized List<Map<String, Object>> getOpenApiProvinces() {
        if (openApiProvincesCache != null) return openApiProvincesCache;
        try {
            String provUrl = "https://provinces.open-api.vn/api/v2/p/";
            List<Map<String, Object>> list = restTemplate.getForObject(provUrl, List.class);
            if (list != null) {
                openApiProvincesCache = list;
                return list;
            }
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách tỉnh từ open-api.vn: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    @Override
    public List<Map<String, Object>> getProvincesV2() {
        return getOpenApiProvinces().stream()
                .filter(province -> province.get("code") != null && province.get("name") != null)
                .map(province -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("code", province.get("code"));
                    item.put("name", province.get("name"));
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Value("${ghn.token:}")
    private String token;

    @Value("${ghn.shop-id:}")
    private String shopId;

    @Value("${ghn.from-district-id:3440}")
    private Integer fromDistrictId;

    @Value("${ghn.api-url:https://dev-online-gateway.ghn.vn/shiip/public-api/v2}")
    private String apiUrl;

    private String getBaseApiUrl() {
        String base = apiUrl;
        if (base == null) {
            return "https://dev-online-gateway.ghn.vn/shiip/public-api";
        }
        base = base.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        if (base.contains("/shipping-order/fee")) {
            base = base.replace("/shipping-order/fee", "");
        }
        if (base.endsWith("/v2")) {
            base = base.substring(0, base.length() - 3);
        }
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base;
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", token);
        if (shopId != null && !shopId.isBlank()) {
            headers.set("ShopId", shopId);
        }
        return headers;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getProvinces() {
        if (ghnProvincesCache != null && !ghnProvincesCache.isEmpty()) {
            return ghnProvincesCache;
        }
        synchronized (this) {
            if (ghnProvincesCache != null && !ghnProvincesCache.isEmpty()) {
                return ghnProvincesCache;
            }
            try {
                String url = getBaseApiUrl() + "/master-data/province";
                HttpEntity<String> entity = new HttpEntity<>(createHeaders());
                ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                if (response.getBody() != null && response.getBody().get("data") != null) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody().get("data");
                    if (list != null && !list.isEmpty()) {
                        ghnProvincesCache = list;
                        return list;
                    }
                }
            } catch (Exception e) {
                log.error("Lỗi lấy danh sách tỉnh thành từ GHN", e);
            }
            return new ArrayList<>();
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getDistricts(Integer provinceId) {
        if (provinceId == null) return new ArrayList<>();
        if (ghnDistrictsCache.containsKey(provinceId)) {
            return ghnDistrictsCache.get(provinceId);
        }
        try {
            String url = getBaseApiUrl() + "/master-data/district";
            Map<String, Object> body = new HashMap<>();
            body.put("province_id", provinceId);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getBody() != null && response.getBody().get("data") != null) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody().get("data");
                if (list != null && !list.isEmpty()) {
                    ghnDistrictsCache.put(provinceId, list);
                    return list;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách quận huyện từ GHN", e);
        }
        return new ArrayList<>();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getWards(Integer districtId) {
        if (districtId == null) return new ArrayList<>();
        if (ghnWardsCache.containsKey(districtId)) {
            return ghnWardsCache.get(districtId);
        }
        try {
            String url = getBaseApiUrl() + "/master-data/ward";
            Map<String, Object> body = new HashMap<>();
            body.put("district_id", districtId);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getBody() != null && response.getBody().get("data") != null) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) response.getBody().get("data");
                if (list != null && !list.isEmpty()) {
                    ghnWardsCache.put(districtId, list);
                    return list;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách phường xã từ GHN", e);
        }
        return new ArrayList<>();
    }

    @Override
    @SuppressWarnings("unchecked")
    public BigDecimal calculateFee(Integer toDistrictId, String toWardCode, Integer weight) {
        if (toDistrictId == null || toDistrictId <= 0) {
            throw new BadRequestException("Mã quận/huyện GHN không hợp lệ");
        }
        if (toWardCode == null || toWardCode.isBlank()) {
            throw new BadRequestException("Mã phường/xã GHN không được để trống");
        }
        int actualWeight = weight != null ? weight : 500;
        if (actualWeight <= 0) {
            throw new BadRequestException("Khối lượng đơn hàng phải lớn hơn 0");
        }
        String cacheKey = toDistrictId + ":" + toWardCode + ":" + actualWeight;
        BigDecimal cachedFee = shippingFeeCache.get(cacheKey);
        if (cachedFee != null) {
            return cachedFee;
        }

        try {
            Integer serviceId = resolveServiceId(toDistrictId);
            String url = getBaseApiUrl() + "/v2/shipping-order/fee";
            Map<String, Object> body = new HashMap<>();
            body.put("from_district_id", fromDistrictId);
            body.put("to_district_id", toDistrictId);
            body.put("to_ward_code", toWardCode);
            body.put("service_id", serviceId);
            body.put("weight", actualWeight); 
            body.put("length", 10);
            body.put("width", 10);
            body.put("height", 10);
            body.put("insurance_value", 0);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            if (response.getBody() != null && response.getBody().get("data") != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                Object totalObj = data.get("total");
                if (totalObj != null) {
                    BigDecimal fee = new BigDecimal(totalObj.toString());
                    shippingFeeCache.put(cacheKey, fee);
                    return fee;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi tính phí vận chuyển từ GHN", e);
            throw new ShippingProviderException(
                    "GHN không thể tính phí cho địa chỉ đã chọn. Vui lòng kiểm tra lại địa chỉ giao hàng.",
                    e);
        }
        throw new ShippingProviderException("GHN trả về kết quả tính phí không hợp lệ");
    }

    @SuppressWarnings("unchecked")
    private Integer resolveServiceId(Integer toDistrictId) {
        if (toDistrictId == null) {
            throw new IllegalArgumentException("Quận/huyện nhận hàng không được để trống");
        }
        if (fromDistrictId == null) {
            throw new IllegalStateException("ghn.from-district-id chưa được cấu hình");
        }

        String routeKey = fromDistrictId + ":" + toDistrictId;
        Integer cachedServiceId = ghnServiceIdCache.get(routeKey);
        if (cachedServiceId != null) {
            return cachedServiceId;
        }

        int parsedShopId;
        try {
            parsedShopId = Integer.parseInt(shopId);
        } catch (NumberFormatException ex) {
            throw new IllegalStateException("ghn.shop-id phải là một số hợp lệ", ex);
        }

        String url = getBaseApiUrl() + "/v2/shipping-order/available-services";
        Map<String, Object> body = new HashMap<>();
        body.put("shop_id", parsedShopId);
        body.put("from_district", fromDistrictId);
        body.put("to_district", toDistrictId);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, createHeaders());
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
        Object rawData = response.getBody() != null ? response.getBody().get("data") : null;
        if (!(rawData instanceof List<?> services) || services.isEmpty()) {
            throw new IllegalStateException("GHN không có gói dịch vụ cho tuyến giao hàng này");
        }

        Map<String, Object> selected = services.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .filter(item -> item.get("service_id") != null)
                .filter(item -> Integer.valueOf(2).equals(toInteger(item.get("service_type_id"))))
                .findFirst()
                .orElseGet(() -> services.stream()
                        .filter(Map.class::isInstance)
                        .map(item -> (Map<String, Object>) item)
                        .filter(item -> item.get("service_id") != null)
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException(
                                "GHN trả về gói dịch vụ không có service_id")));

        Integer serviceId = toInteger(selected.get("service_id"));
        if (serviceId == null) {
            throw new IllegalStateException("service_id GHN không hợp lệ");
        }
        ghnServiceIdCache.put(routeKey, serviceId);
        return serviceId;
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        try {
            return Integer.valueOf(value.toString());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getWardsByProvince(Integer provinceId) {
        List<Map<String, Object>> allWards = new ArrayList<>();
        try {
            List<Map<String, Object>> districts = getDistricts(provinceId);
            if (districts == null || districts.isEmpty()) return allWards;

            for (Map<String, Object> district : districts) {
                Object districtIdObj = district.get("DistrictID");
                if (districtIdObj == null) continue;
                Integer districtId = Integer.valueOf(districtIdObj.toString());

                try {
                    List<Map<String, Object>> wards = getWards(districtId);
                    if (wards == null) continue;
                    for (Map<String, Object> ward : wards) {
                        Map<String, Object> enriched = new HashMap<>(ward);
                        enriched.put("DistrictID", districtId);
                        enriched.put("DistrictName", district.get("DistrictName"));
                        allWards.add(enriched);
                    }
                } catch (Exception e) {
                    log.warn("Không thể lấy phường/xã của quận/huyện {}: {}", districtId, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Lỗi lấy phường/xã theo tỉnh {}: {}", provinceId, e.getMessage());
        }
        return allWards;
    }

    private String normName(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("đ", "d")
                .replace("tinh", "")
                .replace("thanh pho", "")
                .replace("quan", "")
                .replace("huyen", "")
                .replace("thi xa", "")
                .replace("phuong", "")
                .replace("xa", "")
                .replace("thi tran", "")
                .replace("tp.", "")
                .replace("tp", "")
                .replace("q.", "")
                .replace("h.", "")
                .replace("px.", "")
                .replace("tx.", "")
                .replaceAll("[\\s-]+", "")
                .trim();
    }

    private List<String> getCandidateGhnProvinceNames(String provinceName) {
        String normalized = normName(provinceName);
        return GHN_PROVINCE_ALIASES.getOrDefault(normalized, List.of(provinceName));
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getWardsV2(Integer provinceCode, String provinceName) {
        if (provinceCode == null) return new ArrayList<>();
        List<Map<String, Object>> cached = wardsV2Cache.get(provinceCode);
        if (cached != null) {
            return cached;
        }

        Object provinceLock = wardsV2Locks.computeIfAbsent(provinceCode, ignored -> new Object());
        synchronized (provinceLock) {
            cached = wardsV2Cache.get(provinceCode);
            if (cached != null) {
                return cached;
            }

            List<Map<String, Object>> result = new ArrayList<>();
            try {
                String openApiUrl = "https://provinces.open-api.vn/api/v2/p/" + provinceCode + "?depth=2";
                Map<String, Object> openApiRes = restTemplate.getForObject(openApiUrl, Map.class);
                if (openApiRes == null || openApiRes.get("wards") == null) return result;
                List<Map<String, Object>> openApiWards = (List<Map<String, Object>>) openApiRes.get("wards");

                String activeProvinceName = provinceName;
                if (activeProvinceName == null || activeProvinceName.trim().isEmpty()) {
                    Object pNameObj = openApiRes.get("name");
                    if (pNameObj != null) {
                        activeProvinceName = pNameObj.toString();
                    }
                }

                List<Map<String, Object>> ghnProvinces = getProvinces();
                Set<String> candidateProvinceNames = getCandidateGhnProvinceNames(activeProvinceName).stream()
                        .map(this::normName)
                        .collect(Collectors.toSet());
                List<Map<String, Object>> matchedGhnProvinces = ghnProvinces.stream()
                        .filter(gp -> gp.get("ProvinceName") != null)
                        .filter(gp -> candidateProvinceNames.contains(normName(gp.get("ProvinceName").toString())))
                        .toList();

                Map<String, Map<String, Object>> ghnWardMap = new HashMap<>(); 
                for (Map<String, Object> matchedGhnProvince : matchedGhnProvinces) {
                    Object ghnProvinceIdObj = matchedGhnProvince.get("ProvinceID");
                    if (ghnProvinceIdObj != null) {
                        Integer ghnProvinceId = Integer.valueOf(ghnProvinceIdObj.toString());
                        List<Map<String, Object>> ghnDistricts = getDistricts(ghnProvinceId);

                        List<Map.Entry<String, Map<String, Object>>> mappings = ghnDistricts
                                .parallelStream()
                                .flatMap(gd -> {
                                    Object gdIdObj = gd.get("DistrictID");
                                    Object gdName = gd.get("DistrictName");
                                    if (gdIdObj == null) return java.util.stream.Stream.empty();

                                    Integer gdId = Integer.valueOf(gdIdObj.toString());
                                    try {
                                        List<Map<String, Object>> ghnWards = getWards(gdId);
                                        if (ghnWards == null) return java.util.stream.Stream.empty();

                                        return ghnWards.stream()
                                                .filter(gw -> gw.get("WardCode") != null && gw.get("WardName") != null)
                                                .map(gw -> {
                                                    Map<String, Object> mapping = new HashMap<>();
                                                    mapping.put("provinceId", ghnProvinceId);
                                                    mapping.put("districtId", gdId);
                                                    mapping.put("districtName", gdName);
                                                    mapping.put("wardCode", gw.get("WardCode").toString());
                                                    return Map.entry(normName(gw.get("WardName").toString()), mapping);
                                                });
                                    } catch (Exception e) {
                                        log.warn("Lỗi tải wards của district {} để map v2: {}", gdId, e.getMessage());
                                        return java.util.stream.Stream.empty();
                                    }
                                })
                                .collect(Collectors.toList());

                        for (Map.Entry<String, Map<String, Object>> mapping : mappings) {
                            ghnWardMap.putIfAbsent(mapping.getKey(), mapping.getValue());
                        }
                    }
                }

                for (Map<String, Object> oaw : openApiWards) {
                    Object oawCode = oaw.get("code");
                    Object oawName = oaw.get("name");
                    if (oawCode == null || oawName == null) continue;

                    Map<String, Object> item = new HashMap<>();
                    item.put("code", oawCode);
                    item.put("name", oawName);

                    String normWardKey = normName(oawName.toString());
                    Map<String, Object> ghnMapping = ghnWardMap.get(normWardKey);
                    if (ghnMapping != null) {
                        item.put("provinceId", ghnMapping.get("provinceId"));
                        item.put("districtId", ghnMapping.get("districtId"));
                        item.put("districtName", ghnMapping.get("districtName"));
                        item.put("wardCode", ghnMapping.get("wardCode"));
                    } else {
                        item.put("provinceId", 0);
                        item.put("districtId", 0);
                        item.put("districtName", "-");
                        item.put("wardCode", "");
                    }
                    result.add(item);
                }

                if (!result.isEmpty()) {
                    wardsV2Cache.put(provinceCode, result);
                }
            } catch (Exception e) {
                log.error("Lỗi lấy danh sách địa chỉ v2 ánh xạ GHN", e);
            } finally {
                wardsV2Locks.remove(provinceCode, provinceLock);
            }
            return result;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public String getDistrictNameForWard(String provinceName, String wardName) {
        if (provinceName == null || provinceName.trim().isEmpty() || wardName == null || wardName.trim().isEmpty()) {
            return "-";
        }
        try {
            List<Map<String, Object>> provinces = getOpenApiProvinces();
            if (provinces == null || provinces.isEmpty()) return "-";

            Integer provinceCode = null;
            String normProvInput = normName(provinceName);
            for (Map<String, Object> p : provinces) {
                Object nameObj = p.get("name");
                if (nameObj != null && normName(nameObj.toString()).equals(normProvInput)) {
                    Object codeObj = p.get("code");
                    if (codeObj != null) {
                        provinceCode = Integer.valueOf(codeObj.toString());
                        break;
                    }
                }
            }
            if (provinceCode == null) return "-";

            List<Map<String, Object>> wards = getWardsV2(provinceCode, provinceName);
            String normWardInput = normName(wardName);
            for (Map<String, Object> w : wards) {
                Object nameObj = w.get("name");
                if (nameObj != null && normName(nameObj.toString()).equals(normWardInput)) {
                    Object distNameObj = w.get("districtName");
                    if (distNameObj != null) {
                        return distNameObj.toString();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Lỗi tự động định vị quận huyện từ xã/tỉnh: {}", e.getMessage());
        }
        return "-";
    }

    @Override
    @SuppressWarnings("unchecked")
    public ResolvedAddressNames resolveNames(Integer ghnProvinceId, Integer ghnDistrictId, String ghnWardCode) {
        if (ghnProvinceId == null || ghnDistrictId == null || ghnWardCode == null || ghnWardCode.isBlank()) {
            return new ResolvedAddressNames("-", "-", "-");
        }

        try {
            String provinceName = getProvinces().stream()
                    .filter(p -> ghnProvinceId.equals(toInteger(p.get("ProvinceID"))))
                    .map(p -> p.get("ProvinceName"))
                    .filter(java.util.Objects::nonNull)
                    .map(Object::toString)
                    .findFirst()
                    .orElse("-");

            String districtName = getDistricts(ghnProvinceId).stream()
                    .filter(d -> ghnDistrictId.equals(toInteger(d.get("DistrictID"))))
                    .map(d -> d.get("DistrictName"))
                    .filter(java.util.Objects::nonNull)
                    .map(Object::toString)
                    .findFirst()
                    .orElse("-");

            if ("-".equals(provinceName) || "-".equals(districtName)) {
                return new ResolvedAddressNames("-", "-", "-");
            }

            String wardName = getWards(ghnDistrictId).stream()
                    .filter(w -> w.get("WardCode") != null)
                    .filter(w -> ghnWardCode.equals(w.get("WardCode").toString()))
                    .map(w -> w.get("WardName"))
                    .filter(java.util.Objects::nonNull)
                    .map(Object::toString)
                    .findFirst()
                    .orElse("-");

            return new ResolvedAddressNames(provinceName, districtName, wardName);
        } catch (Exception e) {
            log.warn("Không thể resolve tên từ mã GHN: {}", e.getMessage());
            return new ResolvedAddressNames("-", "-", "-");
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> resolveLegacyAddressV2(
            String wardName,
            String districtName,
            String provinceName
    ) {
        if (wardName == null || wardName.isBlank()) return new HashMap<>();

        String cacheKey = normName(wardName) + "|" + normName(districtName) + "|" + normName(provinceName);
        Map<String, Object> cached = legacyAddressV2Cache.get(cacheKey);
        if (cached != null) return cached;

        try {
            URI lookupUri = UriComponentsBuilder
                    .fromHttpUrl("https://provinces.open-api.vn/api/v2/w/from-legacy/")
                    .queryParam("legacy_name", wardName.trim())
                    .build()
                    .encode()
                    .toUri();
            List<Map<String, Object>> matches = restTemplate.getForObject(lookupUri, List.class);
            if (matches == null || matches.isEmpty()) return new HashMap<>();

            Map<String, Object> bestMatch = null;
            int bestScore = Integer.MIN_VALUE;
            for (Map<String, Object> match : matches) {
                int score = 0;
                Object sourceCode = match.get("source_code");
                if (sourceCode != null) {
                    try {
                        Map<String, Object> legacyWard = restTemplate.getForObject(
                                "https://provinces.open-api.vn/api/v1/w/" + sourceCode,
                                Map.class
                        );
                        if (legacyWard != null) {
                            Object legacyProvinceCode = legacyWard.get("province_code");
                            if (legacyWard.get("name") != null
                                    && normName(legacyWard.get("name").toString()).equals(normName(wardName))) {
                                score += 8;
                            }

                            Object districtCode = legacyWard.get("district_code");
                            if (districtCode != null) {
                                Map<String, Object> legacyDistrict = restTemplate.getForObject(
                                        "https://provinces.open-api.vn/api/v1/d/" + districtCode,
                                        Map.class
                                );
                                if (districtName != null && !districtName.isBlank()
                                        && legacyDistrict != null && legacyDistrict.get("name") != null
                                        && normName(legacyDistrict.get("name").toString()).equals(normName(districtName))) {
                                    score += 4;
                                }
                                if (legacyProvinceCode == null && legacyDistrict != null) {
                                    legacyProvinceCode = legacyDistrict.get("province_code");
                                }
                            }

                            if (legacyProvinceCode != null && provinceName != null && !provinceName.isBlank()) {
                                Map<String, Object> legacyProvince = restTemplate.getForObject(
                                        "https://provinces.open-api.vn/api/v1/p/" + legacyProvinceCode,
                                        Map.class
                                );
                                if (legacyProvince != null && legacyProvince.get("name") != null
                                        && normName(legacyProvince.get("name").toString()).equals(normName(provinceName))) {
                                    score += 6;
                                }
                            }
                        }
                    } catch (Exception candidateError) {
                        log.debug("Không thể kiểm tra địa chỉ cũ mã {}: {}", sourceCode, candidateError.getMessage());
                    }
                }

                if (bestMatch == null || score > bestScore) {
                    bestMatch = match;
                    bestScore = score;
                }
            }

            if (bestMatch == null || !(bestMatch.get("ward") instanceof Map<?, ?> rawWard)) {
                return new HashMap<>();
            }
            Map<String, Object> newWard = (Map<String, Object>) rawWard;
            Object newWardCode = newWard.get("code");
            Object newWardName = newWard.get("name");
            Object newProvinceCode = newWard.get("province_code");
            if (newWardCode == null || newWardName == null || newProvinceCode == null) {
                return new HashMap<>();
            }

            String newProvinceName = getOpenApiProvinces().stream()
                    .filter(item -> item.get("code") != null
                            && item.get("code").toString().equals(newProvinceCode.toString()))
                    .map(item -> item.get("name"))
                    .filter(java.util.Objects::nonNull)
                    .map(Object::toString)
                    .findFirst()
                    .orElse("");
            if (newProvinceName.isBlank()) return new HashMap<>();

            Map<String, Object> result = new HashMap<>();
            result.put("provinceCode", newProvinceCode);
            result.put("province", newProvinceName);
            result.put("wardCode", newWardCode);
            result.put("ward", newWardName);
            legacyAddressV2Cache.put(cacheKey, result);
            return result;
        } catch (Exception e) {
            log.error("Không thể chuyển địa chỉ CCCD cũ sang địa chỉ V2: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    @Override
    public ResolvedAddressCodes resolveCodes(String provinceName, String districtName, String wardName) {
        if (provinceName == null || provinceName.isBlank() || wardName == null || wardName.isBlank()) {
            return new ResolvedAddressCodes(null, null, null);
        }

        Set<String> candidateProvinceNames = getCandidateGhnProvinceNames(provinceName).stream()
                .map(this::normName)
                .collect(Collectors.toSet());
        String normalizedDistrict = normName(districtName);
        String normalizedWard = normName(wardName);
        boolean hasDistrict = districtName != null && !districtName.isBlank() && !"-".equals(districtName.trim());

        try {
            for (Map<String, Object> province : getProvinces()) {
                Integer provinceId = toInteger(province.get("ProvinceID"));
                Object rawProvinceName = province.get("ProvinceName");
                if (provinceId == null || rawProvinceName == null
                        || !candidateProvinceNames.contains(normName(rawProvinceName.toString()))) {
                    continue;
                }

                for (Map<String, Object> district : getDistricts(provinceId)) {
                    Integer districtId = toInteger(district.get("DistrictID"));
                    Object rawDistrictName = district.get("DistrictName");
                    if (districtId == null) continue;
                    if (hasDistrict && (rawDistrictName == null
                            || !normalizedDistrict.equals(normName(rawDistrictName.toString())))) {
                        continue;
                    }

                    for (Map<String, Object> ward : getWards(districtId)) {
                        Object rawWardCode = ward.get("WardCode");
                        Object rawWardName = ward.get("WardName");
                        if (rawWardCode != null && rawWardName != null
                                && normalizedWard.equals(normName(rawWardName.toString()))) {
                            return new ResolvedAddressCodes(provinceId, districtId, rawWardCode.toString());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Không thể resolve mã GHN từ địa chỉ cũ: {}", e.getMessage());
        }
        return new ResolvedAddressCodes(null, null, null);
    }

    @Override
    public ResolvedAddressNames resolveNames(String provinceCodeStr, String ghnWardCode) {
        if (provinceCodeStr == null || provinceCodeStr.trim().isEmpty() || ghnWardCode == null || ghnWardCode.trim().isEmpty()) {
            return new ResolvedAddressNames("-", "-", "-");
        }

        String cacheKey = provinceCodeStr.trim() + ":" + ghnWardCode.trim();
        ResolvedAddressNames cached = resolvedNamesCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        ResolvedAddressNames resolved = doResolveNames(provinceCodeStr, ghnWardCode);
        if (resolved != null && (!"-".equals(resolved.getProvinceName()) || !"-".equals(resolved.getWardName()))) {
            resolvedNamesCache.put(cacheKey, resolved);
        }
        return resolved;
    }

    private ResolvedAddressNames doResolveNames(String provinceCodeStr, String ghnWardCode) {
        String pName = "-";
        String dName = "-";
        String wName = "-";

        boolean isNumeric = true;
        Integer provinceCode = null;
        try {
            provinceCode = Integer.valueOf(provinceCodeStr.trim());
        } catch (NumberFormatException e) {
            isNumeric = false;
        }

        if (!isNumeric) {
            pName = provinceCodeStr.trim();
            wName = ghnWardCode.trim();
            dName = getDistrictNameForWard(pName, wName);
            return new ResolvedAddressNames(pName, dName, wName);
        }

        try {
            List<Map<String, Object>> provinces = getOpenApiProvinces();
            for (Map<String, Object> p : provinces) {
                Object codeObj = p.get("code");
                if (codeObj != null && Integer.valueOf(codeObj.toString()).equals(provinceCode)) {
                    Object nameObj = p.get("name");
                    if (nameObj != null) {
                        pName = nameObj.toString();
                    }
                    break;
                }
            }

            List<Map<String, Object>> wards = getWardsV2(provinceCode, pName);
            for (Map<String, Object> w : wards) {
                Object ghnCodeObj = w.get("wardCode"); 
                if (ghnCodeObj != null && ghnCodeObj.toString().equals(ghnWardCode)) {
                    Object nameObj = w.get("name");
                    if (nameObj != null) {
                        wName = nameObj.toString();
                    }
                    Object distNameObj = w.get("districtName");
                    if (distNameObj != null) {
                        dName = distNameObj.toString();
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("Lỗi resolve tên địa chỉ từ code: {}", e.getMessage());
        }
        return new ResolvedAddressNames(pName, dName, wName);
    }
}
