package com.base.service.impl;

import com.base.dto.response.AiChatResponse;
import com.base.dto.response.product.ProductResponse;
import com.base.entity.Product;
import com.base.entity.Promotion;
import com.base.entity.Order;
import com.base.repository.ProductRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.OrderRepository;
import com.base.repository.ProductVariantRepository;
import com.base.service.AiService;
import com.base.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiServiceImpl implements AiService {

    private final ProductVariantRepository variantRepository;
    private final ProductRepository productRepository;
    private final PromotionRepository promotionRepository;
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    @Override
    public AiChatResponse generateConsultation(String userMessage, List<Map<String, String>> history) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY")) {
            log.warn("Gemini API key is not configured. Falling back to default assistant message.");
            return new AiChatResponse(
                "Dạ hiện tại hệ thống chưa cấu hình khóa API Gemini. Anh/chị vui lòng liên hệ admin để cài đặt nhé!",
                new ArrayList<>()
            );
        }

        try {
            String systemInstruction = """
                    Bạn là Chuyên gia Tư vấn Phong cách & Stylist Thời trang AI (AI Fashion Stylist & Sales Advisor) cao cấp và tận tâm của cửa hàng.
                    Nhiệm vụ của bạn là mang đến trải nghiệm tư vấn mua sắm tuyệt vời, giúp khách hàng chọn lựa trang phục, giày dép, phụ kiện hoàn hảo nhất theo nhu cầu, phong cách và ngân sách.

                    🌟 NGUYÊN TẮC TƯ VẤN CHUYÊN NGHIỆP:
                    1. Gợi ý sản phẩm thông minh & Sâu sắc:
                       - Luôn gọi các công cụ (tools: searchProducts, getBestSellers, getNewArrivals, getTopRated, getPromotions) khi khách hàng tìm kiếm, hỏi gợi ý phối đồ, xem hàng mới hoặc săn deal.
                       - Khi giới thiệu các sản phẩm tìm được, hãy giải thích chi tiết: phong cách phù hợp, ưu điểm thiết kế, chất liệu, màu sắc và gợi ý cụ thể cách phối đồ (mix & match) với các trang phục/phụ kiện khác.
                    2. Tận tâm & Thân thiện:
                       - Xưng hô lịch thiệp, ấm áp: gọi khách là 'anh/chị' và xưng 'em'. Mở đầu bằng lời chào niềm nở ('Dạ em chào anh/chị ạ!').
                       - Tích cực thông báo các chương trình ưu đãi/khuyến mãi hiện có để khách hàng nhận được giá tốt nhất.
                       - Đưa ra lời khuyên chọn size hoặc hỏi thêm chi tiết (dáng người, sở thích màu sắc, dịp sử dụng) để gợi ý chuẩn xác hơn.
                    3. Trình bày Đẹp mắt & Sinh động:
                       - Trình bày bài viết mạch lạc bằng Markdown: gạch đầu dòng rõ ràng, in đậm các thông tin quan trọng, ngắt đoạn thoáng và kèm icon/emoji tinh tế, sang trọng.
                    4. Tra cứu đơn hàng & Giải đáp chính sách:
                       - Sử dụng tool checkOrderStatus khi khách hỏi tiến độ đơn hàng.
                       - Nắm rõ và giải đáp nhanh chính sách đổi trả, bảo hành, giao hàng nhanh chóng.
                    """;

            Map<String, Object> requestBody = new HashMap<>();

            Map<String, Object> systemInstructionPart = new HashMap<>();
            systemInstructionPart.put("parts", List.of(Map.of("text", systemInstruction)));
            requestBody.put("systemInstruction", systemInstructionPart);

            // Set up tools configuration
            requestBody.put("tools", buildGeminiTools());

            List<Map<String, Object>> contents = new ArrayList<>();

            if (history != null) {
                for (Map<String, String> entry : history) {
                    String role = entry.get("role");
                    String content = entry.get("content");
                    if (role != null && content != null) {
                        contents.add(Map.of(
                            "role", role.equals("user") ? "user" : "model",
                            "parts", List.of(Map.of("text", content))
                        ));
                    }
                }
            }

            contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", userMessage))
            ));
            requestBody.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String urlWithKey = apiUrl + "?key=" + apiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(urlWithKey, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map responseBody = response.getBody();
                List candidates = (List) responseBody.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map firstCandidate = (Map) candidates.get(0);
                    Map content = (Map) firstCandidate.get("content");
                    if (content != null) {
                        List parts = (List) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map firstPart = (Map) parts.get(0);
                            Map functionCall = (Map) firstPart.get("functionCall");

                            if (functionCall != null) {
                                // 1. Handle Gemini Tool Calling
                                String toolName = (String) functionCall.get("name");
                                Map<String, Object> args = (Map<String, Object>) functionCall.get("args");
                                List<Product> recommendedList = new ArrayList<>();
                                Map<String, Object> toolResponse = null;

                                log.info("Gemini requested function call: {} with args: {}", toolName, args);

                                if ("searchProducts".equals(toolName)) {
                                    toolResponse = executeSearchProducts(args, recommendedList);
                                } else if ("getNewArrivals".equals(toolName)) {
                                    toolResponse = executeGetNewArrivals(args, recommendedList);
                                } else if ("getBestSellers".equals(toolName)) {
                                    toolResponse = executeGetBestSellers(args, recommendedList);
                                } else if ("getTopRated".equals(toolName)) {
                                    toolResponse = executeGetTopRated(args, recommendedList);
                                } else if ("getPromotions".equals(toolName)) {
                                    toolResponse = executeGetPromotions();
                                } else if ("checkOrderStatus".equals(toolName)) {
                                    toolResponse = executeCheckOrderStatus(args);
                                }

                                // 2. Send Function Response back to Gemini
                                List<Map<String, Object>> secondContents = new ArrayList<>(contents);
                                secondContents.add(Map.of(
                                    "role", "model",
                                    "parts", List.of(firstPart)
                                ));

                                Map<String, Object> functionResponsePart = new HashMap<>();
                                Map<String, Object> functionResponseObj = new HashMap<>();
                                functionResponseObj.put("name", toolName);
                                functionResponseObj.put("response", toolResponse != null ? toolResponse : Map.of("status", "ok"));
                                functionResponsePart.put("functionResponse", functionResponseObj);

                                secondContents.add(Map.of(
                                    "role", "function",
                                    "parts", List.of(functionResponsePart)
                                ));

                                Map<String, Object> secondRequestBody = new HashMap<>();
                                secondRequestBody.put("systemInstruction", systemInstructionPart);
                                secondRequestBody.put("contents", secondContents);
                                secondRequestBody.put("tools", buildGeminiTools());

                                HttpEntity<Map<String, Object>> secondEntity = new HttpEntity<>(secondRequestBody, headers);
                                ResponseEntity<Map> secondResponse = restTemplate.postForEntity(urlWithKey, secondEntity, Map.class);

                                if (secondResponse.getStatusCode() == HttpStatus.OK && secondResponse.getBody() != null) {
                                    List secondCandidates = (List) secondResponse.getBody().get("candidates");
                                    if (secondCandidates != null && !secondCandidates.isEmpty()) {
                                        Map secondFirstCandidate = (Map) secondCandidates.get(0);
                                        Map secondContent = (Map) secondFirstCandidate.get("content");
                                        if (secondContent != null) {
                                            List secondParts = (List) secondContent.get("parts");
                                            if (secondParts != null && !secondParts.isEmpty()) {
                                                String finalReply = (String) ((Map) secondParts.get(0)).get("text");
                                                return new AiChatResponse(finalReply, mapProductsToResponses(recommendedList));
                                            }
                                        }
                                    }
                                }

                                // Fallback if second response fails
                                return new AiChatResponse(
                                    "Dạ em gửi anh/chị danh sách sản phẩm nổi bật phù hợp với yêu cầu ạ:",
                                    mapProductsToResponses(recommendedList)
                                );
                            }

                            // No tool calling, direct conversation
                            String textReply = (String) firstPart.get("text");
                            return new AiChatResponse(textReply, new ArrayList<>());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage(), e);
            return new AiChatResponse(
                "Dạ hiện tại hệ thống tư vấn AI đang bận một chút, anh/chị vui lòng thử lại sau giây lát nhé!",
                new ArrayList<>()
            );
        }
        return new AiChatResponse("Dạ em có thể giúp gì được cho anh/chị ạ?", new ArrayList<>());
    }

    private List<Map<String, Object>> buildGeminiTools() {
        List<Map<String, Object>> tools = new ArrayList<>();
        List<Map<String, Object>> functionDeclarations = new ArrayList<>();

        // 1. searchProducts tool
        Map<String, Object> searchProductsDec = new HashMap<>();
        searchProductsDec.put("name", "searchProducts");
        searchProductsDec.put("description", "Tìm kiếm sản phẩm theo từ khóa (keyword), mã danh mục (categoryId), thương hiệu (brandId), hoặc khoảng giá (minPrice, maxPrice).");

        Map<String, Object> searchParams = new HashMap<>();
        searchParams.put("type", "OBJECT");
        Map<String, Object> searchProps = new HashMap<>();
        searchProps.put("keyword", Map.of("type", "STRING", "description", "Từ khóa tìm kiếm tên sản phẩm hoặc kiểu dáng, ví dụ: 'giày sneaker', 'áo polo', 'quần tây'"));
        searchProps.put("categoryId", Map.of("type", "INTEGER", "description", "ID danh mục sản phẩm"));
        searchProps.put("brandId", Map.of("type", "INTEGER", "description", "ID thương hiệu sản phẩm"));
        searchProps.put("minPrice", Map.of("type", "NUMBER", "description", "Giá tối thiểu (VNĐ)"));
        searchProps.put("maxPrice", Map.of("type", "NUMBER", "description", "Giá tối đa (VNĐ)"));
        searchParams.put("properties", searchProps);
        searchProductsDec.put("parameters", searchParams);
        functionDeclarations.add(searchProductsDec);

        // 2. getNewArrivals tool
        Map<String, Object> getNewArrivalsDec = new HashMap<>();
        getNewArrivalsDec.put("name", "getNewArrivals");
        getNewArrivalsDec.put("description", "Lấy danh sách các sản phẩm mới nhất vừa ra mắt tại cửa hàng.");

        Map<String, Object> arrivalsParams = new HashMap<>();
        arrivalsParams.put("type", "OBJECT");
        arrivalsParams.put("properties", Map.of("limit", Map.of("type", "INTEGER", "description", "Số lượng sản phẩm cần lấy (mặc định 6, tối đa 8)")));
        getNewArrivalsDec.put("parameters", arrivalsParams);
        functionDeclarations.add(getNewArrivalsDec);

        // 3. getBestSellers tool
        Map<String, Object> getBestSellersDec = new HashMap<>();
        getBestSellersDec.put("name", "getBestSellers");
        getBestSellersDec.put("description", "Lấy danh sách các sản phẩm bán chạy nhất (Best Sellers / Hot Trending) tại cửa hàng.");

        Map<String, Object> bestSellersParams = new HashMap<>();
        bestSellersParams.put("type", "OBJECT");
        bestSellersParams.put("properties", Map.of("limit", Map.of("type", "INTEGER", "description", "Số lượng sản phẩm cần lấy (mặc định 6, tối đa 8)")));
        getBestSellersDec.put("parameters", bestSellersParams);
        functionDeclarations.add(getBestSellersDec);

        // 4. getTopRated tool
        Map<String, Object> getTopRatedDec = new HashMap<>();
        getTopRatedDec.put("name", "getTopRated");
        getTopRatedDec.put("description", "Lấy danh sách sản phẩm được khách hàng đánh giá cao nhất (Top rated).");

        Map<String, Object> topRatedParams = new HashMap<>();
        topRatedParams.put("type", "OBJECT");
        topRatedParams.put("properties", Map.of("limit", Map.of("type", "INTEGER", "description", "Số lượng sản phẩm cần lấy (mặc định 6, tối đa 8)")));
        getTopRatedDec.put("parameters", topRatedParams);
        functionDeclarations.add(getTopRatedDec);

        // 5. getPromotions tool
        Map<String, Object> getPromotionsDec = new HashMap<>();
        getPromotionsDec.put("name", "getPromotions");
        getPromotionsDec.put("description", "Lấy danh sách các chương trình khuyến mãi, voucher và giảm giá đang hoạt động.");
        getPromotionsDec.put("parameters", Map.of("type", "OBJECT", "properties", new HashMap<>()));
        functionDeclarations.add(getPromotionsDec);

        // 6. checkOrderStatus tool
        Map<String, Object> checkOrderStatusDec = new HashMap<>();
        checkOrderStatusDec.put("name", "checkOrderStatus");
        checkOrderStatusDec.put("description", "Tra cứu trạng thái của một đơn hàng dựa trên mã đơn hàng (orderCode) và số điện thoại người nhận/người đặt (phone).");

        Map<String, Object> statusParams = new HashMap<>();
        statusParams.put("type", "OBJECT");
        statusParams.put("properties", Map.of(
            "orderCode", Map.of("type", "STRING", "description", "Mã đơn hàng (ví dụ: ORD-1234)"),
            "phone", Map.of("type", "STRING", "description", "Số điện thoại liên kết với đơn hàng")
        ));
        statusParams.put("required", List.of("orderCode", "phone"));
        checkOrderStatusDec.put("parameters", statusParams);
        functionDeclarations.add(checkOrderStatusDec);

        tools.add(Map.of("functionDeclarations", functionDeclarations));
        return tools;
    }

    private Map<String, Object> buildProductDataMap(Product p) {
        Map<String, Object> pMap = new HashMap<>();
        pMap.put("productId", p.getProductId());
        pMap.put("productName", p.getProductName());
        pMap.put("productCode", p.getProductCode());
        pMap.put("category", p.getCategory() != null ? p.getCategory().getCategoryName() : "Thời trang");
        pMap.put("brand", p.getBrand() != null ? p.getBrand().getBrandName() : "");
        pMap.put("averageRating", p.getAverageRating() != null ? p.getAverageRating() : 5.0);
        pMap.put("description", p.getDescription() != null ? p.getDescription() : "");

        List<String> colors = p.getVariants().stream()
                .filter(v -> v.getStatus() == com.base.enums.ProductVariantStatus.ACTIVE)
                .map(com.base.entity.ProductVariant::getColor)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<String> sizes = p.getVariants().stream()
                .filter(v -> v.getStatus() == com.base.enums.ProductVariantStatus.ACTIVE)
                .map(com.base.entity.ProductVariant::getSize)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        BigDecimal minPrice = p.getVariants().stream()
                .filter(v -> v.getStatus() == com.base.enums.ProductVariantStatus.ACTIVE)
                .map(com.base.entity.ProductVariant::getPrice)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        BigDecimal maxPrice = p.getVariants().stream()
                .filter(v -> v.getStatus() == com.base.enums.ProductVariantStatus.ACTIVE)
                .map(com.base.entity.ProductVariant::getPrice)
                .filter(Objects::nonNull)
                .max(BigDecimal::compareTo)
                .orElse(BigDecimal.ZERO);

        int totalStock = p.getVariants().stream()
                .filter(v -> v.getStatus() == com.base.enums.ProductVariantStatus.ACTIVE)
                .mapToInt(v -> v.getAvailableStock() != null ? v.getAvailableStock() : v.getStockQuantity())
                .sum();

        pMap.put("minPrice", minPrice);
        pMap.put("maxPrice", maxPrice);
        pMap.put("colors", colors);
        pMap.put("sizes", sizes);
        pMap.put("inStock", totalStock > 0);
        pMap.put("totalStock", totalStock);
        return pMap;
    }

    private Map<String, Object> executeSearchProducts(Map<String, Object> args, List<Product> recommendedList) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            String keyword = (String) args.get("keyword");
            Long categoryId = args.get("categoryId") != null ? Long.valueOf(args.get("categoryId").toString()) : null;
            Long brandId = args.get("brandId") != null ? Long.valueOf(args.get("brandId").toString()) : null;
            BigDecimal minPrice = args.get("minPrice") != null ? new BigDecimal(args.get("minPrice").toString()) : null;
            BigDecimal maxPrice = args.get("maxPrice") != null ? new BigDecimal(args.get("maxPrice").toString()) : null;

            Page<Product> page = productRepository.filterProducts(
                    categoryId,
                    brandId,
                    minPrice,
                    maxPrice,
                    com.base.enums.ProductStatus.ACTIVE,
                    keyword != null && !keyword.isBlank() ? keyword.trim() : null,
                    PageRequest.of(0, 6)
            );

            List<Product> products = new ArrayList<>(page.getContent());

            // If strict search returned nothing and keyword has multiple words, try fallback broad search
            if (products.isEmpty() && keyword != null && !keyword.isBlank()) {
                String[] words = keyword.trim().split("\\s+");
                for (String word : words) {
                    if (word.length() >= 2) {
                        Page<Product> fallbackPage = productRepository.filterProducts(
                                categoryId,
                                brandId,
                                minPrice,
                                maxPrice,
                                com.base.enums.ProductStatus.ACTIVE,
                                word,
                                PageRequest.of(0, 6)
                        );
                        for (Product p : fallbackPage.getContent()) {
                            if (products.stream().noneMatch(existing -> existing.getProductId().equals(p.getProductId()))) {
                                products.add(p);
                            }
                        }
                    }
                    if (products.size() >= 5) break;
                }
            }

            // If still empty, fetch top selling products as suggestions
            if (products.isEmpty() && categoryId == null && brandId == null) {
                products.addAll(productRepository.findTopSellingProducts(PageRequest.of(0, 4)));
            }

            recommendedList.addAll(products);

            List<Map<String, Object>> productDataList = products.stream()
                    .map(this::buildProductDataMap)
                    .toList();

            responseMap.put("products", productDataList);
            responseMap.put("totalResults", products.size());
        } catch (Exception e) {
            log.error("Error executing searchProducts tool", e);
            responseMap.put("error", e.getMessage());
        }
        return responseMap;
    }

    private Map<String, Object> executeGetNewArrivals(Map<String, Object> args, List<Product> recommendedList) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            int limit = args.get("limit") != null ? Integer.parseInt(args.get("limit").toString()) : 6;
            limit = Math.min(Math.max(limit, 1), 8);

            Page<Product> page = productRepository.search(
                    null,
                    null,
                    null,
                    com.base.enums.ProductStatus.ACTIVE,
                    PageRequest.of(0, limit, Sort.by("createdAt").descending())
            );

            List<Product> products = page.getContent();
            recommendedList.addAll(products);

            List<Map<String, Object>> productDataList = products.stream()
                    .map(this::buildProductDataMap)
                    .toList();

            responseMap.put("products", productDataList);
        } catch (Exception e) {
            log.error("Error executing getNewArrivals tool", e);
            responseMap.put("error", e.getMessage());
        }
        return responseMap;
    }

    private Map<String, Object> executeGetBestSellers(Map<String, Object> args, List<Product> recommendedList) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            int limit = args.get("limit") != null ? Integer.parseInt(args.get("limit").toString()) : 6;
            limit = Math.min(Math.max(limit, 1), 8);

            List<Product> products = productRepository.findTopSellingProducts(PageRequest.of(0, limit));
            if (products.isEmpty()) {
                products = productRepository.findAllByStatus(com.base.enums.ProductStatus.ACTIVE, PageRequest.of(0, limit)).getContent();
            }
            recommendedList.addAll(products);

            List<Map<String, Object>> productDataList = products.stream()
                    .map(this::buildProductDataMap)
                    .toList();

            responseMap.put("products", productDataList);
        } catch (Exception e) {
            log.error("Error executing getBestSellers tool", e);
            responseMap.put("error", e.getMessage());
        }
        return responseMap;
    }

    private Map<String, Object> executeGetTopRated(Map<String, Object> args, List<Product> recommendedList) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            int limit = args.get("limit") != null ? Integer.parseInt(args.get("limit").toString()) : 6;
            limit = Math.min(Math.max(limit, 1), 8);

            List<Product> products = productRepository.findTop10HighestRatedProducts(PageRequest.of(0, limit));
            recommendedList.addAll(products);

            List<Map<String, Object>> productDataList = products.stream()
                    .map(this::buildProductDataMap)
                    .toList();

            responseMap.put("products", productDataList);
        } catch (Exception e) {
            log.error("Error executing getTopRated tool", e);
            responseMap.put("error", e.getMessage());
        }
        return responseMap;
    }

    private Map<String, Object> executeGetPromotions() {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            List<Promotion> promotions = promotionRepository.findActivePromotions(LocalDateTime.now());
            List<Map<String, Object>> promoList = new ArrayList<>();
            for (Promotion p : promotions) {
                Map<String, Object> pMap = new HashMap<>();
                pMap.put("name", p.getName());
                pMap.put("discountValue", p.getDiscountValue());
                pMap.put("isPercentage", p.isPercentage());
                pMap.put("maxDiscountAmount", p.getMaxDiscountAmount());
                promoList.add(pMap);
            }
            responseMap.put("promotions", promoList);
        } catch (Exception e) {
            log.error("Error executing getPromotions tool", e);
            responseMap.put("error", e.getMessage());
        }
        return responseMap;
    }

    private Map<String, Object> executeCheckOrderStatus(Map<String, Object> args) {
        Map<String, Object> responseMap = new HashMap<>();
        try {
            String orderCode = (String) args.get("orderCode");
            String phone = (String) args.get("phone");

            if (orderCode == null || phone == null) {
                responseMap.put("success", false);
                responseMap.put("message", "Thiếu thông tin tra cứu");
                return responseMap;
            }

            Optional<Order> orderOpt = orderRepository.findByOrderCodeWithDetails(orderCode.trim());
            if (orderOpt.isEmpty()) {
                responseMap.put("success", false);
                responseMap.put("message", "Không tìm thấy đơn hàng.");
                return responseMap;
            }

            Order order = orderOpt.get();
            boolean matched = false;

            String guestPhone = order.getGuestPhone();
            if (guestPhone != null && guestPhone.replace(" ", "").equals(phone.replace(" ", ""))) {
                matched = true;
            }

            if (!matched && order.getCustomer() != null && order.getCustomer().getPhone() != null
                    && order.getCustomer().getPhone().replace(" ", "").equals(phone.replace(" ", ""))) {
                matched = true;
            }

            if (!matched && order.getOrderAddress() != null && order.getOrderAddress().getReceiverPhone() != null
                    && order.getOrderAddress().getReceiverPhone().replace(" ", "").equals(phone.replace(" ", ""))) {
                matched = true;
            }

            if (!matched) {
                responseMap.put("success", false);
                responseMap.put("message", "Số điện thoại không khớp với đơn hàng.");
                return responseMap;
            }

            responseMap.put("success", true);
            responseMap.put("orderCode", order.getOrderCode());
            responseMap.put("status", order.getOrderStatus().toString());
            responseMap.put("totalAmount", order.getFinalAmount());
            responseMap.put("receiverName", order.getOrderAddress() != null ? order.getOrderAddress().getReceiverName() : order.getGuestName());
            responseMap.put("orderDate", order.getOrderDate().toString());
        } catch (Exception e) {
            log.error("Error executing checkOrderStatus tool", e);
            responseMap.put("error", e.getMessage());
        }
        return responseMap;
    }

    private List<ProductResponse> mapProductsToResponses(List<Product> products) {
        List<ProductResponse> list = new ArrayList<>();
        if (products == null) return list;
        for (Product p : products) {
            try {
                list.add(productService.getById(p.getProductId()));
            } catch (Exception e) {
                log.warn("Failed to map recommended product with ID: {}", p.getProductId(), e);
            }
        }
        return list;
    }
}
