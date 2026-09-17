package com.base.service;

import com.base.dto.response.AiChatResponse;
import java.util.List;
import java.util.Map;

public interface AiService {
    AiChatResponse generateConsultation(String message, List<Map<String, String>> history);
}
