package com.tripmate.controller;

import com.tripmate.dto.ApiResponse;
import com.tripmate.dto.TripDto;
import com.tripmate.dto.TripScheduleDto;
import com.tripmate.entity.User;
import com.tripmate.service.AIService;
import com.tripmate.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;
    private final AIService aiService;

    @GetMapping
    public ApiResponse<Page<TripDto>> getTrips(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(tripService.getTrips(PageRequest.of(page, size)));
    }

    @GetMapping("/my")
    public ApiResponse<List<TripDto>> getMyTrips(@AuthenticationPrincipal User user) {
        return ApiResponse.success(tripService.getMyTrips(user));
    }

    @GetMapping("/{id}")
    public ApiResponse<TripDto> getTrip(@PathVariable Long id) {
        return ApiResponse.success(tripService.getTrip(id));
    }

    @PostMapping
    public ApiResponse<TripDto> createTrip(
            @AuthenticationPrincipal User user,
            @RequestBody TripDto.CreateRequest request) {
        return ApiResponse.success(tripService.createTrip(user, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<TripDto> updateTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody TripDto.UpdateRequest request) {
        return ApiResponse.success(tripService.updateTrip(id, user, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        tripService.deleteTrip(id, user);
        return ApiResponse.success(null, "Trip deleted");
    }

    @GetMapping("/{id}/schedules")
    public ApiResponse<List<TripScheduleDto>> getSchedules(@PathVariable Long id) {
        return ApiResponse.success(tripService.getSchedules(id));
    }

    @PutMapping("/{id}/schedules")
    public ApiResponse<List<TripScheduleDto>> updateSchedules(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody List<TripScheduleDto.CreateRequest> schedules) {
        return ApiResponse.success(tripService.updateSchedules(id, user, schedules));
    }

    @PostMapping("/{id}/ai-recommend")
    public ApiResponse<Map<String, Object>> getAIRecommendation(@PathVariable Long id) {
        return ApiResponse.success(aiService.getRecommendation(id));
    }
}
