package com.base.entity;

import com.base.enums.CustomerSource;
import com.base.utils.BusinessCodeGenerator;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "customers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_code", length = 20)
    private String customerCode;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    @Column(name = "full_name", columnDefinition = "NVARCHAR(255)")
    private String fullName;

    private String phone;

    @Builder.Default
    private String gender = "MALE";

    private LocalDate birthday;

    private String avatar;

    @Builder.Default
    private String role = "USER";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CustomerSource source = CustomerSource.GUEST;

    @Column(name = "email_subscribed")
    @Builder.Default
    private Boolean emailSubscribed = true;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CustomerStatus status = CustomerStatus.ACTIVE;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Address> addresses = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void ensureCustomerCode() {
        if (customerCode == null || customerCode.isBlank()) {
            customerCode = BusinessCodeGenerator.generate("CUS");
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + role)
        );
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    public enum CustomerStatus { ACTIVE, INACTIVE, BANNED }
}
