package com.tripmate.service;

import com.tripmate.dto.AIChatDto;
import com.tripmate.dto.TripScheduleDto;
import com.tripmate.entity.Trip;
import com.tripmate.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIService {

    private final TripRepository tripRepository;
    private final WebClient webClient = WebClient.create();

    @Value("${ai-service.url}")
    private String aiServiceUrl;

    public Map<String, Object> getRecommendation(Long tripId) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found"));

        Map<String, Object> request = new HashMap<>();
        request.put("destination", trip.getDestination());
        request.put("startDate", trip.getStartDate().toString());
        request.put("endDate", trip.getEndDate().toString());
        request.put("budget", trip.getBudget());
        List<String> themeNames = trip.getThemes().stream()
                .map(Enum::name)
                .toList();
        request.put("themes", themeNames);

        try {
            log.info("Calling AI service: {} with destination={}", aiServiceUrl, trip.getDestination());
            long startTime = System.currentTimeMillis();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri(aiServiceUrl + "/ai/recommend-schedule")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("AI service responded in {}ms", System.currentTimeMillis() - startTime);
            return response;
        } catch (Exception e) {
            log.error("AI service error: {}", e.getMessage());
            return generateMockRecommendation(trip);
        }
    }

    private Map<String, Object> generateMockRecommendation(Trip trip) {
        long days = java.time.temporal.ChronoUnit.DAYS.between(trip.getStartDate(), trip.getEndDate()) + 1;

        List<TripScheduleDto.CreateRequest> schedules = new java.util.ArrayList<>();

        for (int day = 1; day <= days; day++) {
            schedules.add(TripScheduleDto.CreateRequest.builder()
                    .dayNumber(day)
                    .time("09:00")
                    .placeName(trip.getDestination() + " 명소 " + day)
                    .placeType("ATTRACTION")
                    .description("AI 추천 관광지입니다.")
                    .lat(33.4996 + (day * 0.01))
                    .lng(126.5312 + (day * 0.01))
                    .build());

            schedules.add(TripScheduleDto.CreateRequest.builder()
                    .dayNumber(day)
                    .time("12:00")
                    .placeName(trip.getDestination() + " 맛집 " + day)
                    .placeType("RESTAURANT")
                    .description("AI 추천 맛집입니다.")
                    .lat(33.4996 + (day * 0.01))
                    .lng(126.5312 + (day * 0.01))
                    .build());

            schedules.add(TripScheduleDto.CreateRequest.builder()
                    .dayNumber(day)
                    .time("14:00")
                    .placeName(trip.getDestination() + " 액티비티 " + day)
                    .placeType("ACTIVITY")
                    .description("AI 추천 액티비티입니다.")
                    .lat(33.4996 + (day * 0.01))
                    .lng(126.5312 + (day * 0.01))
                    .build());

            schedules.add(TripScheduleDto.CreateRequest.builder()
                    .dayNumber(day)
                    .time("18:00")
                    .placeName(trip.getDestination() + " 저녁 맛집 " + day)
                    .placeType("RESTAURANT")
                    .description("AI 추천 저녁 맛집입니다.")
                    .lat(33.4996 + (day * 0.01))
                    .lng(126.5312 + (day * 0.01))
                    .build());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("schedules", schedules);
        String themeText = trip.getThemes().stream()
                .map(theme -> getThemeLabel(theme.name()))
                .reduce((a, b) -> a + ", " + b)
                .orElse("");
        result.put("summary", trip.getDestination() + "에서의 " + days + "일간 " +
                   themeText + " 여행 일정을 추천해드립니다.");

        return result;
    }

    private String getThemeLabel(String theme) {
        return switch (theme) {
            case "HEALING" -> "힐링";
            case "ADVENTURE" -> "모험";
            case "FOOD" -> "맛집 탐방";
            case "CULTURE" -> "문화 탐방";
            case "SHOPPING" -> "쇼핑";
            case "NATURE" -> "자연 탐방";
            default -> theme;
        };
    }

    /**
     * AI 대화형 플래너 - 채팅
     */
    @SuppressWarnings("unchecked")
    public AIChatDto.Response chat(String sessionId, String message) {
        Map<String, Object> request = new HashMap<>();
        request.put("session_id", sessionId);
        request.put("message", message);

        try {
            log.info("AI Chat request: sessionId={}, message={}", sessionId, message.substring(0, Math.min(50, message.length())));
            long startTime = System.currentTimeMillis();

            Map<String, Object> response = webClient.post()
                    .uri(aiServiceUrl + "/ai/chat")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(120))
                    .block();

            log.info("AI Chat responded in {}ms", System.currentTimeMillis() - startTime);

            if (response == null) {
                return createErrorResponse(sessionId);
            }

            Map<String, Object> collectedInfoMap = (Map<String, Object>) response.get("collected_info");
            AIChatDto.CollectedInfo collectedInfo = AIChatDto.CollectedInfo.builder()
                    .destination((String) collectedInfoMap.get("destination"))
                    .startDate((String) collectedInfoMap.get("start_date"))
                    .endDate((String) collectedInfoMap.get("end_date"))
                    .theme((String) collectedInfoMap.get("theme"))
                    .budget(collectedInfoMap.get("budget") != null ? ((Number) collectedInfoMap.get("budget")).intValue() : null)
                    .preferences((List<String>) collectedInfoMap.get("preferences"))
                    .build();

            return AIChatDto.Response.builder()
                    .sessionId((String) response.get("session_id"))
                    .response((String) response.get("response"))
                    .collectedInfo(collectedInfo)
                    .phase((String) response.get("phase"))
                    .schedule((Map<String, Object>) response.get("schedule"))
                    .build();

        } catch (Exception e) {
            log.error("AI Chat error: {}", e.getMessage());
            return createErrorResponse(sessionId);
        }
    }

    /**
     * AI 대화형 플래너 - 세션 초기화
     */
    public AIChatDto.ClearResponse clearSession(String sessionId) {
        Map<String, Object> request = new HashMap<>();
        request.put("session_id", sessionId);

        try {
            webClient.post()
                    .uri(aiServiceUrl + "/ai/chat/clear")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("AI Chat session cleared: {}", sessionId);

            return AIChatDto.ClearResponse.builder()
                    .message("세션이 초기화되었습니다.")
                    .sessionId(sessionId)
                    .build();

        } catch (Exception e) {
            log.error("AI Chat clear error: {}", e.getMessage());
            return AIChatDto.ClearResponse.builder()
                    .message("세션 초기화에 실패했습니다.")
                    .sessionId(sessionId)
                    .build();
        }
    }

    /**
     * AI 대화형 플래너 - 세션 상태 조회
     */
    @SuppressWarnings("unchecked")
    public AIChatDto.StatusResponse getSessionStatus(String sessionId) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri(aiServiceUrl + "/ai/chat/status/" + sessionId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response == null) {
                return AIChatDto.StatusResponse.builder()
                        .sessionId(sessionId)
                        .exists(false)
                        .build();
            }

            Map<String, Object> collectedInfoMap = (Map<String, Object>) response.get("collected_info");
            AIChatDto.CollectedInfo collectedInfo = null;
            if (collectedInfoMap != null) {
                collectedInfo = AIChatDto.CollectedInfo.builder()
                        .destination((String) collectedInfoMap.get("destination"))
                        .startDate((String) collectedInfoMap.get("start_date"))
                        .endDate((String) collectedInfoMap.get("end_date"))
                        .theme((String) collectedInfoMap.get("theme"))
                        .build();
            }

            return AIChatDto.StatusResponse.builder()
                    .sessionId((String) response.get("session_id"))
                    .exists((Boolean) response.get("exists"))
                    .messageCount(((Number) response.get("message_count")).intValue())
                    .phase((String) response.get("phase"))
                    .collectedInfo(collectedInfo)
                    .build();

        } catch (Exception e) {
            log.error("AI Chat status error: {}", e.getMessage());
            return AIChatDto.StatusResponse.builder()
                    .sessionId(sessionId)
                    .exists(false)
                    .build();
        }
    }

    private AIChatDto.Response createErrorResponse(String sessionId) {
        return AIChatDto.Response.builder()
                .sessionId(sessionId)
                .response("죄송해요, 문제가 발생했어요. 다시 시도해주세요.")
                .collectedInfo(new AIChatDto.CollectedInfo())
                .phase("collecting")
                .schedule(null)
                .build();
    }

    /**
     * 다중 에이전트 여행 플래너
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> multiAgentPlan(Map<String, Object> request) {
        try {
            log.info("Multi-Agent Plan request: destination={}", request.get("destination"));
            long startTime = System.currentTimeMillis();

            Map<String, Object> response = webClient.post()
                    .uri(aiServiceUrl + "/ai/multi-agent-plan")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(180))  // 여러 에이전트가 동작하므로 타임아웃 늘림
                    .block();

            log.info("Multi-Agent Plan responded in {}ms", System.currentTimeMillis() - startTime);
            return response;

        } catch (Exception e) {
            log.error("Multi-Agent Plan error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("errors", List.of("서버 오류가 발생했습니다: " + e.getMessage()));
            return errorResponse;
        }
    }

    /**
     * 다중 에이전트 플래너 상태 조회
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getMultiAgentStatus() {
        try {
            return webClient.get()
                    .uri(aiServiceUrl + "/ai/multi-agent-plan/status")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.error("Multi-Agent Status error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return errorResponse;
        }
    }
}
