package com.tripmate.dto;

import com.tripmate.entity.Companion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanionDto {
    private Long id;
    private Long tripId;
    private Long userId;
    private UserDto user;
    private TripDto trip;
    private String title;
    private String content;
    private Integer maxMembers;
    private Integer currentMembers;
    private String status;
    private LocalDateTime createdAt;

    public static CompanionDto from(Companion companion) {
        return CompanionDto.builder()
                .id(companion.getId())
                .tripId(companion.getTrip().getId())
                .userId(companion.getUser().getId())
                .user(UserDto.from(companion.getUser()))
                .trip(TripDto.from(companion.getTrip()))
                .title(companion.getTitle())
                .content(companion.getContent())
                .maxMembers(companion.getMaxMembers())
                .currentMembers(companion.getCurrentMembers())
                .status(companion.getStatus().name())
                .createdAt(companion.getCreatedAt())
                .build();
    }

    public static CompanionDto fromSimple(Companion companion) {
        return CompanionDto.builder()
                .id(companion.getId())
                .tripId(companion.getTrip().getId())
                .userId(companion.getUser().getId())
                .title(companion.getTitle())
                .content(companion.getContent())
                .maxMembers(companion.getMaxMembers())
                .currentMembers(companion.getCurrentMembers())
                .status(companion.getStatus().name())
                .createdAt(companion.getCreatedAt())
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Long tripId;
        private String title;
        private String content;
        private Integer maxMembers;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String title;
        private String content;
        private Integer maxMembers;
        private String status;
    }
}
