package com.base.dto.response.conversation;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationAssignmentResponse {
    private Long assignmentId;
    private Long conversationId;
    private Long staffId;
    private String staffName;
    private String staffEmail;
    private String action;
    private Long performedById;
    private String performedByName;
    private LocalDateTime createdAt;
    private String notes;
}