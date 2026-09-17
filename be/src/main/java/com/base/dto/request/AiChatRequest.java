package com.base.dto.request;

import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class AiChatRequest {
    private String message;
    private List<Map<String, String>> history;
}
