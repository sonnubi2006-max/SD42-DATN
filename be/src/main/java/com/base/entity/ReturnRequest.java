package com.base.entity;

import com.base.enums.ReturnStatus;
import com.base.enums.ReturnType;
import com.base.enums.ExchangeFulfillmentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "return_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "return_id")
    private Long returnId;

    @Version
    @Column(nullable = false)
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "order_code", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String orderCode;

    @Column(name = "customer_name", nullable = false, columnDefinition = "NVARCHAR(55)")
    private String customerName;

    @Column(name = "customer_phone", columnDefinition = "NVARCHAR(255)")
    private String customerPhone;

    @Column(name = "refund_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal refundAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    @Builder.Default
    private ReturnStatus status = ReturnStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_type", columnDefinition = "NVARCHAR(255)")
    @Builder.Default
    private ReturnType returnType = ReturnType.EXCHANGE;

    @Enumerated(EnumType.STRING)
    @Column(name = "exchange_fulfillment_method", length = 30)
    @Builder.Default
    private ExchangeFulfillmentMethod exchangeFulfillmentMethod = ExchangeFulfillmentMethod.STORE_PICKUP;

    @Column(name = "exchange_receiver_name", columnDefinition = "NVARCHAR(100)")
    private String exchangeReceiverName;

    @Column(name = "exchange_receiver_phone", length = 20)
    private String exchangeReceiverPhone;

    @Column(name = "exchange_delivery_address", columnDefinition = "NVARCHAR(500)")
    private String exchangeDeliveryAddress;

    @Column(name = "exchange_shipping_fee", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal exchangeShippingFee = BigDecimal.ZERO;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String note;

    @Column(name = "reject_reason", columnDefinition = "NVARCHAR(MAX)")
    private String rejectReason;

    @Column(name = "images", columnDefinition = "NVARCHAR(MAX)")
    private String images;

    @Column(name = "processed_images", columnDefinition = "NVARCHAR(MAX)")
    private String processedImages;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by")
    private User processedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReturnItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "returnRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExchangeItem> exchangeItems = new ArrayList<>();
}
