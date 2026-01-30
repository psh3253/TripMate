package com.tripmate.dto;

import com.tripmate.entity.ChatMessage;
import com.tripmate.entity.ChatRoom;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

public class ChatDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomDto {
        private Long id;
        private Long companionId;
        private LocalDateTime createdAt;

        public static RoomDto from(ChatRoom room) {
            return RoomDto.builder()
                    .id(room.getId())
                    .companionId(room.getCompanion().getId())
                    .createdAt(room.getCreatedAt())
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageDto {
        private Long id;
        private Long roomId;
        private Long userId;
        private UserDto user;
        private String content;
        private LocalDateTime createdAt;

        public static MessageDto from(ChatMessage message) {
            return MessageDto.builder()
                    .id(message.getId())
                    .roomId(message.getChatRoom().getId())
                    .userId(message.getUser().getId())
                    .user(UserDto.from(message.getUser()))
                    .content(message.getContent())
                    .createdAt(message.getCreatedAt())
                    .build();
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendMessageRequest {
        private String content;
    }
}
