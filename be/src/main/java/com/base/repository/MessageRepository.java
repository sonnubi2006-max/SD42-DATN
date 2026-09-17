package com.base.repository;

import com.base.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    Page<Message> findByConversation_ConversationIdAndDeletedFalseOrderBySentAtDesc(
            Long conversationId, Pageable pageable);

    @Modifying
    @Query("""
            UPDATE Message m
            SET m.isRead = true, m.readAt = :readAt
            WHERE m.conversation.conversationId = :conversationId
              AND m.user IS NOT NULL
              AND m.isRead = false
            """)
    int markStaffMessagesAsRead(
            @Param("conversationId") Long conversationId,
            @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("""
            UPDATE Message m
            SET m.isRead = true, m.readAt = :readAt
            WHERE m.conversation.conversationId = :conversationId
              AND m.customer IS NOT NULL
              AND m.isRead = false
            """)
    int markCustomerMessagesAsRead(
            @Param("conversationId") Long conversationId,
            @Param("readAt") LocalDateTime readAt);
}
