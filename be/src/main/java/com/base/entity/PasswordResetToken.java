package com.base.entity;

import com.base.enums.AccountType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType;

    @Column(nullable = false)
    private Instant expiryDate;

    @Builder.Default
    private boolean used = false;

    public boolean isExpired() {
        return expiryDate.compareTo(Instant.now()) < 0;
    }

    public boolean isUsable() {
        return !used && !isExpired();
    }
}
