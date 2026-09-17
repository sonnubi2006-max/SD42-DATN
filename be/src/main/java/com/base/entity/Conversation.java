package com.base.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conversations")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "conversation_id")
    private Long conversationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by_id")
    private Long closedById;

    @Column(name = "closed_by_type")
    private String closedByType;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.PENDING;

    @Column(columnDefinition = "NVARCHAR(255)", nullable = false)
    private String title;

    @Column(name = "last_message", columnDefinition = "NVARCHAR(255)")
    private String lastMessage;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "unread_count_staff")
    @Builder.Default
    private Integer unreadCountStaff = 0;

    @Column(name = "unread_count_user")
    @Builder.Default
    private Integer unreadCountUser = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    public enum ConversationStatus { PENDING, OPEN, CLOSED }

    public void updateLastMessage(String content, boolean sentByUser) {
        this.lastMessage = content;
        this.lastMessageAt = LocalDateTime.now();
        if (sentByUser) {
            this.unreadCountStaff++;
        } else {
            this.unreadCountUser++;
        }
    }
}
