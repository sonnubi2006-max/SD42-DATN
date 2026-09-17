package com.base.entity;

import com.base.enums.RoleUser;
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
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_code", length = 20)
    private String userCode;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true)
    private String phone;

    @Column(name = "full_name", columnDefinition = "NVARCHAR(255)")
    private String fullName;

    private String avatar;

    @Builder.Default
    private String gender = "MALE";

    @Column(unique = true)
    private String cccd;

    private LocalDate birthday;

    @Column(
            columnDefinition = "NVARCHAR(100)"
    )
    private String province;

    @Column(
            columnDefinition = "NVARCHAR(100)"
    )
    private String district;

    @Column(
            columnDefinition = "NVARCHAR(100)"
    )
    private String ward;

    @Column(
            name = "street_address",
            columnDefinition = "NVARCHAR(255)"
    )
    private String streetAddress;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RoleUser role = RoleUser.STAFF;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    void ensureUserCode() {
        if (userCode == null || userCode.isBlank()) {
            userCode = BusinessCodeGenerator.generate("USR");
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(
                new SimpleGrantedAuthority("ROLE_" + role.name())
        );
    }

    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return status != UserStatus.BANNED; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return status == UserStatus.ACTIVE; }

    public enum UserStatus { ACTIVE, INACTIVE, BANNED }
}
