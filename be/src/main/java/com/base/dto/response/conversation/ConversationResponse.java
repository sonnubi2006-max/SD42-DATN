package com.base.dto.response.conversation;

import com.base.entity.Conversation;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ConversationResponse {
    private Long conversationId;
    private String title;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String customerPhone;
    private String customerEmail;
    private Long staffId;
    private String staffName;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCountUser;
    private Integer unreadCountStaff;
    private Conversation.ConversationStatus status;
    private LocalDateTime assignedAt;
    private LocalDateTime closedAt;
    private Long closedById;
    private String closedByType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
