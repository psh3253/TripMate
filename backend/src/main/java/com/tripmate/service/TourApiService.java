package com.tripmate.service;

import com.tripmate.dto.TourApiDto;
import com.tripmate.dto.TourApiDto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TourApiService {

    private final WebClient webClient;
    private final String baseUrl;
    private final String serviceKey;

    public TourApiService(
            @Value("${tour-api.base-url}") String baseUrl,
            @Value("${tour-api.service-key}") String serviceKey) {
        this.baseUrl = baseUrl;
        this.serviceKey = serviceKey;
        this.webClient = WebClient.builder()
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();
    }

    private String buildUrl(String endpoint, String... params) {
        StringBuilder sb = new StringBuilder(baseUrl)
                .append("/").append(endpoint)
                .append("?serviceKey=").append(serviceKey)
                .append("&MobileOS=ETC")
                .append("&MobileApp=TripMate")
                .append("&_type=json");

        for (int i = 0; i < params.length; i += 2) {
            if (params[i + 1] != null && !params[i + 1].isEmpty()) {
                sb.append("&").append(params[i]).append("=");
                if (params[i].equals("keyword")) {
                    sb.append(URLEncoder.encode(params[i + 1], StandardCharsets.UTF_8));
                } else {
                    sb.append(params[i + 1]);
                }
            }
        }
        return sb.toString();
    }

    /**
     * 지역 코드 조회
     */
    public List<AreaCode> getAreaCodes() {
        String url = buildUrl("areaCode2", "numOfRows", "20");

        try {
            ApiResponse response = webClient.get()
                    .uri(URI.create(url))
                    .retrieve()
                    .bodyToMono(ApiResponse.class)
                    .block();

            if (response != null && response.getResponse() != null
                    && response.getResponse().getBody() != null
                    && response.getResponse().getBody().getItems() != null
                    && response.getResponse().getBody().getItems().getItem() != null) {

                return response.getResponse().getBody().getItems().getItem().stream()
                        .map(item -> AreaCode.builder()
                                .code(item.getCode())
                                .name(item.getName())
                                .build())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Failed to get area codes", e);
        }
        return Collections.emptyList();
    }

    /**
     * 시군구 코드 조회
     */
    public List<AreaCode> getSigunguCodes(String areaCode) {
        String url = buildUrl("areaCode2",
                "areaCode", areaCode,
                "numOfRows", "50");

        try {
            ApiResponse response = webClient.get()
                    .uri(URI.create(url))
                    .retrieve()
                    .bodyToMono(ApiResponse.class)
                    .block();

            if (response != null && response.getResponse() != null
                    && response.getResponse().getBody() != null
                    && response.getResponse().getBody().getItems() != null
                    && response.getResponse().getBody().getItems().getItem() != null) {

                return response.getResponse().getBody().getItems().getItem().stream()
                        .map(item -> AreaCode.builder()
                                .code(item.getCode())
                                .name(item.getName())
                                .build())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            log.error("Failed to get sigungu codes", e);
        }
        return Collections.emptyList();
    }

    /**
     * 지역 기반 관광정보 조회
     */
    public PageResponse<TourPlace> getAreaBasedList(String areaCode, String sigunguCode,
                                                     Integer contentTypeId, int pageNo, int numOfRows) {
        String url = buildUrl("areaBasedList2",
                "pageNo", String.valueOf(pageNo),
                "numOfRows", String.valueOf(numOfRows),
                "arrange", "P",
                "areaCode", areaCode,
                "sigunguCode", sigunguCode,
                "contentTypeId", contentTypeId != null ? String.valueOf(contentTypeId) : null);

        return executeSearch(url, pageNo, numOfRows);
    }

    /**
     * 키워드 검색
     */
    public PageResponse<TourPlace> searchByKeyword(SearchRequest request) {
        int pageNo = request.getPageNo() != null ? request.getPageNo() : 1;
        int numOfRows = request.getNumOfRows() != null ? request.getNumOfRows() : 10;

        String url = buildUrl("searchKeyword2",
                "keyword", request.getKeyword(),
                "pageNo", String.valueOf(pageNo),
                "numOfRows", String.valueOf(numOfRows),
                "arrange", "P",
                "areaCode", request.getAreaCode(),
                "sigunguCode", request.getSigunguCode(),
                "contentTypeId", request.getContentTypeId() != null ? String.valueOf(request.getContentTypeId()) : null);

        return executeSearch(url, pageNo, numOfRows);
    }

    /**
     * 위치 기반 관광정보 조회
     */
    public PageResponse<TourPlace> getLocationBasedList(LocationRequest request) {
        int pageNo = request.getPageNo() != null ? request.getPageNo() : 1;
        int numOfRows = request.getNumOfRows() != null ? request.getNumOfRows() : 10;
        int radius = request.getRadius() != null ? request.getRadius() : 5000;

        String url = buildUrl("locationBasedList2",
                "mapX", String.valueOf(request.getMapX()),
                "mapY", String.valueOf(request.getMapY()),
                "radius", String.valueOf(radius),
                "pageNo", String.valueOf(pageNo),
                "numOfRows", String.valueOf(numOfRows),
                "listYN", "Y",
                "arrange", "E",
                "contentTypeId", request.getContentTypeId() != null ? String.valueOf(request.getContentTypeId()) : null);

        return executeSearch(url, pageNo, numOfRows);
    }

    /**
     * 상세 정보 조회
     */
    public TourDetail getDetailInfo(String contentId, Integer contentTypeId) {
        // 공통 정보 조회
        String commonUrl = buildUrl("detailCommon2",
                "contentId", contentId,
                "defaultYN", "Y",
                "overviewYN", "Y",
                "addrinfoYN", "Y",
                "mapinfoYN", "Y");

        TourDetail detail = TourDetail.builder().build();

        try {
            ApiResponse commonResponse = webClient.get()
                    .uri(URI.create(commonUrl))
                    .retrieve()
                    .bodyToMono(ApiResponse.class)
                    .block();

            if (commonResponse != null && commonResponse.getResponse() != null
                    && commonResponse.getResponse().getBody() != null
                    && commonResponse.getResponse().getBody().getItems() != null
                    && commonResponse.getResponse().getBody().getItems().getItem() != null
                    && !commonResponse.getResponse().getBody().getItems().getItem().isEmpty()) {

                Item item = commonResponse.getResponse().getBody().getItems().getItem().get(0);
                detail = TourDetail.builder()
                        .contentId(item.getContentid())
                        .contentTypeId(item.getContenttypeid())
                        .title(item.getTitle())
                        .overview(item.getOverview())
                        .homepage(item.getHomepage())
                        .addr1(item.getAddr1())
                        .addr2(item.getAddr2())
                        .mapX(item.getMapx())
                        .mapY(item.getMapy())
                        .tel(item.getTel())
                        .firstImage(item.getFirstimage())
                        .firstImage2(item.getFirstimage2())
                        .build();
            }

            // 소개 정보 조회
            if (contentTypeId != null) {
                String introUrl = buildUrl("detailIntro2",
                        "contentId", contentId,
                        "contentTypeId", String.valueOf(contentTypeId));

                ApiResponse introResponse = webClient.get()
                        .uri(URI.create(introUrl))
                        .retrieve()
                        .bodyToMono(ApiResponse.class)
                        .block();

                if (introResponse != null && introResponse.getResponse() != null
                        && introResponse.getResponse().getBody() != null
                        && introResponse.getResponse().getBody().getItems() != null
                        && introResponse.getResponse().getBody().getItems().getItem() != null
                        && !introResponse.getResponse().getBody().getItems().getItem().isEmpty()) {

                    Item introItem = introResponse.getResponse().getBody().getItems().getItem().get(0);
                    detail.setUseTime(introItem.getUsetime());
                    detail.setRestDate(introItem.getRestdate());
                    detail.setParking(introItem.getParking());
                    detail.setChkCreditCard(introItem.getChkcreditcard());
                    detail.setInfocenter(introItem.getInfocenter());
                    detail.setFirstMenu(introItem.getFirstmenu());
                    detail.setTreatMenu(introItem.getTreatmenu());
                    detail.setOpenTime(introItem.getOpentimefood());
                    detail.setCheckInTime(introItem.getCheckintime());
                    detail.setCheckOutTime(introItem.getCheckouttime());
                    detail.setRoomCount(introItem.getRoomcount());
                    detail.setReservationUrl(introItem.getReservationurl());
                }
            }

        } catch (Exception e) {
            log.error("Failed to get detail info for contentId: {}", contentId, e);
        }

        return detail;
    }

    private PageResponse<TourPlace> executeSearch(String url, int pageNo, int numOfRows) {
        try {
            log.debug("Calling Tour API: {}", url);

            ApiResponse response = webClient.get()
                    .uri(URI.create(url))
                    .retrieve()
                    .bodyToMono(ApiResponse.class)
                    .block();

            if (response != null && response.getResponse() != null
                    && response.getResponse().getBody() != null) {

                Body body = response.getResponse().getBody();
                List<TourPlace> places = new ArrayList<>();

                if (body.getItems() != null && body.getItems().getItem() != null) {
                    places = body.getItems().getItem().stream()
                            .map(this::mapToTourPlace)
                            .collect(Collectors.toList());
                }

                return PageResponse.<TourPlace>builder()
                        .items(places)
                        .totalCount(body.getTotalCount())
                        .pageNo(pageNo)
                        .numOfRows(numOfRows)
                        .build();
            }
        } catch (Exception e) {
            log.error("Failed to execute search", e);
        }

        return PageResponse.<TourPlace>builder()
                .items(Collections.emptyList())
                .totalCount(0)
                .pageNo(pageNo)
                .numOfRows(numOfRows)
                .build();
    }

    private TourPlace mapToTourPlace(Item item) {
        Double dist = null;
        if (item.getDist() != null && !item.getDist().isEmpty()) {
            try {
                dist = Double.parseDouble(item.getDist());
            } catch (NumberFormatException ignored) {}
        }

        return TourPlace.builder()
                .contentId(item.getContentid())
                .contentTypeId(item.getContenttypeid())
                .title(item.getTitle())
                .addr1(item.getAddr1())
                .addr2(item.getAddr2())
                .areaCode(item.getAreacode())
                .sigunguCode(item.getSigungucode())
                .cat1(item.getCat1())
                .cat2(item.getCat2())
                .cat3(item.getCat3())
                .firstImage(item.getFirstimage())
                .firstImage2(item.getFirstimage2())
                .mapX(item.getMapx())
                .mapY(item.getMapy())
                .tel(item.getTel())
                .overview(item.getOverview())
                .dist(dist)
                .build();
    }
}
