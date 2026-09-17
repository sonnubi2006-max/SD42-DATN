package com.base.repository;

import com.base.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Page<Conversation> findByCustomer_CustomerIdOrderByLastMessageAtDesc(
            Long userId, Pageable pageable);

    Page<Conversation> findByCustomer_CustomerIdAndStatusOrderByLastMessageAtDesc(
            Long userId, Conversation.ConversationStatus status, Pageable pageable);

    Page<Conversation> findByStaff_UserIdOrderByLastMessageAtDesc(
            Long staffId, Pageable pageable);

    Page<Conversation> findByStaff_UserIdAndStatusOrderByLastMessageAtDesc(
            Long staffId, Conversation.ConversationStatus status, Pageable pageable);

    Page<Conversation> findAllByOrderByLastMessageAtDesc(Pageable pageable);

    Page<Conversation> findByStatusOrderByLastMessageAtDesc(
            Conversation.ConversationStatus status, Pageable pageable);

    Page<Conversation> findByStaffIsNullAndStatusOrderByCreatedAtAsc(
            Conversation.ConversationStatus status, Pageable pageable);

    boolean existsByCustomer_CustomerIdAndStatusIn(
            Long userId, List<Conversation.ConversationStatus> statuses);
}
