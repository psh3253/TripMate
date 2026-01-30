package com.tripmate.controller;

import com.tripmate.dto.ApiResponse;
import com.tripmate.dto.CompanionApplicationDto;
import com.tripmate.dto.CompanionDto;
import com.tripmate.entity.User;
import com.tripmate.service.CompanionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companions")
@RequiredArgsConstructor
public class CompanionController {

    private final CompanionService companionService;

    @GetMapping
    public ApiResponse<Page<CompanionDto>> getCompanions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(companionService.getCompanions(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<CompanionDto> getCompanion(@PathVariable Long id) {
        return ApiResponse.success(companionService.getCompanion(id));
    }

    @PostMapping
    public ApiResponse<CompanionDto> createCompanion(
            @AuthenticationPrincipal User user,
            @RequestBody CompanionDto.CreateRequest request) {
        return ApiResponse.success(companionService.createCompanion(user, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CompanionDto> updateCompanion(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody CompanionDto.UpdateRequest request) {
        return ApiResponse.success(companionService.updateCompanion(id, user, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCompanion(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        companionService.deleteCompanion(id, user);
        return ApiResponse.success(null, "Companion deleted");
    }

    @PostMapping("/{id}/apply")
    public ApiResponse<CompanionApplicationDto> apply(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody CompanionApplicationDto.ApplyRequest request) {
        return ApiResponse.success(companionService.apply(id, user, request.getMessage()));
    }

    @GetMapping("/{id}/applications")
    public ApiResponse<List<CompanionApplicationDto>> getApplications(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ApiResponse.success(companionService.getApplications(id, user));
    }

    @PostMapping("/{id}/approve/{userId}")
    public ApiResponse<Void> approveApplication(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        companionService.approveApplication(id, userId, user);
        return ApiResponse.success(null, "Application approved");
    }

    @PostMapping("/{id}/reject/{userId}")
    public ApiResponse<Void> rejectApplication(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal User user) {
        companionService.rejectApplication(id, userId, user);
        return ApiResponse.success(null, "Application rejected");
    }
}
