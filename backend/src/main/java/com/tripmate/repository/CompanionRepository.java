package com.tripmate.repository;

import com.tripmate.entity.Companion;
import com.tripmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CompanionRepository extends JpaRepository<Companion, Long> {
    Page<Companion> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT c FROM Companion c WHERE c.status = 'RECRUITING' ORDER BY c.createdAt DESC")
    Page<Companion> findRecruitingCompanions(Pageable pageable);

    @Query("SELECT c FROM Companion c WHERE c.trip.destination LIKE %:destination% ORDER BY c.createdAt DESC")
    Page<Companion> findByDestination(@Param("destination") String destination, Pageable pageable);

    List<Companion> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByTripIdAndStatus(Long tripId, Companion.CompanionStatus status);
}
