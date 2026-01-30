package com.tripmate.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class TourApiDto {

    // 관광 타입 코드
    public static final int TYPE_ATTRACTION = 12;    // 관광지
    public static final int TYPE_CULTURE = 14;       // 문화시설
    public static final int TYPE_FESTIVAL = 15;      // 축제/행사
    public static final int TYPE_COURSE = 25;        // 여행코스
    public static final int TYPE_LEISURE = 28;       // 레저/스포츠
    public static final int TYPE_ACCOMMODATION = 32; // 숙박
    public static final int TYPE_SHOPPING = 38;      // 쇼핑
    public static final int TYPE_RESTAURANT = 39;    // 음식점

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TourPlace {
        private String contentId;
        private String contentTypeId;
        private String title;
        private String addr1;
        private String addr2;
        private String areaCode;
        private String sigunguCode;
        private String cat1;
        private String cat2;
        private String cat3;
        private String firstImage;
        private String firstImage2;
        private String mapX;  // 경도
        private String mapY;  // 위도
        private String tel;
        private String overview;
        private Double dist;  // 거리 (위치 기반 검색시)
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TourDetail {
        private String contentId;
        private String contentTypeId;
        private String title;
        private String overview;
        private String homepage;
        private String addr1;
        private String addr2;
        private String mapX;
        private String mapY;
        private String tel;
        private String firstImage;
        private String firstImage2;

        // 상세 정보
        private String useTime;       // 이용시간
        private String restDate;      // 휴무일
        private String parking;       // 주차시설
        private String chkCreditCard; // 신용카드
        private String infocenter;    // 문의처

        // 음식점 전용
        private String firstMenu;     // 대표메뉴
        private String treatMenu;     // 취급메뉴
        private String openTime;      // 영업시간

        // 숙박 전용
        private String checkInTime;
        private String checkOutTime;
        private String roomCount;
        private String reservationUrl;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AreaCode {
        private String code;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SearchRequest {
        private String keyword;
        private String areaCode;
        private String sigunguCode;
        private Integer contentTypeId;
        private Integer pageNo;
        private Integer numOfRows;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LocationRequest {
        private Double mapX;  // 경도
        private Double mapY;  // 위도
        private Integer radius; // 반경 (m)
        private Integer contentTypeId;
        private Integer pageNo;
        private Integer numOfRows;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PageResponse<T> {
        private List<T> items;
        private int totalCount;
        private int pageNo;
        private int numOfRows;
    }

    // API 응답 매핑용 내부 클래스들
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ApiResponse {
        private Response response;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        private Header header;
        private Body body;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Header {
        private String resultCode;
        private String resultMsg;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Body {
        private Items items;
        private int numOfRows;
        private int pageNo;
        private int totalCount;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Items {
        private List<Item> item;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        private String contentid;
        private String contenttypeid;
        private String title;
        private String addr1;
        private String addr2;
        private String areacode;
        private String sigungucode;
        private String cat1;
        private String cat2;
        private String cat3;
        private String firstimage;
        private String firstimage2;
        private String mapx;
        private String mapy;
        private String tel;
        private String overview;
        private String dist;
        private String homepage;

        // 상세 정보
        private String usetime;
        private String restdate;
        private String parking;
        private String chkcreditcard;
        private String infocenter;
        private String firstmenu;
        private String treatmenu;
        private String opentimefood;
        private String checkintime;
        private String checkouttime;
        private String roomcount;
        private String reservationurl;

        // 지역코드용
        private String code;
        private String name;
    }
}
