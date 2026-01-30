package com.tripmate.repository;

import com.tripmate.entity.Trip;
import com.tripmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserOrderByCreatedAtDesc(User user);
    Page<Trip> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
