package com.base.service.impl;

import com.base.dto.request.returnRequest.UpdateExchangeDeliveryRequest;
import com.base.entity.*;
import com.base.enums.ExchangeDeliveryStatus;
import com.base.enums.ExchangeFulfillmentMethod;
import com.base.exception.BadRequestException;
import com.base.repository.ExchangeDeliveryLogRepository;
import com.base.repository.ExchangeDeliveryLogImageRepository;
import com.base.repository.ExchangeDeliveryRepository;
import com.base.repository.ExchangeDeliveryDamageRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.UserRepository;
import com.base.utils.SecurityUtils;
import com.base.queue.ImageUploadProducer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExchangeDeliveryServiceImplTest {
    @Mock ExchangeDeliveryRepository repository;
    @Mock ExchangeDeliveryDamageRepository damageRepository;
    @Mock ExchangeDeliveryLogRepository logRepository;
    @Mock ExchangeDeliveryLogImageRepository logImageRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock UserRepository userRepository;
    @Mock SecurityUtils securityUtils;
    @Mock LocalStorageService localStorageService;
    @Mock ImageUploadProducer imageUploadProducer;

    private ExchangeDeliveryServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ExchangeDeliveryServiceImpl(repository, damageRepository, logRepository, logImageRepository,
                variantRepository, userRepository, securityUtils, localStorageService, imageUploadProducer);
    }

    @Test
    void update_shouldRejectInvalidTransition() {
        ExchangeDelivery delivery = delivery(ExchangeDeliveryStatus.PREPARING);
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(delivery));
        UpdateExchangeDeliveryRequest request = new UpdateExchangeDeliveryRequest();
        request.setStatus(ExchangeDeliveryStatus.DELIVERED);

        assertThrows(BadRequestException.class, () -> service.update(1L, request, null));
        verify(repository, never()).save(any());
    }

    @Test
    void update_shouldRequireReasonAndEvidenceForFailure() {
        UpdateExchangeDeliveryRequest request = new UpdateExchangeDeliveryRequest();
        request.setStatus(ExchangeDeliveryStatus.FAILED_DELIVERY);

        assertThrows(BadRequestException.class, () -> service.update(1L, request, null));
        verify(logRepository, never()).save(any());
    }

    @Test
    void update_shouldRestoreInventoryOnceWhenReturnedToShop() {
        ProductVariant variant = ProductVariant.builder().variantId(10L).stockQuantity(5).build();
        ExchangeDelivery delivery = delivery(ExchangeDeliveryStatus.RETURNING);
        delivery.getReturnRequest().setExchangeItems(new ArrayList<>(List.of(ExchangeItem.builder()
                .exchangeItemId(20L).returnRequest(delivery.getReturnRequest()).newVariant(variant)
                .newProductName("Áo đổi").newQuantity(2).build())));
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(delivery));
        when(variantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(variant));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(logRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateExchangeDeliveryRequest request = new UpdateExchangeDeliveryRequest();
        request.setStatus(ExchangeDeliveryStatus.RETURNED_TO_SHOP);
        service.update(1L, request, null);

        assertEquals(7, variant.getStockQuantity());
        assertTrue(delivery.getInventoryRestored());
        assertEquals(ExchangeDeliveryStatus.RETURNED_TO_SHOP, delivery.getStatus());
        verify(variantRepository).save(variant);
        ArgumentCaptor<ExchangeDeliveryLog> log = ArgumentCaptor.forClass(ExchangeDeliveryLog.class);
        verify(logRepository).save(log.capture());
        assertEquals(ExchangeDeliveryStatus.RETURNING, log.getValue().getPreviousStatus());
        assertEquals(ExchangeDeliveryStatus.RETURNED_TO_SHOP, log.getValue().getCurrentStatus());
    }

    @Test
    void update_shouldRecordDamagedReplacementProductsFromExchangeDelivery() {
        ProductVariant variant = ProductVariant.builder()
                .variantId(10L)
                .stockQuantity(5)
                .build();
        ExchangeDelivery delivery = delivery(ExchangeDeliveryStatus.SHIPPING);
        delivery.getReturnRequest().setExchangeItems(new ArrayList<>(List.of(
                ExchangeItem.builder()
                        .exchangeItemId(20L)
                        .returnRequest(delivery.getReturnRequest())
                        .newVariant(variant)
                        .newProductName("Áo đổi")
                        .newQuantity(3)
                        .build()
        )));
        when(repository.findByIdForUpdate(1L)).thenReturn(Optional.of(delivery));
        when(variantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(variant));
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(logRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(damageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(localStorageService.saveTempFile(any())).thenReturn("damage.png");
        when(localStorageService.getTempUrl("damage.png")).thenReturn("/temp/damage.png");
        when(logImageRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateExchangeDeliveryRequest request = new UpdateExchangeDeliveryRequest();
        request.setStatus(ExchangeDeliveryStatus.CANCELED_BY_DAMAGED);
        request.setNote("Sản phẩm đổi bị hỏng khi đang giao");
        UpdateExchangeDeliveryRequest.DamagedItemRequest damagedItem =
                new UpdateExchangeDeliveryRequest.DamagedItemRequest();
        damagedItem.setVariantId(10L);
        damagedItem.setDamagedQuantity(2);
        request.setDamagedItems(List.of(damagedItem));
        MockMultipartFile evidence = new MockMultipartFile(
                "images", "damage.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
        );

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.update(1L, request, List.of(evidence));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }

        ArgumentCaptor<ExchangeDeliveryDamage> damage =
                ArgumentCaptor.forClass(ExchangeDeliveryDamage.class);
        verify(damageRepository).save(damage.capture());
        assertEquals(10L, damage.getValue().getVariant().getVariantId());
        assertEquals(2, damage.getValue().getDamagedQuantity());
        assertEquals(6, variant.getStockQuantity());
    }

    private ExchangeDelivery delivery(ExchangeDeliveryStatus status) {
        Order order = Order.builder().orderId(100L).orderCode("HD100").build();
        ReturnRequest returnRequest = ReturnRequest.builder().returnId(50L).order(order)
                .orderCode("HD100").exchangeItems(new ArrayList<>()).build();
        return ExchangeDelivery.builder().exchangeDeliveryId(1L).returnRequest(returnRequest)
                .deliveryCode("DGH-50").status(status).fulfillmentMethod(ExchangeFulfillmentMethod.DELIVERY)
                .receiverName("Khách").receiverPhone("0900000000").shippingFee(java.math.BigDecimal.ZERO)
                .inventoryRestored(false).logs(new ArrayList<>()).build();
    }
}
