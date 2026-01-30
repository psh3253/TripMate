package com.tripmate.dto;

import com.tripmate.entity.Trip;
import com.tripmate.entity.TripSchedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripDto {
    private Long id;
    private Long userId;
    private String title;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long budget;
    private List<String> themes;
    private String status;
    private List<TripScheduleDto> schedules;
    private LocalDateTime createdAt;

    public static TripDto from(Trip trip) {
        List<String> themeNames = trip.getThemes().stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        return TripDto.builder()
                .id(trip.getId())
                .userId(trip.getUser().getId())
                .title(trip.getTitle())
                .destination(trip.getDestination())
                .startDate(trip.getStartDate())
                .endDate(trip.getEndDate())
                .budget(trip.getBudget())
                .themes(themeNames)
                .status(trip.getStatus().name())
                .schedules(trip.getSchedules().stream()
                        .map(TripScheduleDto::from)
                        .collect(Collectors.toList()))
                .createdAt(trip.getCreatedAt())
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String title;
        private String destination;
        private LocalDate startDate;
        private LocalDate endDate;
        private Long budget;
        private List<String> themes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String title;
        private String destination;
        private LocalDate startDate;
        private LocalDate endDate;
        private Long budget;
        private List<String> themes;
        private String status;
    }
}
