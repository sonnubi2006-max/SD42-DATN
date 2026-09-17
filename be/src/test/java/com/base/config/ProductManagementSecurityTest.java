package com.base.config;

import com.base.controller.ProductController;
import com.base.dto.response.product.ProductResponse;
import com.base.security.jwt.JwtAuthenticationFilter;
import com.base.service.ProductService;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(SecurityConfig.class)
class ProductManagementSecurityTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ProductService productService;
    @MockitoBean private JwtAuthenticationFilter jwtAuthenticationFilter;
    @MockitoBean private UserDetailsService userDetailsService;

    @BeforeEach
    void continueThroughJwtFilter() throws Exception {
        doAnswer(invocation -> {
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    void staffCanAccessProductManagementEndpoints() throws Exception {
        when(productService.getByIdAdmin(1L)).thenReturn(new ProductResponse());

        mockMvc.perform(get("/api/v1/admin/products/1")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isOk());
    }

    @Test
    void staffStillCannotAccessOtherAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/1")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isForbidden());
    }
}
