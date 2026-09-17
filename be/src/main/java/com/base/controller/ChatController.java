package com.base.controller;

import com.base.dto.request.conversation.CreateConversationRequest;
import com.base.dto.request.conversation.SendMessageRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.conversation.ConversationResponse;
import com.base.dto.response.conversation.MessageResponse;
import com.base.dto.response.conversation.ConversationAssignmentResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.entity.Conversation;
import com.base.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping(
            value = "/chat/conversations",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @ModelAttribute @Valid CreateConversationRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(chatService.createConversation(request, file)));
    }

    @GetMapping("/chat/conversations/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Page<ConversationResponse>>> getMyConversations(
            @RequestParam(required = false) Conversation.ConversationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMyConversations(status, pageable)));
    }

    @GetMapping("/chat/conversations/assigned")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<ConversationResponse>>> getAssignedConversations(
            @RequestParam(required = false) Conversation.ConversationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getMyConversations(status, pageable)));
    }

    @GetMapping("/chat/conversations/pending")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<ConversationResponse>>> getPendingConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                chatService.getPendingConversations(pageable)));
    }

    @PatchMapping("/chat/conversations/{conversationId}/assign")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ConversationResponse>> assignStaff(
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                chatService.assignStaff(conversationId)));
    }

    @GetMapping("/admin/chat/conversations")
    public ResponseEntity<ApiResponse<Page<ConversationResponse>>> getAllConversations(
            @RequestParam(required = false) Conversation.ConversationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(chatService.getAllConversations(status, pageable)));
    }

    @PatchMapping("/admin/chat/conversations/{conversationId}/reassign/{staffId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> reassignStaff(
            @PathVariable Long conversationId,
            @PathVariable Long staffId
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.reassignStaff(conversationId, staffId)));
    }

    @GetMapping("/chat/conversations/{conversationId}")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversationById(
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getConversationById(conversationId)));
    }

    @PatchMapping("/chat/conversations/{conversationId}/close")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<ConversationResponse>> closeConversation(
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.closeConversation(conversationId)));
    }

    @GetMapping("/chat/conversations/{conversationId}/messages")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(chatService.getMessages(conversationId, pageable)));
    }

    @PostMapping(
            value = "/chat/messages/{conversationId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @ModelAttribute @Valid SendMessageRequest request,
            @PathVariable Long conversationId,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.sendMessage(conversationId, request, file)));
    }

    @GetMapping("/chat/orders/selectable")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Page<OrderSummaryResponse>>> getSelectableOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(chatService.getSelectableOrders(pageable)));
    }

    @GetMapping("/chat/conversations/{conversationId}/assignments")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<ConversationAssignmentResponse>>> getAssignments(
            @PathVariable Long conversationId
    ) {
        return ResponseEntity.ok(ApiResponse.success(chatService.getAssignments(conversationId)));
    }

    @PatchMapping("/chat/conversations/{conversationId}/read")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long conversationId
    ) {
        chatService.markAsRead(conversationId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/chat/messages/{messageId}")
    @PreAuthorize("hasAnyRole('USER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId
    ) {
        chatService.deleteMessage(messageId);
        return ResponseEntity.noContent().build();
    }
}
