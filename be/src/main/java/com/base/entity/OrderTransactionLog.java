package com.base.entity;

import com.base.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_transaction_logs")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderTransactionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    private OrderStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_status", nullable = false)
    private OrderStatus currentStatus;

    @Column(columnDefinition = "NVARCHAR(255)", name = "action")
    private String action;

    @Column(columnDefinition = "NVARCHAR(MAX)", name = "note")
    private String note;

    @Column(columnDefinition = "NVARCHAR(255)", name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "transactionLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<OrderTransactionLogImage> images = new ArrayList<>();
}
