package com.tripmate.controller;

import com.tripmate.dto.AIChatDto;
import com.tripmate.dto.ApiResponse;
import com.tripmate.service.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIChatController {

    private final AIService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AIChatDto.Response>> chat(@RequestBody AIChatDto.Request request) {
        AIChatDto.Response response = aiService.chat(request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/chat/clear")
    public ResponseEntity<ApiResponse<AIChatDto.ClearResponse>> clearSession(@RequestBody AIChatDto.ClearRequest request) {
        AIChatDto.ClearResponse response = aiService.clearSession(request.getSessionId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/chat/status/{sessionId}")
    public ResponseEntity<ApiResponse<AIChatDto.StatusResponse>> getSessionStatus(@PathVariable String sessionId) {
        AIChatDto.StatusResponse response = aiService.getSessionStatus(sessionId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 다중 에이전트 여행 플래너
     */
    @PostMapping("/multi-agent-plan")
    public ResponseEntity<ApiResponse<Map<String, Object>>> multiAgentPlan(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = aiService.multiAgentPlan(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 다중 에이전트 플래너 상태 조회
     */
    @GetMapping("/multi-agent-plan/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMultiAgentStatus() {
        Map<String, Object> response = aiService.getMultiAgentStatus();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
