package com.base.entity;

import com.base.enums.CategoryStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(
            columnDefinition = "NVARCHAR(255)",
            name = "category_name",
            nullable = false
    )
    private String categoryName;

    @Column(name = "category_code", length = 50)
    private String categoryCode;

    @Column(columnDefinition = "NVARCHAR(255)")
    private String categoryDescription;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private CategoryStatus categoryStatus = CategoryStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
