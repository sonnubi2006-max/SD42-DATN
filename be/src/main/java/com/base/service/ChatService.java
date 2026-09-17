package com.base.service;

import com.base.dto.request.conversation.CreateConversationRequest;
import com.base.dto.request.conversation.SendMessageRequest;
import com.base.dto.response.conversation.ConversationResponse;
import com.base.dto.response.conversation.MessageResponse;
import com.base.dto.response.conversation.ConversationAssignmentResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChatService {
    ConversationResponse createConversation(CreateConversationRequest request, MultipartFile file);
    ConversationResponse getConversationById(Long conversationId);
    Page<ConversationResponse> getMyConversations(
            Conversation.ConversationStatus status, Pageable pageable);
    Page<ConversationResponse> getPendingConversations(Pageable pageable);
    Page<ConversationResponse> getAllConversations(
            Conversation.ConversationStatus status, Pageable pageable);
    ConversationResponse assignStaff(Long conversationId);
    ConversationResponse reassignStaff(Long conversationId, Long newStaffId);
    ConversationResponse closeConversation(Long conversationId);
    MessageResponse sendMessage(Long conversationId, SendMessageRequest request, MultipartFile file);
    Page<MessageResponse> getMessages(Long conversationId, Pageable pageable);
    void markAsRead(Long conversationId);
    void deleteMessage(Long messageId);
    Page<OrderSummaryResponse> getSelectableOrders(Pageable pageable);
    List<ConversationAssignmentResponse> getAssignments(Long conversationId);
}
