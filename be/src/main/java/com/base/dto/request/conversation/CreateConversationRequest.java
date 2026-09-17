package com.base.dto.request.conversation;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateConversationRequest {
    private String title;

    @Size(max = 5000)
    private String firstMessage;
}