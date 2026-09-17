package com.base.config;

import com.base.exception.handler.ErrorResponse;
import com.base.security.jwt.JwtAuthenticationFilter;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174}")
    private List<String> allowedOrigins;

    private static final String[] PUBLIC_URLS = {
            "/api/v1/auth/**",
            "/uploads/**",
            "/api/v1/payments/vnpay/ipn",
            "/api/v1/payments/vnpay/return",
            "/actuator/health",
            "/actuator/health/**"
    };

    private static final String[] PUBLIC_GET_URLS = {
            "/api/v1/category/**",
            "/api/v1/brand/**",
            "/api/v1/banners/**",
            "/api/v1/products",
            "/api/v1/products/{id}",
            "/api/v1/products/code/**",
            "/api/v1/products/{productId}/variants",
            "/api/v1/products/variants/{variantId}",
            "/api/v1/products/top-rated",
            "/api/v1/products/best-sellers",
            "/api/v1/products/price-range",
            "/api/v1/reviews/product/**",
            "/api/v1/shipping/**",
            "/api/v1/promotions/active",
            "/api/v1/coupons"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {})
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/manager/register").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,
                        "/api/v1/auth/logout",
                        "/api/v1/auth/manager/logout").authenticated()
                .requestMatchers(HttpMethod.POST,
                        "/api/v1/orders",
                        "/api/v1/orders/guest/lookup",
                        "/api/v1/payments/guest/init",
                        "/api/v1/payments/guest/status",
                        "/api/v1/coupons/validate").permitAll()
                .requestMatchers(PUBLIC_URLS).permitAll()
                .requestMatchers(HttpMethod.GET, PUBLIC_GET_URLS).permitAll()
                .requestMatchers("/api/v1/profile").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(
                        "/api/v1/admin/products",
                        "/api/v1/admin/products/**",
                        "/api/v1/admin/category",
                        "/api/v1/admin/category/**",
                        "/api/v1/admin/brand",
                        "/api/v1/admin/brand/**"
                ).hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/manager/**").hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/v1/wishlist/**").hasRole("USER")
                .requestMatchers("/api/v1/cart/**").hasRole("USER")
                .requestMatchers("/api/v1/returns/**").hasRole("USER")
                .requestMatchers("/api/v1/ai/**").hasRole("USER")
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            writeSecurityError(response, HttpServletResponse.SC_UNAUTHORIZED,
                                    "Phiên đăng nhập đã hết hạn hoặc không hợp lệ", request.getRequestURI());
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            writeSecurityError(response, HttpServletResponse.SC_FORBIDDEN,
                                    "Bạn không có quyền thực hiện thao tác này", request.getRequestURI());
                        })
                )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void writeSecurityError(
            HttpServletResponse response,
            int status,
            String message,
            String path
    ) throws java.io.IOException {
        response.setStatus(status);
        response.setCharacterEncoding(java.nio.charset.StandardCharsets.UTF_8.name());
        response.setContentType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), ErrorResponse.builder()
                .status(status)
                .error(status == HttpServletResponse.SC_UNAUTHORIZED
                        ? "Chưa xác thực"
                        : "Không có quyền truy cập")
                .message(message)
                .path(path)
                .build());
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(List.of("Content-Disposition"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
