package com.base.controller;

import com.base.dto.request.AiChatRequest;
import com.base.dto.response.ApiResponse;
import com.base.dto.response.AiChatResponse;
import com.base.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AiChatResponse>> chatWithAi(@RequestBody AiChatRequest request) {
        AiChatResponse reply = aiService.generateConsultation(request.getMessage(), request.getHistory());
        return ResponseEntity.ok(ApiResponse.success(reply));
    }
}
