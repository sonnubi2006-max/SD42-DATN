package com.base.entity;

import com.base.enums.BrandStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "brands")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "brand_id")
    private Long brandId;

    @Column(
            columnDefinition = "NVARCHAR(255)",
            name = "brand_name",
            nullable = false
    )
    private String brandName;

    @Column(name = "brand_code", length = 50)
    private String brandCode;

    private String brandLogo;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private BrandStatus brandStatus = BrandStatus.INACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
