package com.tripmate.controller;

import com.tripmate.dto.ApiResponse;
import com.tripmate.dto.AuthDto;
import com.tripmate.dto.UserDto;
import com.tripmate.entity.User;
import com.tripmate.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/kakao")
    public ApiResponse<AuthDto.LoginResponse> kakaoLogin(@RequestBody AuthDto.KakaoLoginRequest request) {
        return ApiResponse.success(authService.kakaoLogin(request.getCode()));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthDto.TokenResponse> refresh(@RequestBody AuthDto.RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request.getRefreshToken()));
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> getMe(@AuthenticationPrincipal User user) {
        return ApiResponse.success(UserDto.from(user));
    }

    @PutMapping("/me")
    public ApiResponse<UserDto> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody AuthDto.UpdateProfileRequest request) {
        return ApiResponse.success(authService.updateProfile(user, request));
    }
}
