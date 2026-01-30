package com.tripmate.service;

import com.tripmate.dto.TripDto;
import com.tripmate.dto.TripScheduleDto;
import com.tripmate.entity.Companion;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripSchedule;
import com.tripmate.entity.User;
import com.tripmate.repository.CompanionRepository;
import com.tripmate.repository.TripRepository;
import com.tripmate.repository.TripScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripScheduleRepository tripScheduleRepository;
    private final CompanionRepository companionRepository;

    @Transactional(readOnly = true)
    public Page<TripDto> getTrips(Pageable pageable) {
        return tripRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(TripDto::from);
    }

    @Transactional(readOnly = true)
    public List<TripDto> getMyTrips(User user) {
        return tripRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(TripDto::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TripDto getTrip(Long id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));
        return TripDto.from(trip);
    }

    @Transactional
    public TripDto createTrip(User user, TripDto.CreateRequest request) {
        List<Trip.TripTheme> themes = request.getThemes().stream()
                .map(Trip.TripTheme::valueOf)
                .collect(Collectors.toList());

        Trip trip = Trip.builder()
                .user(user)
                .title(request.getTitle())
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(request.getBudget())
                .themes(themes)
                .build();

        return TripDto.from(tripRepository.save(trip));
    }

    @Transactional
    public TripDto updateTrip(Long id, User user, TripDto.UpdateRequest request) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!trip.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        if (request.getTitle() != null) trip.setTitle(request.getTitle());
        if (request.getDestination() != null) trip.setDestination(request.getDestination());
        if (request.getStartDate() != null) trip.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) trip.setEndDate(request.getEndDate());
        if (request.getBudget() != null) trip.setBudget(request.getBudget());
        if (request.getThemes() != null && !request.getThemes().isEmpty()) {
            trip.setThemes(request.getThemes().stream()
                    .map(Trip.TripTheme::valueOf)
                    .collect(Collectors.toList()));
        }
        if (request.getStatus() != null) trip.setStatus(Trip.TripStatus.valueOf(request.getStatus()));

        return TripDto.from(tripRepository.save(trip));
    }

    @Transactional
    public void deleteTrip(Long id, User user) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!trip.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        // 모집 중인 동행이 있는지 확인
        if (companionRepository.existsByTripIdAndStatus(id, Companion.CompanionStatus.RECRUITING)) {
            throw new IllegalStateException("모집 중인 동행이 있어 삭제할 수 없습니다. 먼저 동행 모집을 마감해주세요.");
        }

        tripRepository.delete(trip);
    }

    @Transactional(readOnly = true)
    public List<TripScheduleDto> getSchedules(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));
        return tripScheduleRepository.findByTripOrderByDayNumberAscTimeAsc(trip)
                .stream()
                .map(TripScheduleDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TripScheduleDto> updateSchedules(Long tripId, User user, List<TripScheduleDto.CreateRequest> schedules) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!trip.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        tripScheduleRepository.deleteByTrip(trip);

        List<TripSchedule> newSchedules = schedules.stream()
                .map(s -> TripSchedule.builder()
                        .trip(trip)
                        .dayNumber(s.getDayNumber())
                        .time(s.getTime())
                        .placeName(s.getPlaceName())
                        .placeType(TripSchedule.PlaceType.valueOf(s.getPlaceType()))
                        .description(s.getDescription())
                        .lat(s.getLat())
                        .lng(s.getLng())
                        .build())
                .collect(Collectors.toList());

        return tripScheduleRepository.saveAll(newSchedules)
                .stream()
                .map(TripScheduleDto::from)
                .collect(Collectors.toList());
    }
}
