package com.base.repository;

import com.base.entity.ConversationAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationAssignmentRepository extends JpaRepository<ConversationAssignment, Long> {
    List<ConversationAssignment> findByConversation_ConversationIdOrderByCreatedAtAsc(Long conversationId);
}