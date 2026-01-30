package com.tripmate.repository;

import com.tripmate.entity.Trip;
import com.tripmate.entity.TripSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TripScheduleRepository extends JpaRepository<TripSchedule, Long> {
    List<TripSchedule> findByTripOrderByDayNumberAscTimeAsc(Trip trip);
    void deleteByTrip(Trip trip);
}
