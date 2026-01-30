package com.tripmate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

public class AIChatDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Request {
        private String sessionId;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private String sessionId;
        private String response;
        private CollectedInfo collectedInfo;
        private String phase;
        private Map<String, Object> schedule;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CollectedInfo {
        private String destination;
        private String startDate;
        private String endDate;
        private String theme;
        private Integer budget;
        private List<String> preferences;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClearRequest {
        private String sessionId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClearResponse {
        private String message;
        private String sessionId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusResponse {
        private String sessionId;
        private boolean exists;
        private int messageCount;
        private String phase;
        private CollectedInfo collectedInfo;
    }
}
