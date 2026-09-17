package com.base.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "addresses")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "address_id")
    private Long addressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name="receiver_name", columnDefinition = "NVARCHAR(100)")
    private String receiverName;

    @Column(name="receiver_phone")
    private String receiverPhone;

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

    @Column(name = "ghn_province_id")
    private Integer ghnProvinceId;

    @Column(name = "ghn_district_id")
    private Integer ghnDistrictId;

    @Column(name = "ghn_ward_code", length = 20)
    private String ghnWardCode;

    @Column(
            name = "province_name",
            columnDefinition = "NVARCHAR(100)"
    )
    private String provinceName;

    @Column(
            name = "district_name",
            columnDefinition = "NVARCHAR(100)"
    )
    private String districtName;

    @Column(
            name = "ward_name",
            columnDefinition = "NVARCHAR(100)"
    )
    private String wardName;

    @Column(
            name = "street_address",
            columnDefinition = "NVARCHAR(255)"
    )
    private String streetAddress;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
