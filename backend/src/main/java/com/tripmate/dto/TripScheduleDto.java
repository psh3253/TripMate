package com.tripmate.dto;

import com.tripmate.entity.TripSchedule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripScheduleDto {
    private Long id;
    private Long tripId;
    private Integer dayNumber;
    private String time;
    private String placeName;
    private String placeType;
    private String description;
    private Double lat;
    private Double lng;

    public static TripScheduleDto from(TripSchedule schedule) {
        return TripScheduleDto.builder()
                .id(schedule.getId())
                .tripId(schedule.getTrip().getId())
                .dayNumber(schedule.getDayNumber())
                .time(schedule.getTime())
                .placeName(schedule.getPlaceName())
                .placeType(schedule.getPlaceType().name())
                .description(schedule.getDescription())
                .lat(schedule.getLat())
                .lng(schedule.getLng())
                .build();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private Integer dayNumber;
        private String time;
        private String placeName;
        private String placeType;
        private String description;
        private Double lat;
        private Double lng;
    }
}
