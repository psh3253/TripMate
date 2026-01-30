package com.tripmate.service;

import com.tripmate.dto.CompanionApplicationDto;
import com.tripmate.dto.CompanionDto;
import com.tripmate.entity.*;
import com.tripmate.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanionService {

    private final CompanionRepository companionRepository;
    private final CompanionApplicationRepository applicationRepository;
    private final TripRepository tripRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Transactional(readOnly = true)
    public Page<CompanionDto> getCompanions(Pageable pageable) {
        return companionRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(CompanionDto::from);
    }

    @Transactional(readOnly = true)
    public CompanionDto getCompanion(Long id) {
        Companion companion = companionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));
        return CompanionDto.from(companion);
    }

    @Transactional
    public CompanionDto createCompanion(User user, CompanionDto.CreateRequest request) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        if (!trip.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        Companion companion = Companion.builder()
                .trip(trip)
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .maxMembers(request.getMaxMembers())
                .build();

        companion = companionRepository.save(companion);

        ChatRoom chatRoom = ChatRoom.builder()
                .companion(companion)
                .build();
        chatRoomRepository.save(chatRoom);

        return CompanionDto.from(companion);
    }

    @Transactional
    public CompanionDto updateCompanion(Long id, User user, CompanionDto.UpdateRequest request) {
        Companion companion = companionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));

        if (!companion.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        if (request.getTitle() != null) companion.setTitle(request.getTitle());
        if (request.getContent() != null) companion.setContent(request.getContent());
        if (request.getMaxMembers() != null) companion.setMaxMembers(request.getMaxMembers());
        if (request.getStatus() != null) companion.setStatus(Companion.CompanionStatus.valueOf(request.getStatus()));

        return CompanionDto.from(companionRepository.save(companion));
    }

    @Transactional
    public void deleteCompanion(Long id, User user) {
        Companion companion = companionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));

        if (!companion.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        companionRepository.delete(companion);
    }

    @Transactional
    public CompanionApplicationDto apply(Long companionId, User user, String message) {
        Companion companion = companionRepository.findById(companionId)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));

        if (companion.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Cannot apply to your own companion");
        }

        if (companion.getStatus() != Companion.CompanionStatus.RECRUITING) {
            throw new IllegalArgumentException("Not recruiting");
        }

        if (applicationRepository.existsByCompanionAndUser(companion, user)) {
            throw new IllegalArgumentException("Already applied");
        }

        CompanionApplication application = CompanionApplication.builder()
                .companion(companion)
                .user(user)
                .message(message)
                .build();

        return CompanionApplicationDto.from(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<CompanionApplicationDto> getApplications(Long companionId, User user) {
        Companion companion = companionRepository.findById(companionId)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));

        if (!companion.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        return applicationRepository.findByCompanionOrderByCreatedAtDesc(companion)
                .stream()
                .map(CompanionApplicationDto::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveApplication(Long companionId, Long userId, User currentUser) {
        Companion companion = companionRepository.findById(companionId)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));

        if (!companion.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        CompanionApplication application = applicationRepository
                .findByCompanionAndUser(companion, User.builder().id(userId).build())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        application.setStatus(CompanionApplication.ApplicationStatus.APPROVED);
        applicationRepository.save(application);

        companion.setCurrentMembers(companion.getCurrentMembers() + 1);
        if (companion.getCurrentMembers() >= companion.getMaxMembers()) {
            companion.setStatus(Companion.CompanionStatus.CLOSED);
        }
        companionRepository.save(companion);
    }

    @Transactional
    public void rejectApplication(Long companionId, Long userId, User currentUser) {
        Companion companion = companionRepository.findById(companionId)
                .orElseThrow(() -> new IllegalArgumentException("Companion not found"));

        if (!companion.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }

        CompanionApplication application = applicationRepository
                .findByCompanionAndUser(companion, User.builder().id(userId).build())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        application.setStatus(CompanionApplication.ApplicationStatus.REJECTED);
        applicationRepository.save(application);
    }
}
