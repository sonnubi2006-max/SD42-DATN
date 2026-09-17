package com.base.entity;

import com.base.enums.ExchangeDeliveryStatus;
import com.base.enums.ExchangeFulfillmentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exchange_deliveries")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeDelivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exchange_delivery_id")
    private Long exchangeDeliveryId;

    @Version
    @Column(nullable = false)
    private Long version;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false, unique = true)
    private ReturnRequest returnRequest;

    @Column(name = "delivery_code", nullable = false, unique = true, length = 40)
    private String deliveryCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ExchangeDeliveryStatus status = ExchangeDeliveryStatus.PREPARING;

    @Enumerated(EnumType.STRING)
    @Column(name = "fulfillment_method", nullable = false, length = 30)
    @Builder.Default
    private ExchangeFulfillmentMethod fulfillmentMethod = ExchangeFulfillmentMethod.DELIVERY;

    @Column(name = "receiver_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false, length = 20)
    private String receiverPhone;

    @Column(name = "delivery_address", columnDefinition = "NVARCHAR(500)")
    private String deliveryAddress;

    @Column(name = "shipping_fee", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "inventory_restored", nullable = false)
    @Builder.Default
    private Boolean inventoryRestored = false;

    @OneToMany(mappedBy = "exchangeDelivery", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private java.util.List<ExchangeDeliveryLog> logs = new java.util.ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
