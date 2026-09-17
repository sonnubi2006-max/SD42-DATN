package com.base.service.impl;

import com.base.dto.request.cart.CartItemRequest;
import com.base.entity.Cart;
import com.base.entity.CartItem;
import com.base.entity.Customer;
import com.base.entity.Product;
import com.base.entity.ProductVariant;
import com.base.enums.ProductStatus;
import com.base.enums.ProductVariantStatus;
import com.base.repository.CartItemRepository;
import com.base.repository.CartRepository;
import com.base.repository.CustomerRepository;
import com.base.repository.ProductVariantRepository;
import com.base.repository.PromotionRepository;
import com.base.repository.ReservationRepository;
import com.base.repository.UserRepository;
import com.base.utils.SecurityUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private UserRepository userRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CartRepository cartRepository;
    @Mock private PromotionRepository promotionRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private ModelMapper modelMapper;
    @Mock private SecurityUtils securityUtils;

    @InjectMocks private CartServiceImpl cartService;

    private Cart cart;
    private CartItem cartItem;
    private ProductVariant freshVariant;

    @BeforeEach
    void setUp() {
        Customer customer = new Customer();
        customer.setCustomerId(1L);

        cart = new Cart();
        cart.setCartId(10L);
        cart.setCustomer(customer);

        Product product = new Product();
        product.setProductId(30L);
        product.setProductName("Áo test");
        product.setStatus(ProductStatus.ACTIVE);

        ProductVariant staleVariant = new ProductVariant();
        staleVariant.setVariantId(20L);
        staleVariant.setProduct(product);
        staleVariant.setPrice(new BigDecimal("100000"));
        staleVariant.setStockQuantity(1);
        staleVariant.setStatus(ProductVariantStatus.ACTIVE);

        freshVariant = new ProductVariant();
        freshVariant.setVariantId(20L);
        freshVariant.setProduct(product);
        freshVariant.setPrice(new BigDecimal("100000"));
        freshVariant.setStockQuantity(5);
        freshVariant.setStatus(ProductVariantStatus.ACTIVE);

        cartItem = new CartItem();
        cartItem.setCartItemId(40L);
        cartItem.setCart(cart);
        cartItem.setVariant(staleVariant);
        cartItem.setQuantity(1);
        cartItem.setPrice(new BigDecimal("100000"));

        when(securityUtils.getCurrentUserId()).thenReturn(1L);
        when(productVariantRepository.findByIdForUpdate(20L))
                .thenReturn(Optional.of(freshVariant));
        when(promotionRepository.findActivePromotions(any())).thenReturn(List.of());
        lenient().when(cartItemRepository.save(any(CartItem.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void updateQuantity_shouldUseFreshDatabaseStockInsteadOfStaleCartVariant() {
        CartItemRequest request = new CartItemRequest();
        request.setVariantId(20L);
        request.setQuantity(2);

        when(cartRepository.findByCustomer_CustomerId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartAndVariantForUpdate(10L, 20L))
                .thenReturn(Optional.of(cartItem));

        cartService.updateQuantity(request);

        assertEquals(2, cartItem.getQuantity());
        assertEquals(freshVariant, cartItem.getVariant());
        verify(productVariantRepository).findByIdForUpdate(20L);
    }

    @Test
    void increaseQuantity_shouldUseFreshDatabaseStockAndIncreaseQuantity() {
        when(cartItemRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(cartItem));

        cartService.increaseQuantity(40L);

        assertEquals(2, cartItem.getQuantity());
        assertEquals(freshVariant, cartItem.getVariant());
        verify(productVariantRepository).findByIdForUpdate(20L);
    }

    @Test
    void updateQuantity_shouldAllowQuantityEqualToAvailableStock() {
        freshVariant.setStockQuantity(74);
        CartItemRequest request = new CartItemRequest();
        request.setVariantId(20L);
        request.setQuantity(74);

        when(cartRepository.findByCustomer_CustomerId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartAndVariantForUpdate(10L, 20L))
                .thenReturn(Optional.of(cartItem));

        cartService.updateQuantity(request);

        assertEquals(74, cartItem.getQuantity());
    }

    @Test
    void updateQuantity_shouldExcludeStockHeldByOnlineCodOrders() {
        CartItemRequest request = new CartItemRequest();
        request.setVariantId(20L);
        request.setQuantity(2);

        when(cartRepository.findByCustomer_CustomerId(1L)).thenReturn(Optional.of(cart));
        when(cartItemRepository.findByCartAndVariantForUpdate(10L, 20L))
                .thenReturn(Optional.of(cartItem));
        when(reservationRepository.sumActiveOnlineQuantityByVariantId(20L))
                .thenReturn(4);

        assertThrows(com.base.exception.BadRequestException.class,
                () -> cartService.updateQuantity(request));
        assertEquals(1, cartItem.getQuantity());
    }
}
