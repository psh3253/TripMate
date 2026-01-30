package com.tripmate.repository;

import com.tripmate.entity.Companion;
import com.tripmate.entity.CompanionApplication;
import com.tripmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CompanionApplicationRepository extends JpaRepository<CompanionApplication, Long> {
    List<CompanionApplication> findByCompanionOrderByCreatedAtDesc(Companion companion);
    Optional<CompanionApplication> findByCompanionAndUser(Companion companion, User user);
    boolean existsByCompanionAndUser(Companion companion, User user);
}
