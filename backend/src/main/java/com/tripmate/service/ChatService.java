package com.tripmate.service;

import com.tripmate.dto.ChatDto;
import com.tripmate.entity.ChatMessage;
import com.tripmate.entity.ChatRoom;
import com.tripmate.entity.User;
import com.tripmate.repository.ChatMessageRepository;
import com.tripmate.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public List<ChatDto.RoomDto> getUserRooms(User user) {
        return chatRoomRepository.findUserChatRooms(user.getId())
                .stream()
                .map(ChatDto.RoomDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ChatDto.RoomDto getRoom(Long roomId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));
        return ChatDto.RoomDto.from(room);
    }

    @Transactional(readOnly = true)
    public List<ChatDto.MessageDto> getMessages(Long roomId, int page, int size) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        return chatMessageRepository.findByChatRoomOrderByCreatedAtDesc(room, PageRequest.of(page, size))
                .stream()
                .map(ChatDto.MessageDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatDto.MessageDto sendMessage(Long roomId, User user, String content) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Chat room not found"));

        ChatMessage message = ChatMessage.builder()
                .chatRoom(room)
                .user(user)
                .content(content)
                .build();

        return ChatDto.MessageDto.from(chatMessageRepository.save(message));
    }
}
