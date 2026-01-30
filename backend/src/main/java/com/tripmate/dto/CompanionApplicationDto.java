package com.tripmate.dto;

import com.tripmate.entity.CompanionApplication;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanionApplicationDto {
    private Long id;
    private Long companionId;
    private Long userId;
    private UserDto user;
    private String message;
    private String status;
    private LocalDateTime createdAt;

    public static CompanionApplicationDto from(CompanionApplication application) {
        return CompanionApplicationDto.builder()
                .id(application.getId())
                .companionId(application.getCompanion().getId())
                .userId(application.getUser().getId())
                .user(UserDto.from(application.getUser()))
                .message(application.getMessage())
                .status(application.getStatus().name())
                .createdAt(application.getCreatedAt())
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplyRequest {
        private String message;
    }
}
