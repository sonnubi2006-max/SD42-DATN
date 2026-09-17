package com.base.dto.response.conversation;

import com.base.entity.Message;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Setter
public class MessageResponse {
    private Long messageId;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String senderType;
    private String messageContent;
    private String imageUrl;
    private Message.MessageType messageType;
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime sentAt;
    private boolean deleted;
    private Long orderId;
    private com.base.dto.response.order.OrderSummaryResponse orderSummary;
}
