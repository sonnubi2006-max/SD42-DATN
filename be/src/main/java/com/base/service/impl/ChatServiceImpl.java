package com.base.service.impl;

import com.base.dto.request.ImageUploadBannerMessage;
import com.base.dto.request.ImageUploadChatMessage;
import com.base.dto.request.ImageUploadMessage;
import com.base.dto.request.conversation.CreateConversationRequest;
import com.base.dto.request.conversation.SendMessageRequest;
import com.base.dto.response.conversation.ConversationResponse;
import com.base.dto.response.conversation.MessageResponse;
import com.base.entity.*;
import com.base.exception.BadRequestException;
import com.base.exception.ForbiddenException;
import com.base.exception.ResourceNotFoundException;
import com.base.queue.ImageUploadProducer;
import com.base.repository.ConversationRepository;
import com.base.repository.CustomerRepository;
import com.base.repository.MessageRepository;
import com.base.repository.UserRepository;
import com.base.repository.ConversationAssignmentRepository;
import com.base.repository.OrderRepository;
import com.base.mapper.OrderMapper;
import com.base.dto.response.conversation.ConversationAssignmentResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.service.ChatService;
import com.base.service.SocketIOService;
import com.base.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final SecurityUtils securityUtils;
    private final SocketIOService socketIOService;
    private final LocalStorageService localStorageService;
    private final ImageUploadProducer imageUploadProducer;
    private final ConversationAssignmentRepository conversationAssignmentRepository;
    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;

    @Override
    public ConversationResponse createConversation(CreateConversationRequest request, MultipartFile file) {
        Long userId = securityUtils.getCurrentUserId();

        Customer customer = customerRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        boolean hasActive = conversationRepository.existsByCustomer_CustomerIdAndStatusIn(
                userId,
                List.of(
                        Conversation.ConversationStatus.OPEN,
                        Conversation.ConversationStatus.PENDING
                )
        );
        if (hasActive) {
            throw new BadRequestException(
                    "Bạn đang có cuộc hội thoại chưa kết thúc. " +
                            "Vui lòng đóng trước khi tạo mới."
            );
        }

        Conversation conversation = Conversation.builder()
                .customer(customer)
                .title(request.getTitle() != null && !request.getTitle().isBlank()
                        ? request.getTitle()
                        : "Tư vấn #" + userId)
                .status(Conversation.ConversationStatus.PENDING)
                .build();

        conversation = conversationRepository.save(conversation);
        if (request.getFirstMessage() != null && !request.getFirstMessage().isBlank()) {
            Message message = Message.builder()
                    .conversation(conversation)
                    .customer(customer)
                    .messageContent(request.getFirstMessage())
                    .messageType(Message.MessageType.TEXT)
                    .build();

            if (file != null && !file.isEmpty()) {
                String tempPath = localStorageService.saveTempFile(file);
                String tempUrl = localStorageService.getTempUrl(tempPath);

                message.setImageUrl(tempUrl);

                messageRepository.save(message);

                imageUploadProducer.sendUploadMessage(
                        ImageUploadMessage.builder()
                                .id(message.getMessageId())
                                .table("MESSAGE")
                                .tempFilePath(tempPath)
                                .action(ImageUploadMessage.ActionType.CREATE_CONVERSATION)
                                .build()
                );
            } else {
                messageRepository.save(message);
            }
            conversation.updateLastMessage(request.getFirstMessage(), true);
            conversationRepository.save(conversation);
        }

        socketIOService.sendToRoom("staff-room", "new_conversation",
                toConversationResponse(conversation));

        return toConversationResponse(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(Long conversationId) {
        Long currentUserId = securityUtils.getCurrentUserId();

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        validateParticipant(conversation, currentUserId);

        return toConversationResponse(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getMyConversations(
            Conversation.ConversationStatus status, Pageable pageable
    ) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = isCustomer(authentication);

        if (isCustomer) {
            return status != null
                    ? conversationRepository
                    .findByCustomer_CustomerIdAndStatusOrderByLastMessageAtDesc(
                            currentUserId, status, pageable)
                    .map(this::toConversationResponse)
                    : conversationRepository
                    .findByCustomer_CustomerIdOrderByLastMessageAtDesc(
                            currentUserId, pageable)
                    .map(this::toConversationResponse);
        } else {
            userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

            return status != null
                    ? conversationRepository
                    .findByStaff_UserIdAndStatusOrderByLastMessageAtDesc(
                            currentUserId, status, pageable)
                    .map(this::toConversationResponse)
                    : conversationRepository
                    .findByStaff_UserIdOrderByLastMessageAtDesc(
                            currentUserId, pageable)
                    .map(this::toConversationResponse);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getPendingConversations(Pageable pageable) {
        return conversationRepository
                .findByStaffIsNullAndStatusOrderByCreatedAtAsc(
                        Conversation.ConversationStatus.PENDING, pageable)
                .map(this::toConversationResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getAllConversations(
            Conversation.ConversationStatus status, Pageable pageable
    ) {
        Long currentUserId = securityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!hasRole(currentUser, "ADMIN")) {
            throw new ForbiddenException("Chỉ quản trị viên mới có quyền xem tất cả cuộc trò chuyện");
        }

        return status != null
                ? conversationRepository
                .findByStatusOrderByLastMessageAtDesc(status, pageable)
                .map(this::toConversationResponse)
                : conversationRepository
                .findAllByOrderByLastMessageAtDesc(pageable)
                .map(this::toConversationResponse);
    }

    @Override
    public ConversationResponse assignStaff(Long conversationId) {
        Long currentUserId = securityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!hasRole(currentUser, "STAFF") && !hasRole(currentUser, "ADMIN")) {
            throw new ForbiddenException("Chỉ nhân viên mới được tiếp nhận cuộc trò chuyện");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        if (conversation.getStatus() == Conversation.ConversationStatus.CLOSED) {
            throw new BadRequestException("Không thể tiếp nhận cuộc trò chuyện đã đóng");
        }

        if (conversation.getStaff() != null && !hasRole(currentUser, "ADMIN")) {
            throw new BadRequestException("Cuộc trò chuyện đã được nhân viên khác tiếp nhận");
        }

        conversation.setStaff(currentUser);
        conversation.setStatus(Conversation.ConversationStatus.OPEN);
        conversation.setAssignedAt(LocalDateTime.now());
        conversation = conversationRepository.save(conversation);

        ConversationAssignment assignment = ConversationAssignment.builder()
                .conversation(conversation)
                .staff(currentUser)
                .action("ASSIGNED")
                .performedBy(currentUser)
                .notes("Nhân viên " + currentUser.getUsername() + " tiếp nhận cuộc trò chuyện.")
                .build();
        conversationAssignmentRepository.save(assignment);

        socketIOService.sendToCustomer(
                conversation.getCustomer().getCustomerId(),
                "staff_joined",
                toConversationResponse(conversation)
        );

        return toConversationResponse(conversation);
    }

    @Override
    public ConversationResponse reassignStaff(Long conversationId, Long newStaffId) {
        Long currentUserId = securityUtils.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (!hasRole(currentUser, "ADMIN")) {
            throw new ForbiddenException("Chỉ quản trị viên mới được chuyển người phụ trách");
        }

        User newStaff = userRepository.findById(newStaffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));

        if (!hasRole(newStaff, "STAFF")) {
            throw new BadRequestException("Người dùng được chỉ định không phải nhân viên");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        if (conversation.getStatus() == Conversation.ConversationStatus.CLOSED) {
            throw new BadRequestException("Không thể chuyển người phụ trách cho cuộc trò chuyện đã đóng");
        }

        conversation.setStaff(newStaff);
        conversation.setAssignedAt(LocalDateTime.now());
        conversation = conversationRepository.save(conversation);

        ConversationAssignment assignment = ConversationAssignment.builder()
                .conversation(conversation)
                .staff(newStaff)
                .action("REASSIGNED")
                .performedBy(currentUser)
                .notes("Admin " + currentUser.getUsername() + " chỉ định cuộc trò chuyện cho nhân viên " + newStaff.getUsername() + ".")
                .build();
        conversationAssignmentRepository.save(assignment);

        socketIOService.sendToRoom(
                "conversation-" + conversationId,
                "staff_reassigned",
                toConversationResponse(conversation)
        );

        return toConversationResponse(conversation);
    }

    @Override
    public ConversationResponse closeConversation(Long conversationId) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = isCustomer(authentication);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        boolean isOwner = isCustomer
                && conversation.getCustomer().getCustomerId().equals(currentUserId);
        boolean isStaff = !isCustomer
                && conversation.getStaff() != null
                && conversation.getStaff().getUserId().equals(currentUserId);

        boolean isAdmin = false;
        User currentUser = null;
        if (!isCustomer) {
            currentUser = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
            isAdmin = hasRole(currentUser, "ADMIN");
        }

        if (!isOwner && !isStaff && !isAdmin) {
            throw new ForbiddenException("Bạn không có quyền đóng cuộc trò chuyện này");
        }

        if (conversation.getStatus() == Conversation.ConversationStatus.CLOSED) {
            throw new BadRequestException("Cuộc trò chuyện đã được đóng");
        }

        conversation.setStatus(Conversation.ConversationStatus.CLOSED);
        conversation.setClosedAt(LocalDateTime.now());
        conversation.setClosedById(currentUserId);
        conversation.setClosedByType(isCustomer ? "CUSTOMER" : (isAdmin ? "ADMIN" : "STAFF"));
        conversation = conversationRepository.save(conversation);

        ConversationAssignment.ConversationAssignmentBuilder assignmentBuilder = ConversationAssignment.builder()
                .conversation(conversation)
                .action("CLOSED")
                .notes("Cuộc trò chuyện đã đóng bởi " + (isCustomer ? "Khách hàng" : (isAdmin ? "Admin" : "Nhân viên")));

        if (!isCustomer && currentUser != null) {
            assignmentBuilder.performedBy(currentUser);
        }

        conversationAssignmentRepository.save(assignmentBuilder.build());

        socketIOService.sendToRoom(
                "conversation-" + conversationId,
                "conversation_closed",
                toConversationResponse(conversation)
        );

        return toConversationResponse(conversation);
    }

    @Override
    public MessageResponse sendMessage(Long conversationId, SendMessageRequest request, MultipartFile file) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = isCustomer(authentication);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        validateParticipant(conversation, currentUserId);

        if (conversation.getStatus() == Conversation.ConversationStatus.CLOSED) {
            throw new BadRequestException("Cuộc trò chuyện đã đóng, không thể gửi tin nhắn");
        }

        if (request.getMessageType() == Message.MessageType.TEXT
                && (request.getMessageContent() == null
                || request.getMessageContent().isBlank())) {
            throw new BadRequestException("Nội dung tin nhắn không được để trống");
        }

        Message.MessageBuilder messageBuilder = Message.builder()
                .conversation(conversation)
                .messageContent(request.getMessageContent())
                .messageType(request.getMessageType())
                .imageUrl(null);

        Order sharedOrder = null;
        if (request.getMessageType() == Message.MessageType.ORDER) {
            if (request.getOrderId() == null) {
                throw new BadRequestException("Vui lòng chọn đơn hàng cần gửi");
            }

            sharedOrder = orderRepository.findByIdWithDetails(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng"));

            if (sharedOrder.getCustomer() == null
                    || !sharedOrder.getCustomer().getCustomerId()
                    .equals(conversation.getCustomer().getCustomerId())) {
                throw new ForbiddenException("Không thể gửi đơn hàng của khách khác trong cuộc trò chuyện này");
            }

            messageBuilder.order(sharedOrder);
        }

        if (isCustomer) {
            Customer customer = customerRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khách hàng"));
            messageBuilder.customer(customer);
        } else {
            User sender = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
            messageBuilder.user(sender);
        }

        Message message = messageBuilder.build();

        if (file != null && !file.isEmpty()) {
            String tempPath = localStorageService.saveTempFile(file);
            String tempUrl = localStorageService.getTempUrl(tempPath);

            message.setImageUrl(tempUrl);

            message = messageRepository.save(message);

            imageUploadProducer.sendUploadMessage(
                    ImageUploadMessage.builder()
                            .id(message.getMessageId())
                            .table("MESSAGE")
                            .tempFilePath(tempPath)
                            .action(ImageUploadMessage.ActionType.CREATE_CONVERSATION)
                            .build()
            );
        } else {
            message = messageRepository.save(message);
        }

        boolean sentByUser = isCustomer;
        String preview;
        if (request.getMessageType() == Message.MessageType.IMAGE) {
            preview = "[Hình ảnh]";
        } else if (request.getMessageType() == Message.MessageType.ORDER) {
            preview = "[Đơn hàng #" + sharedOrder.getOrderCode() + "]";
        } else {
            preview = request.getMessageContent();
        }

        conversation.updateLastMessage(preview, sentByUser);
        conversationRepository.save(conversation);

        MessageResponse response = toMessageResponse(message);

        socketIOService.sendToRoom(
                "conversation-" + conversation.getConversationId(),
                "new_message",
                response
        );

        Long recipientId = sentByUser
                ? (conversation.getStaff() != null
                    ? conversation.getStaff().getUserId()
                    : null)
                : conversation.getCustomer().getCustomerId();

        boolean recipientOnline = recipientId == null
                || (sentByUser
                    ? socketIOService.isUserOnline(recipientId)
                    : socketIOService.isCustomerOnline(recipientId));

        if (recipientId != null && !recipientOnline) {
            log.info("{} {} offline — push notification pending",
                    sentByUser ? "User" : "Customer", recipientId);
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(Long conversationId, Pageable pageable) {
        Long currentUserId = securityUtils.getCurrentUserId();

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        validateParticipant(conversation, currentUserId);

        return messageRepository
                .findByConversation_ConversationIdAndDeletedFalseOrderBySentAtDesc(
                        conversationId, pageable)
                .map(this::toMessageResponse);
    }

    @Override
    public void markAsRead(Long conversationId) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = isCustomer(authentication);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        validateParticipant(conversation, currentUserId);

        LocalDateTime readAt = LocalDateTime.now();
        if (isCustomer) {
            messageRepository.markStaffMessagesAsRead(conversationId, readAt);
            conversation.setUnreadCountUser(0);
        } else {
            messageRepository.markCustomerMessagesAsRead(conversationId, readAt);
            conversation.setUnreadCountStaff(0);
        }
        conversationRepository.save(conversation);

        socketIOService.sendToRoom(
                "conversation-" + conversationId,
                "messages_read",
                Map.of("conversationId", conversationId, "readBy", currentUserId)
        );
    }

    @Override
    public void deleteMessage(Long messageId) {
        Long currentUserId = securityUtils.getCurrentUserId();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin nhắn"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = isCustomer(authentication);
        boolean isSender = isCustomer
                ? message.getCustomer() != null
                    && message.getCustomer().getCustomerId().equals(currentUserId)
                : message.getUser() != null
                    && message.getUser().getUserId().equals(currentUserId);

        if (!isSender) {
            throw new ForbiddenException("Bạn không có quyền xóa tin nhắn này");
        }

        if (message.getSentAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new BadRequestException("Chỉ có thể xóa tin nhắn trong vòng 5 phút");
        }

        message.setDeleted(true);
        messageRepository.save(message);

        socketIOService.sendToRoom(
                "conversation-" + message.getConversation().getConversationId(),
                "message_deleted",
                Map.of("messageId", messageId)
        );
    }

    private boolean hasRole(User user, String roleName) {
        return Objects.equals(user.getRole().name(), roleName);
    }

    private void validateParticipant(Conversation conversation, Long accountId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (isCustomer(authentication)) {
            boolean isOwner = conversation.getCustomer() != null
                    && conversation.getCustomer().getCustomerId().equals(accountId);
            if (!isOwner) {
                throw new ForbiddenException("Bạn không có quyền truy cập cuộc trò chuyện này");
            }
            return;
        }

        User user = userRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        if (hasRole(user, "ADMIN")) {
            return;
        }

        boolean isAssignedStaff = conversation.getStaff() != null
                && conversation.getStaff().getUserId().equals(accountId);
        if (!isAssignedStaff) {
            throw new ForbiddenException("Bạn không có quyền truy cập cuộc trò chuyện này");
        }
    }

    private boolean isCustomer(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_USER"));
    }

    private MessageResponse toMessageResponse(Message message) {
        Long senderId = null;
        String senderName = null;
        String senderAvatar = null;
        String senderType = null;

        if (message.getCustomer() != null) {
            senderId = message.getCustomer().getCustomerId();
            senderName = message.getCustomer().getFullName() != null
                    ? message.getCustomer().getFullName()
                    : message.getCustomer().getEmail();
            senderAvatar = message.getCustomer().getAvatar();
            senderType = "CUSTOMER";
        } else if (message.getUser() != null) {
            senderId = message.getUser().getUserId();
            senderName = message.getUser().getFullName() != null
                    ? message.getUser().getFullName()
                    : message.getUser().getUsername();
            senderAvatar = message.getUser().getAvatar();
            senderType = message.getUser().getRole().name();
        } else {
            senderName = "Hệ thống";
            senderType = "SYSTEM";
        }

        MessageResponse.MessageResponseBuilder responseBuilder = MessageResponse.builder()
                .messageId(message.getMessageId())
                .conversationId(message.getConversation().getConversationId())
                .senderId(senderId)
                .senderName(senderName)
                .senderAvatar(senderAvatar)
                .senderType(senderType)
                .messageContent(message.isDeleted()
                        ? "[Tin nhắn đã bị xóa]"
                        : message.getMessageContent())
                .imageUrl(message.getImageUrl())
                .messageType(message.getMessageType())
                .isRead(message.isRead())
                .readAt(message.getReadAt())
                .sentAt(message.getSentAt())
                .deleted(message.isDeleted());

        if (message.getOrder() != null) {
            responseBuilder.orderId(message.getOrder().getOrderId());
            responseBuilder.orderSummary(orderMapper.toSummaryResponse(message.getOrder()));
        }

        return responseBuilder.build();
    }

    private ConversationResponse toConversationResponse(Conversation c) {
        return ConversationResponse.builder()
                .conversationId(c.getConversationId())
                .title(c.getTitle())
                .userId(c.getCustomer().getCustomerId())
                .userName(c.getCustomer().getFullName() != null
                        ? c.getCustomer().getFullName()
                        : c.getCustomer().getEmail())
                .userAvatar(c.getCustomer().getAvatar())
                .customerPhone(c.getCustomer().getPhone())
                .customerEmail(c.getCustomer().getEmail())
                .staffId(c.getStaff() != null ? c.getStaff().getUserId() : null)
                .staffName(c.getStaff() != null ? c.getStaff().getUsername() : null)
                .lastMessage(c.getLastMessage())
                .lastMessageAt(c.getLastMessageAt())
                .unreadCountUser(c.getUnreadCountUser())
                .unreadCountStaff(c.getUnreadCountStaff())
                .status(c.getStatus())
                .assignedAt(c.getAssignedAt())
                .closedAt(c.getClosedAt())
                .closedById(c.getClosedById())
                .closedByType(c.getClosedByType())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderSummaryResponse> getSelectableOrders(Pageable pageable) {
        Long currentUserId = securityUtils.getCurrentUserId();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isCustomer = isCustomer(authentication);

        if (!isCustomer) {
            throw new ForbiddenException("Chỉ khách hàng mới có quyền xem danh sách đơn hàng để gửi");
        }

        return orderRepository.findByUserId(currentUserId, null, null, pageable)
                .map(orderMapper::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationAssignmentResponse> getAssignments(Long conversationId) {
        Long currentUserId = securityUtils.getCurrentUserId();

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện"));

        validateParticipant(conversation, currentUserId);

        return conversationAssignmentRepository.findByConversation_ConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(a -> ConversationAssignmentResponse.builder()
                        .assignmentId(a.getAssignmentId())
                        .conversationId(a.getConversation().getConversationId())
                        .staffId(a.getStaff() != null ? a.getStaff().getUserId() : null)
                        .staffName(a.getStaff() != null ? a.getStaff().getUsername() : null)
                        .staffEmail(a.getStaff() != null ? a.getStaff().getEmail() : null)
                        .action(a.getAction())
                        .performedById(a.getPerformedBy() != null ? a.getPerformedBy().getUserId() : null)
                        .performedByName(a.getPerformedBy() != null ? a.getPerformedBy().getUsername() : null)
                        .createdAt(a.getCreatedAt())
                        .notes(a.getNotes())
                        .build())
                .collect(Collectors.toList());
    }
}
