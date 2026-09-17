package com.base.service.impl;

import com.base.dto.response.product.ProductVariantResponse;
import com.base.dto.response.product.VariantDamageResponse;
import com.base.entity.ExchangeDelivery;
import com.base.entity.ExchangeDeliveryDamage;
import com.base.entity.Order;
import com.base.entity.ReturnRequest;
import com.base.entity.ProductVariant;
import com.base.enums.ProductVariantStatus;
import com.base.exception.BadRequestException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.ProductImageRepository;
import com.base.repository.ProductRepository;
import com.base.repository.OrderDetailRepository;
import com.base.repository.ReturnItemRepository;
import com.base.repository.ExchangeDeliveryDamageRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.ReservationRepository;
import com.base.utils.BarcodeGenerator;
import com.base.utils.SkuGenerator;
import com.base.utils.QrCodeGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductVariantServiceImplTest {

    @Mock private ProductVariantRepository variantRepository;
    @Mock private ProductImageRepository imageRepository;
    @Mock private ProductRepository productRepository;
    @Mock private LocalStorageService localStorageService;
    @Mock private ImageUploadProducer imageUploadProducer;
    @Mock private SkuGenerator skuGenerator;
    @Mock private BarcodeGenerator barcodeGenerator;
    @Mock private QrCodeGenerator qrCodeGenerator;
    @Mock private PromotionRepository promotionRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private OrderDetailRepository orderDetailRepository;
    @Mock private ReturnItemRepository returnItemRepository;
    @Mock private ExchangeDeliveryDamageRepository exchangeDeliveryDamageRepository;
    @Mock private ModelMapper modelMapper;

    @InjectMocks private ProductVariantServiceImpl variantService;

    @Test
    void generateVariantQrCode_shouldBackfillBarcodeAndGeneratePng() {
        ProductVariant variant = ProductVariant.builder()
                .variantId(20L)
                .variantCode("AO-DEN-L")
                .build();
        byte[] png = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47};

        when(variantRepository.findById(20L)).thenReturn(Optional.of(variant));
        when(barcodeGenerator.generateEan13(20L)).thenReturn("2000000000205");
        when(qrCodeGenerator.generatePng("2000000000205")).thenReturn(png);

        byte[] result = variantService.generateVariantQrCode(20L);

        assertArrayEquals(png, result);
        assertEquals("2000000000205", variant.getBarcode());
        verify(variantRepository).save(variant);
        verify(qrCodeGenerator).generatePng("2000000000205");
    }

    @Test
    void findByBarcode_shouldAlsoAcceptExactVariantCode() {
        ProductVariant variant = ProductVariant.builder()
                .variantId(20L)
                .variantCode("AO-DEN-L")
                .barcode("2000000000205")
                .stockQuantity(4)
                .reservedQuantity(0)
                .build();
        ProductVariantResponse mapped = new ProductVariantResponse();
        mapped.setVariantId(20L);

        when(variantRepository.findByBarcode("AO-DEN-L")).thenReturn(Optional.empty());
        when(variantRepository.findByVariantCode("AO-DEN-L")).thenReturn(Optional.of(variant));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(modelMapper.map(variant, ProductVariantResponse.class)).thenReturn(mapped);
        when(reservationRepository.sumActivePosQuantityByVariantId(20L)).thenReturn(0);
        when(reservationRepository.sumActiveOnlineQuantityByVariantId(20L)).thenReturn(0);

        ProductVariantResponse response = variantService.findByBarcode(" AO-DEN-L ");

        assertEquals(20L, response.getVariantId());
        verify(variantRepository).findByVariantCode("AO-DEN-L");
    }

    @Test
    void findById_shouldExposePhysicalStockToPosAndSubtractOnlineHoldsForCustomers() {
        ProductVariant variant = ProductVariant.builder()
                .variantId(20L)
                .stockQuantity(10)
                .reservedQuantity(0)
                .price(java.math.BigDecimal.valueOf(100_000))
                .build();
        ProductVariantResponse mapped = new ProductVariantResponse();

        when(variantRepository.findById(20L)).thenReturn(Optional.of(variant));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        when(modelMapper.map(variant, ProductVariantResponse.class)).thenReturn(mapped);
        when(reservationRepository.sumActivePosQuantityByVariantId(20L)).thenReturn(0);
        when(reservationRepository.sumActiveOnlineQuantityByVariantId(20L)).thenReturn(4);

        ProductVariantResponse response = variantService.findById(20L);

        assertEquals(10, response.getStockQuantity());
        assertEquals(6, response.getAvailableStock());
    }

    @Test
    void getDamageHistory_shouldIncludeProductsDamagedDuringExchangeDelivery() {
        ProductVariant variant = ProductVariant.builder()
                .variantId(20L)
                .variantCode("AO-DEN-L")
                .build();
        Order order = Order.builder().orderId(100L).orderCode("HD100").build();
        ReturnRequest returnRequest = ReturnRequest.builder()
                .returnId(50L)
                .order(order)
                .orderCode("HD100")
                .build();
        ExchangeDelivery delivery = ExchangeDelivery.builder()
                .exchangeDeliveryId(70L)
                .returnRequest(returnRequest)
                .deliveryCode("DGH-70")
                .build();
        ExchangeDeliveryDamage damage = ExchangeDeliveryDamage.builder()
                .damageId(80L)
                .exchangeDelivery(delivery)
                .variant(variant)
                .damagedQuantity(2)
                .createdAt(LocalDateTime.of(2026, 8, 28, 10, 30))
                .build();

        when(variantRepository.findById(20L)).thenReturn(Optional.of(variant));
        when(orderDetailRepository.findDamagedByVariantId(20L)).thenReturn(List.of());
        when(returnItemRepository.findCompletedDamagedByVariantId(20L)).thenReturn(List.of());
        when(exchangeDeliveryDamageRepository.findByVariantIdWithDelivery(20L))
                .thenReturn(List.of(damage));

        VariantDamageResponse response = variantService.getDamageHistory(
                20L, null, "EXCHANGE_DELIVERY", null, null, 0, 10
        );

        assertEquals(2, response.getTotalDamagedQuantity());
        assertEquals(1, response.getRecords().size());
        assertEquals("EXCHANGE_DELIVERY", response.getRecords().get(0).getSource());
        assertEquals(70L, response.getRecords().get(0).getSourceId());
        assertEquals("HD100", response.getRecords().get(0).getOrderCode());
    }

    @Test
    void bulkUpdateStatusUpdatesEveryRequestedVariant() {
        ProductVariant first = ProductVariant.builder()
                .variantId(1L)
                .status(ProductVariantStatus.INACTIVE)
                .build();
        ProductVariant second = ProductVariant.builder()
                .variantId(2L)
                .status(ProductVariantStatus.INACTIVE)
                .build();
        when(variantRepository.findAllById(any())).thenReturn(List.of(first, second));

        variantService.bulkUpdateStatus(List.of(1L, 2L), ProductVariantStatus.ACTIVE);

        assertEquals(ProductVariantStatus.ACTIVE, first.getStatus());
        assertEquals(ProductVariantStatus.ACTIVE, second.getStatus());
        verify(variantRepository).saveAll(List.of(first, second));
    }

    @Test
    void bulkUpdateStatusRejectsUnknownVariantInsteadOfPartiallyUpdating() {
        ProductVariant first = ProductVariant.builder().variantId(1L).build();
        when(variantRepository.findAllById(any())).thenReturn(List.of(first));

        assertThrows(
                ResourceNotFoundException.class,
                () -> variantService.bulkUpdateStatus(
                        List.of(1L, 2L), ProductVariantStatus.ACTIVE)
        );

        verify(variantRepository, never()).saveAll(any());
    }

    @Test
    void bulkUpdateStatusRejectsDuplicateIds() {
        assertThrows(
                BadRequestException.class,
                () -> variantService.bulkUpdateStatus(
                        List.of(1L, 1L), ProductVariantStatus.ACTIVE)
        );

        verify(variantRepository, never()).findAllById(any());
    }
}
