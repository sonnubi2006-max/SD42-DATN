package com.base.service.impl;

import com.base.dto.request.auth.LoginRequest;
import com.base.dto.request.auth.RegisterRequest;
import com.base.entity.Customer;
import com.base.entity.RefreshToken;
import com.base.enums.CustomerSource;
import com.base.exception.ResourceAlreadyExistsException;
import com.base.repository.CartRepository;
import com.base.repository.CustomerRepository;
import com.base.security.jwt.JwtService;
import com.base.service.GuestOrderLinkService;
import com.base.service.PasswordResetService;
import com.base.service.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private CartRepository cartRepository;
    @Mock private PasswordResetService passwordResetService;
    @Mock private GuestOrderLinkService guestOrderLinkService;

    @InjectMocks private AuthServiceImpl authService;

    @Test
    void registerNormalizesEmailAndLinksPreviousGuestOrders() {
        RegisterRequest request = registerRequest("  Customer@Example.COM  ");
        when(customerRepository.findByEmailIgnoreCase("customer@example.com"))
                .thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret1")).thenReturn("encoded");
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer saved = invocation.getArgument(0);
            saved.setCustomerId(42L);
            return saved;
        });
        when(cartRepository.findByCustomer_CustomerId(42L)).thenReturn(Optional.empty());
        stubTokens();

        authService.register(request);

        ArgumentCaptor<Customer> customerCaptor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(customerCaptor.capture());
        Customer customer = customerCaptor.getValue();
        assertEquals("customer@example.com", customer.getEmail());
        assertEquals(CustomerSource.REGISTERED, customer.getSource());
        verify(guestOrderLinkService).linkUnassignedOrders(customer);
    }

    @Test
    void registerUpgradesExistingGuestCustomerInsteadOfCreatingDuplicate() {
        RegisterRequest request = registerRequest("guest@example.com");
        request.setFullName("Tên tài khoản");
        Customer guest = Customer.builder()
                .customerId(9L)
                .email("guest@example.com")
                .fullName("Tên lúc mua hàng")
                .source(CustomerSource.GUEST)
                .build();
        when(customerRepository.findByEmailIgnoreCase("guest@example.com"))
                .thenReturn(Optional.of(guest));
        when(passwordEncoder.encode("secret1")).thenReturn("encoded");
        when(customerRepository.save(guest)).thenReturn(guest);
        when(cartRepository.findByCustomer_CustomerId(9L)).thenReturn(Optional.empty());
        stubTokens();

        authService.register(request);

        assertEquals(CustomerSource.REGISTERED, guest.getSource());
        assertEquals("encoded", guest.getPassword());
        assertEquals("Tên tài khoản", guest.getFullName());
        verify(guestOrderLinkService).linkUnassignedOrders(guest);
    }

    @Test
    void registerStillRejectsAnExistingRegisteredAccount() {
        RegisterRequest request = registerRequest("used@example.com");
        Customer registered = Customer.builder()
                .customerId(5L)
                .email("used@example.com")
                .password("encoded")
                .source(CustomerSource.REGISTERED)
                .build();
        when(customerRepository.findByEmailIgnoreCase("used@example.com"))
                .thenReturn(Optional.of(registered));

        assertThrows(ResourceAlreadyExistsException.class, () -> authService.register(request));

        verify(customerRepository, never()).save(any());
        verify(guestOrderLinkService, never()).linkUnassignedOrders(any());
    }

    @Test
    void loginLinksHistoricalGuestOrdersAndAuthenticatesWithNormalizedEmail() {
        LoginRequest request = new LoginRequest();
        request.setEmail("  Customer@Example.COM ");
        request.setPassword("secret1");
        Customer customer = Customer.builder()
                .customerId(42L)
                .email("customer@example.com")
                .password("encoded")
                .source(CustomerSource.REGISTERED)
                .build();
        when(customerRepository.findByEmailIgnoreCase("customer@example.com"))
                .thenReturn(Optional.of(customer));
        stubTokens();

        authService.login(request);

        ArgumentCaptor<UsernamePasswordAuthenticationToken> tokenCaptor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(tokenCaptor.capture());
        assertEquals("customer@example.com", tokenCaptor.getValue().getPrincipal());
        verify(guestOrderLinkService).linkUnassignedOrders(customer);
    }

    private RegisterRequest registerRequest(String email) {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(email);
        request.setPassword("secret1");
        request.setFullName("Khách hàng");
        request.setPhone("0900000000");
        return request;
    }

    private void stubTokens() {
        when(jwtService.generateToken(any(Customer.class))).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(any(Customer.class)))
                .thenReturn(RefreshToken.builder().token("refresh-token").build());
    }
}
