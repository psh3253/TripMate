package com.tripmate.controller;

import com.tripmate.dto.ApiResponse;
import com.tripmate.dto.TourApiDto;
import com.tripmate.dto.TourApiDto.*;
import com.tripmate.service.TourApiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tour")
@RequiredArgsConstructor
public class TourController {

    private final TourApiService tourApiService;

    /**
     * 지역(시도) 코드 목록 조회
     */
    @GetMapping("/areas")
    public ApiResponse<List<AreaCode>> getAreaCodes() {
        return ApiResponse.success(tourApiService.getAreaCodes());
    }

    /**
     * 시군구 코드 목록 조회
     */
    @GetMapping("/areas/{areaCode}/sigungu")
    public ApiResponse<List<AreaCode>> getSigunguCodes(@PathVariable String areaCode) {
        return ApiResponse.success(tourApiService.getSigunguCodes(areaCode));
    }

    /**
     * 지역 기반 관광정보 조회
     */
    @GetMapping("/places")
    public ApiResponse<PageResponse<TourPlace>> getPlaces(
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String sigunguCode,
            @RequestParam(required = false) Integer contentTypeId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        return ApiResponse.success(
                tourApiService.getAreaBasedList(areaCode, sigunguCode, contentTypeId, pageNo, numOfRows)
        );
    }

    /**
     * 관광지 검색
     */
    @GetMapping("/search")
    public ApiResponse<PageResponse<TourPlace>> search(
            @RequestParam String keyword,
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String sigunguCode,
            @RequestParam(required = false) Integer contentTypeId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        SearchRequest request = SearchRequest.builder()
                .keyword(keyword)
                .areaCode(areaCode)
                .sigunguCode(sigunguCode)
                .contentTypeId(contentTypeId)
                .pageNo(pageNo)
                .numOfRows(numOfRows)
                .build();

        return ApiResponse.success(tourApiService.searchByKeyword(request));
    }

    /**
     * 위치 기반 관광정보 조회
     */
    @GetMapping("/nearby")
    public ApiResponse<PageResponse<TourPlace>> getNearbyPlaces(
            @RequestParam Double mapX,
            @RequestParam Double mapY,
            @RequestParam(defaultValue = "5000") Integer radius,
            @RequestParam(required = false) Integer contentTypeId,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        LocationRequest request = LocationRequest.builder()
                .mapX(mapX)
                .mapY(mapY)
                .radius(radius)
                .contentTypeId(contentTypeId)
                .pageNo(pageNo)
                .numOfRows(numOfRows)
                .build();

        return ApiResponse.success(tourApiService.getLocationBasedList(request));
    }

    /**
     * 관광 상세 정보 조회
     */
    @GetMapping("/places/{contentId}")
    public ApiResponse<TourDetail> getPlaceDetail(
            @PathVariable String contentId,
            @RequestParam(required = false) Integer contentTypeId) {
        return ApiResponse.success(tourApiService.getDetailInfo(contentId, contentTypeId));
    }

    /**
     * 관광지 목록 (타입: 12)
     */
    @GetMapping("/attractions")
    public ApiResponse<PageResponse<TourPlace>> getAttractions(
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String sigunguCode,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        return ApiResponse.success(
                tourApiService.getAreaBasedList(areaCode, sigunguCode, TourApiDto.TYPE_ATTRACTION, pageNo, numOfRows)
        );
    }

    /**
     * 음식점 목록 (타입: 39)
     */
    @GetMapping("/restaurants")
    public ApiResponse<PageResponse<TourPlace>> getRestaurants(
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String sigunguCode,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        return ApiResponse.success(
                tourApiService.getAreaBasedList(areaCode, sigunguCode, TourApiDto.TYPE_RESTAURANT, pageNo, numOfRows)
        );
    }

    /**
     * 숙박 목록 (타입: 32)
     */
    @GetMapping("/accommodations")
    public ApiResponse<PageResponse<TourPlace>> getAccommodations(
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String sigunguCode,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        return ApiResponse.success(
                tourApiService.getAreaBasedList(areaCode, sigunguCode, TourApiDto.TYPE_ACCOMMODATION, pageNo, numOfRows)
        );
    }

    /**
     * 축제/행사 목록 (타입: 15)
     */
    @GetMapping("/festivals")
    public ApiResponse<PageResponse<TourPlace>> getFestivals(
            @RequestParam(required = false) String areaCode,
            @RequestParam(required = false) String sigunguCode,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows) {

        return ApiResponse.success(
                tourApiService.getAreaBasedList(areaCode, sigunguCode, TourApiDto.TYPE_FESTIVAL, pageNo, numOfRows)
        );
    }
}
