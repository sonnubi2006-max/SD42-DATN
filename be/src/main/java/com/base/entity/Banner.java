package com.base.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "banners")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "banner_id")
    private Long bannerId;

    @Column(
            columnDefinition = "NVARCHAR(255)",
            nullable = false
    )
    private String title;

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "redirect_url")
    private String redirectUrl;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
