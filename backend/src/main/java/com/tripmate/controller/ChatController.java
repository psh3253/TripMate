package com.tripmate.controller;

import com.tripmate.dto.ApiResponse;
import com.tripmate.dto.ChatDto;
import com.tripmate.entity.User;
import com.tripmate.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/api/chat/rooms")
    public ApiResponse<List<ChatDto.RoomDto>> getRooms(@AuthenticationPrincipal User user) {
        return ApiResponse.success(chatService.getUserRooms(user));
    }

    @GetMapping("/api/chat/rooms/{roomId}")
    public ApiResponse<ChatDto.RoomDto> getRoom(@PathVariable Long roomId) {
        return ApiResponse.success(chatService.getRoom(roomId));
    }

    @GetMapping("/api/chat/rooms/{roomId}/messages")
    public ApiResponse<List<ChatDto.MessageDto>> getMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success(chatService.getMessages(roomId, page, size));
    }

    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/chat/{roomId}")
    public ChatDto.MessageDto sendMessage(
            @DestinationVariable Long roomId,
            ChatDto.SendMessageRequest request,
            SimpMessageHeaderAccessor headerAccessor) {
        User user = (User) headerAccessor.getSessionAttributes().get("user");
        return chatService.sendMessage(roomId, user, request.getContent());
    }
}
