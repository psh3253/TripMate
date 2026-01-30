package com.tripmate.repository;

import com.tripmate.entity.ChatRoom;
import com.tripmate.entity.Companion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByCompanion(Companion companion);

    @Query("SELECT DISTINCT cr FROM ChatRoom cr " +
           "JOIN cr.companion c " +
           "JOIN CompanionApplication ca ON ca.companion = c " +
           "WHERE ca.user.id = :userId AND ca.status = 'APPROVED' " +
           "OR c.user.id = :userId")
    List<ChatRoom> findUserChatRooms(@Param("userId") Long userId);
}
