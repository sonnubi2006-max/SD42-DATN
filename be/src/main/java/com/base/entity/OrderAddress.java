package com.base.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_address")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderAddress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_address_id")
    private Long orderAddressId;

    @Column(name="receiver_name", columnDefinition = "NVARCHAR(100)")
    private String receiverName;

    @Column(name="receiver_phone")
    private String receiverPhone;

    @Column(columnDefinition = "NVARCHAR(100)")
    private String province;

    @Column(columnDefinition = "NVARCHAR(100)")
    private String district;

    @Column(columnDefinition = "NVARCHAR(100)")
    private String ward;

    @Column(name="detail_address", columnDefinition = "NVARCHAR(255)")
    private String detailAddress;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "order_id",
            nullable = false,
            unique = true
    )
    private Order order;
}
