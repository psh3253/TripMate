"""
다중 에이전트 여행 플래너 (Multi-Agent Travel Planner)

LangGraph를 활용한 전문 에이전트 협업 시스템:
- Coordinator: 전체 계획 조율
- Transport Agent: 교통편 전문가
- Accommodation Agent: 숙소 전문가
- Restaurant Agent: 맛집 전문가
- Activity Agent: 관광/액티비티 전문가
- Budget Optimizer: 예산 최적화 전문가
- Schedule Generator: 최종 일정 생성
"""

import operator
import json
import logging
from typing import TypedDict, Annotated, Optional, List, Dict, Any
from datetime import datetime, timedelta

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.utils import (
    AREA_CODES, CONTENT_TYPES, THEME_DESCRIPTIONS,
    parse_json_safely, extract_json_from_response,
    fetch_places_sync, get_area_code_sync, format_places_for_prompt,
    extract_places_with_coords,
)

logger = logging.getLogger(__name__)


# ============== 상태 정의 ==============

class AgentResult(TypedDict):
    """각 에이전트의 결과"""
    agent: str
    status: str  # "success", "failed", "pending"
    data: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    notes: str


class TravelRequirements(TypedDict):
    """여행 요구사항"""
    destination: str
    area_code: Optional[str]
    start_date: str
    end_date: str
    budget: int
    travelers: int
    preferences: List[str]
    special_requests: Optional[str]


class MultiAgentState(TypedDict):
    """다중 에이전트 시스템 상태"""
    requirements: TravelRequirements
    transport_result: Optional[AgentResult]
    accommodation_result: Optional[AgentResult]
    restaurant_result: Optional[AgentResult]
    activity_result: Optional[AgentResult]
    places_with_coords: Optional[Dict[str, List[Dict[str, Any]]]]  # 좌표 포함 장소 데이터
    optimized_plan: Optional[Dict[str, Any]]
    final_schedule: Optional[List[Dict[str, Any]]]
    current_phase: str
    errors: Annotated[List[str], operator.add]
    messages: Annotated[List[str], operator.add]


# ============== 에이전트 노드 클래스 ==============

class AgentNodes:
    """에이전트 노드들을 관리하는 클래스"""

    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    def coordinator(self, state: MultiAgentState) -> Dict:
        """Coordinator: 요구사항 분석 및 작업 분배"""
        requirements = state["requirements"]

        # 지역 코드 조회
        area_code = get_area_code_sync(requirements["destination"])
        if area_code:
            requirements["area_code"] = area_code
            logger.info(f"Area code: {area_code} for {requirements['destination']}")

        return {
            "requirements": requirements,
            "current_phase": "specialist_analysis",
            "messages": [
                f"🎯 여행 계획 시작: {requirements['destination']}",
                f"📅 기간: {requirements['start_date']} ~ {requirements['end_date']}",
                f"💰 예산: {requirements['budget']:,}원",
            ]
        }

    def transport_agent(self, state: MultiAgentState) -> Dict:
        """Transport Agent: 교통편 분석"""
        req = state["requirements"]

        prompt = ChatPromptTemplate.from_messages([
            ("system", """한국 여행 교통 전문가입니다.
반드시 다음 JSON 형식으로만 응답:
{{"recommendations": [{{"type": "KTX/비행기/버스/자가용", "from_location": "출발지", "to_location": "도착지", "estimated_cost": 비용숫자, "duration": "소요시간", "recommendation_reason": "추천이유"}}], "total_transport_cost": 총비용숫자, "notes": "참고사항"}}"""),
            ("human", "목적지: {destination}, 기간: {start_date}~{end_date}, 인원: {travelers}명, 예산: {budget}원")
        ])

        try:
            response = self.llm.invoke(prompt.format_messages(
                destination=req["destination"],
                start_date=req["start_date"],
                end_date=req["end_date"],
                travelers=req["travelers"],
                budget=req["budget"]
            ))

            data = parse_json_safely(response.content) or {}

            return {
                "transport_result": {
                    "agent": "transport",
                    "status": "success",
                    "data": data,
                    "recommendations": data.get("recommendations", []),
                    "notes": data.get("notes", "")
                },
                "messages": ["✈️ 교통 전문가: 분석 완료"]
            }

        except Exception as e:
            logger.error(f"Transport agent error: {e}")
            return {
                "transport_result": {
                    "agent": "transport",
                    "status": "failed",
                    "data": {},
                    "recommendations": [],
                    "notes": str(e)
                },
                "messages": ["⚠️ 교통 전문가: 기본 추천 사용"]
            }

    def accommodation_agent(self, state: MultiAgentState) -> Dict:
        """Accommodation Agent: 숙소 추천"""
        req = state["requirements"]
        area_code = req.get("area_code")

        # Tour API로 실제 숙소 검색
        real_accommodations = []
        if area_code:
            real_accommodations = fetch_places_sync(area_code, "accommodation", 10)

        # 좌표 포함 데이터 저장
        acc_with_coords = extract_places_with_coords(real_accommodations, 10)

        places_text = format_places_for_prompt(real_accommodations, 10)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """한국 숙소 전문가입니다. 실제 검색된 숙소를 바탕으로 추천합니다.
반드시 다음 JSON 형식으로만 응답:
{{"recommendations": [{{"name": "실제숙소명", "type": "호텔/펜션/리조트", "price_per_night": 가격숫자, "location": "위치", "features": ["특징"], "why_recommended": "추천이유"}}], "total_accommodation_cost": 총비용숫자, "notes": "참고사항"}}
중요: 반드시 아래 실제 검색 결과에서 선택하세요."""),
            ("human", """목적지: {destination}, 기간: {start_date}~{end_date}
인원: {travelers}명, 예산: {budget}원

실제 검색된 숙소:
{real_data}""")
        ])

        try:
            response = self.llm.invoke(prompt.format_messages(
                destination=req["destination"],
                start_date=req["start_date"],
                end_date=req["end_date"],
                travelers=req["travelers"],
                budget=req["budget"],
                real_data=places_text
            ))

            data = parse_json_safely(response.content) or {}

            # 기존 places_with_coords와 병합
            current_coords = state.get("places_with_coords") or {}
            current_coords["accommodation"] = acc_with_coords

            return {
                "accommodation_result": {
                    "agent": "accommodation",
                    "status": "success",
                    "data": data,
                    "recommendations": data.get("recommendations", []),
                    "notes": data.get("notes", "")
                },
                "places_with_coords": current_coords,
                "messages": ["🏨 숙소 전문가: 분석 완료"]
            }

        except Exception as e:
            logger.error(f"Accommodation agent error: {e}")
            return {
                "accommodation_result": {
                    "agent": "accommodation",
                    "status": "failed",
                    "data": {},
                    "recommendations": [],
                    "notes": str(e)
                },
                "messages": ["⚠️ 숙소 전문가: 분석 실패"]
            }

    def restaurant_agent(self, state: MultiAgentState) -> Dict:
        """Restaurant Agent: 맛집 추천"""
        req = state["requirements"]
        area_code = req.get("area_code")

        # Tour API로 실제 맛집 검색 (중복 방지를 위해 충분히 가져옴)
        real_restaurants = []
        if area_code:
            real_restaurants = fetch_places_sync(area_code, "restaurant", 20)

        # 좌표 포함 데이터 저장
        rest_with_coords = extract_places_with_coords(real_restaurants, 15)

        places_text = format_places_for_prompt(real_restaurants, 15)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """한국 맛집 전문가입니다. 실제 검색된 맛집을 바탕으로 추천합니다.
반드시 다음 JSON 형식으로만 응답:
{{"recommendations": [{{"name": "실제식당명", "cuisine": "음식종류", "price_range": "가격대", "specialty": "대표메뉴", "location": "위치", "best_for": "아침/점심/저녁"}}], "daily_food_budget": 일일식비숫자, "notes": "참고사항"}}
중요: 실제 검색 결과에서 최소 8개 이상 추천하세요."""),
            ("human", """목적지: {destination}, 기간: {start_date}~{end_date}
인원: {travelers}명, 예산: {budget}원

실제 검색된 맛집:
{real_data}

최소 8개 이상 추천해주세요.""")
        ])

        try:
            response = self.llm.invoke(prompt.format_messages(
                destination=req["destination"],
                start_date=req["start_date"],
                end_date=req["end_date"],
                travelers=req["travelers"],
                budget=req["budget"],
                real_data=places_text
            ))

            data = parse_json_safely(response.content) or {}

            # 기존 places_with_coords와 병합
            current_coords = state.get("places_with_coords") or {}
            current_coords["restaurant"] = rest_with_coords

            return {
                "restaurant_result": {
                    "agent": "restaurant",
                    "status": "success",
                    "data": data,
                    "recommendations": data.get("recommendations", []),
                    "notes": data.get("notes", "")
                },
                "places_with_coords": current_coords,
                "messages": ["🍽️ 맛집 전문가: 분석 완료"]
            }

        except Exception as e:
            logger.error(f"Restaurant agent error: {e}")
            return {
                "restaurant_result": {
                    "agent": "restaurant",
                    "status": "failed",
                    "data": {},
                    "recommendations": [],
                    "notes": str(e)
                },
                "messages": ["⚠️ 맛집 전문가: 분석 실패"]
            }

    def activity_agent(self, state: MultiAgentState) -> Dict:
        """Activity Agent: 관광지/액티비티 추천"""
        req = state["requirements"]
        area_code = req.get("area_code")

        # Tour API로 실제 관광지 검색
        real_attractions = []
        if area_code:
            real_attractions = fetch_places_sync(area_code, "attraction", 20)

        # 좌표 포함 데이터 저장
        act_with_coords = extract_places_with_coords(real_attractions, 15)

        places_text = format_places_for_prompt(real_attractions, 15)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """한국 관광/액티비티 전문가입니다. 실제 검색된 관광지를 바탕으로 추천합니다.
반드시 다음 JSON 형식으로만 응답:
{{"recommendations": [{{"name": "실제관광지명", "type": "관광지/체험/자연", "duration": "소요시간", "cost": 비용숫자, "description": "설명", "best_time": "추천시간대"}}], "total_activity_cost": 총비용숫자, "notes": "참고사항"}}
중요: 실제 검색 결과에서 최소 8개 이상 추천하세요."""),
            ("human", """목적지: {destination}, 기간: {start_date}~{end_date}
인원: {travelers}명, 예산: {budget}원

실제 검색된 관광지:
{real_data}

최소 8개 이상 추천해주세요.""")
        ])

        try:
            response = self.llm.invoke(prompt.format_messages(
                destination=req["destination"],
                start_date=req["start_date"],
                end_date=req["end_date"],
                travelers=req["travelers"],
                budget=req["budget"],
                real_data=places_text
            ))

            data = parse_json_safely(response.content) or {}

            # 기존 places_with_coords와 병합
            current_coords = state.get("places_with_coords") or {}
            current_coords["activity"] = act_with_coords

            return {
                "activity_result": {
                    "agent": "activity",
                    "status": "success",
                    "data": data,
                    "recommendations": data.get("recommendations", []),
                    "notes": data.get("notes", "")
                },
                "places_with_coords": current_coords,
                "messages": ["🎯 액티비티 전문가: 분석 완료"]
            }

        except Exception as e:
            logger.error(f"Activity agent error: {e}")
            return {
                "activity_result": {
                    "agent": "activity",
                    "status": "failed",
                    "data": {},
                    "recommendations": [],
                    "notes": str(e)
                },
                "messages": ["⚠️ 액티비티 전문가: 분석 실패"]
            }

    def budget_optimizer(self, state: MultiAgentState) -> Dict:
        """Budget Optimizer: 예산 최적화"""
        req = state["requirements"]

        transport = state.get("transport_result") or {}
        accommodation = state.get("accommodation_result") or {}
        restaurant = state.get("restaurant_result") or {}
        activity = state.get("activity_result") or {}

        prompt = ChatPromptTemplate.from_messages([
            ("system", """여행 예산 최적화 전문가입니다.
반드시 다음 JSON 형식으로만 응답:
{{"budget_breakdown": {{"transport": 교통비, "accommodation": 숙박비, "food": 식비, "activities": 액티비티비, "miscellaneous": 기타, "total": 총액}}, "within_budget": true/false, "savings_tips": ["절약팁1", "절약팁2"], "optimized_selections": {{"transport": "선택교통편", "accommodation": "선택숙소", "must_visit": ["필수관광지"], "must_eat": ["필수맛집"]}}, "notes": "예산조언"}}"""),
            ("human", """여행: {destination}, {start_date}~{end_date}
인원: {travelers}명, 총 예산: {budget}원

교통: {transport}
숙소: {accommodation}
맛집: {restaurant}
관광: {activity}""")
        ])

        try:
            response = self.llm.invoke(prompt.format_messages(
                destination=req["destination"],
                start_date=req["start_date"],
                end_date=req["end_date"],
                travelers=req["travelers"],
                budget=req["budget"],
                transport=json.dumps(transport.get("recommendations", [])[:3], ensure_ascii=False),
                accommodation=json.dumps(accommodation.get("recommendations", [])[:3], ensure_ascii=False),
                restaurant=json.dumps(restaurant.get("recommendations", [])[:5], ensure_ascii=False),
                activity=json.dumps(activity.get("recommendations", [])[:5], ensure_ascii=False)
            ))

            data = parse_json_safely(response.content) or {}

            return {
                "optimized_plan": data,
                "messages": ["💰 예산 최적화 완료"]
            }

        except Exception as e:
            logger.error(f"Budget optimizer error: {e}")
            return {
                "optimized_plan": {},
                "messages": ["⚠️ 예산 최적화: 기본값 사용"]
            }


# ============== 스케줄 생성기 ==============

class ScheduleGenerator:
    """최종 일정 생성 담당"""

    def __init__(self, llm: ChatOpenAI):
        self.llm = llm

    def generate(self, state: MultiAgentState) -> Dict:
        """Schedule Generator: 최종 일정 생성"""
        req = state["requirements"]

        accommodation = state.get("accommodation_result") or {}
        restaurant = state.get("restaurant_result") or {}
        activity = state.get("activity_result") or {}
        places_with_coords = state.get("places_with_coords") or {}

        # 일수 계산
        try:
            start = datetime.strptime(req["start_date"], "%Y-%m-%d")
            end = datetime.strptime(req["end_date"], "%Y-%m-%d")
            num_days = (end - start).days + 1
        except:
            num_days = 3
            start = datetime.now()

        # 추천 장소 이름 추출 (중복 방지를 위해 충분히)
        acc_names = [r.get("name", "") for r in accommodation.get("recommendations", [])][:3]
        rest_names = [r.get("name", "") for r in restaurant.get("recommendations", [])][:8]
        act_names = [r.get("name", "") for r in activity.get("recommendations", [])][:8]

        prompt = ChatPromptTemplate.from_messages([
            ("system", """여행 일정 전문가입니다. 반드시 유효한 JSON만 출력하세요.
형식:
{{"schedule":[{{"day":1,"theme":"테마","items":[{{"time":"09:00","type":"ATTRACTION","name":"장소명","description":"설명"}}]}}]}}

규칙:
- 문자열은 반드시 큰따옴표 사용
- 마지막 항목 뒤에 쉼표 금지
- 중요: 같은 맛집이나 관광지가 전체 일정에서 2번 이상 반복 금지!"""),
            ("human", """목적지: {destination}, 기간: {num_days}일

사용할 장소:
- 숙소: {acc_names}
- 맛집: {rest_names}
- 관광지: {act_names}

{num_days}일 일정을 JSON으로 만들어주세요.
각 일자에 아침(09:00), 점심(12:00), 오후(14:00), 저녁(18:00) 일정.
각 장소는 전체 일정에서 한 번만 사용!""")
        ])

        # 재시도 로직
        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                response = self.llm.invoke(prompt.format_messages(
                    destination=req["destination"],
                    num_days=num_days,
                    acc_names=", ".join(acc_names) if acc_names else "추천 숙소",
                    rest_names=", ".join(rest_names) if rest_names else "추천 맛집",
                    act_names=", ".join(act_names) if act_names else "추천 관광지"
                ))

                data = parse_json_safely(response.content)

                if data and data.get("schedule"):
                    # 좌표 추가
                    schedule_with_coords = self._add_coordinates_to_schedule(
                        data.get("schedule", []),
                        places_with_coords
                    )
                    return {
                        "final_schedule": schedule_with_coords,
                        "current_phase": "complete",
                        "messages": [
                            "📋 최종 일정 생성 완료",
                            f"✅ {req['destination']} {num_days}일 여행 계획 완성!"
                        ]
                    }

                logger.warning(f"Schedule generation attempt {attempt + 1} failed")

            except Exception as e:
                logger.error(f"Schedule generator attempt {attempt + 1} error: {e}")

        # 폴백: 기본 일정 생성
        logger.warning("Using fallback schedule")
        fallback = self._generate_fallback(req, num_days, start, acc_names, rest_names, act_names)

        return {
            "final_schedule": fallback,
            "current_phase": "complete",
            "messages": [
                "📋 기본 일정 생성 완료",
                f"✅ {req['destination']} {num_days}일 여행 계획 완성!"
            ]
        }

    def _generate_fallback(
        self,
        req: Dict,
        num_days: int,
        start_date: datetime,
        acc_names: List[str],
        rest_names: List[str],
        act_names: List[str]
    ) -> List[Dict]:
        """폴백 일정 생성 (중복 방지)"""
        schedule = []

        # 사용할 장소 큐 (중복 방지)
        rest_queue = list(rest_names) if rest_names else []
        act_queue = list(act_names) if act_names else []

        def get_next(queue: List[str], default: str) -> str:
            return queue.pop(0) if queue else default

        for day in range(1, num_days + 1):
            current_date = start_date + timedelta(days=day - 1)
            items = []

            # 오전 관광
            items.append({
                "time": "09:00",
                "type": "ATTRACTION",
                "name": get_next(act_queue, f"{req['destination']} 관광지"),
                "description": "오전 관광"
            })

            # 점심
            items.append({
                "time": "12:00",
                "type": "RESTAURANT",
                "name": get_next(rest_queue, f"{req['destination']} 맛집"),
                "description": "점심 식사"
            })

            # 오후 관광
            items.append({
                "time": "14:00",
                "type": "ATTRACTION",
                "name": get_next(act_queue, f"{req['destination']} 명소"),
                "description": "오후 관광"
            })

            # 저녁
            items.append({
                "time": "18:00",
                "type": "RESTAURANT",
                "name": get_next(rest_queue, f"{req['destination']} 식당"),
                "description": "저녁 식사"
            })

            schedule.append({
                "day": day,
                "date": current_date.strftime("%Y-%m-%d"),
                "theme": f"Day {day}",
                "items": items
            })

        return schedule

    def _add_coordinates_to_schedule(
        self,
        schedule: List[Dict],
        places_with_coords: Dict[str, List[Dict]]
    ) -> List[Dict]:
        """일정의 각 장소에 좌표 추가"""

        def find_coords(place_name: str, place_type: str) -> Dict:
            """장소명으로 좌표 찾기"""
            # 타입별 카테고리 매핑
            type_to_category = {
                "RESTAURANT": "restaurant",
                "ACCOMMODATION": "accommodation",
                "ATTRACTION": "activity",
                "ACTIVITY": "activity",
                "TRANSPORT": None,
            }

            category = type_to_category.get(place_type)
            if not category:
                return {"lat": None, "lng": None}

            # 해당 카테고리에서 찾기
            places = places_with_coords.get(category, [])
            for place in places:
                # 부분 일치 검색 (장소명이 포함되어 있으면 매칭)
                if place_name in place.get("name", "") or place.get("name", "") in place_name:
                    return {"lat": place.get("lat"), "lng": place.get("lng")}

            # 모든 카테고리에서 찾기
            for cat_places in places_with_coords.values():
                for place in cat_places:
                    if place_name in place.get("name", "") or place.get("name", "") in place_name:
                        return {"lat": place.get("lat"), "lng": place.get("lng")}

            return {"lat": None, "lng": None}

        # 각 일정 항목에 좌표 추가
        for day_schedule in schedule:
            items = day_schedule.get("items", [])
            for item in items:
                coords = find_coords(item.get("name", ""), item.get("type", ""))
                item["lat"] = coords.get("lat")
                item["lng"] = coords.get("lng")

        return schedule


# ============== 메인 플래너 클래스 ==============

class MultiAgentTravelPlanner:
    """다중 에이전트 여행 플래너"""

    def __init__(self, openai_api_key: str):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=openai_api_key
        )
        self.memory = MemorySaver()
        self.agents = AgentNodes(self.llm)
        self.scheduler = ScheduleGenerator(self.llm)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """LangGraph 그래프 구성"""
        graph = StateGraph(MultiAgentState)

        # 노드 추가
        graph.add_node("coordinator", self.agents.coordinator)
        graph.add_node("transport_agent", self.agents.transport_agent)
        graph.add_node("accommodation_agent", self.agents.accommodation_agent)
        graph.add_node("restaurant_agent", self.agents.restaurant_agent)
        graph.add_node("activity_agent", self.agents.activity_agent)
        graph.add_node("budget_optimizer", self.agents.budget_optimizer)
        graph.add_node("schedule_generator", self.scheduler.generate)

        # 엣지 설정
        graph.set_entry_point("coordinator")

        graph.add_conditional_edges(
            "coordinator",
            self._route_to_specialists,
            {"specialists": "transport_agent", "error": END}
        )

        graph.add_edge("transport_agent", "accommodation_agent")
        graph.add_edge("accommodation_agent", "restaurant_agent")
        graph.add_edge("restaurant_agent", "activity_agent")
        graph.add_edge("activity_agent", "budget_optimizer")
        graph.add_edge("budget_optimizer", "schedule_generator")
        graph.add_edge("schedule_generator", END)

        return graph.compile(checkpointer=self.memory)

    def _route_to_specialists(self, state: MultiAgentState) -> str:
        if state.get("errors") and len(state["errors"]) > 0:
            return "error"
        return "specialists"

    def plan(
        self,
        destination: str,
        start_date: str,
        end_date: str,
        budget: int,
        travelers: int = 2,
        preferences: List[str] = None,
        special_requests: str = None,
        session_id: str = "default"
    ) -> Dict[str, Any]:
        """여행 계획 생성"""

        initial_state: MultiAgentState = {
            "requirements": {
                "destination": destination,
                "area_code": None,
                "start_date": start_date,
                "end_date": end_date,
                "budget": budget,
                "travelers": travelers,
                "preferences": preferences or ["healing"],
                "special_requests": special_requests
            },
            "transport_result": None,
            "accommodation_result": None,
            "restaurant_result": None,
            "activity_result": None,
            "places_with_coords": {},
            "optimized_plan": None,
            "final_schedule": None,
            "current_phase": "initializing",
            "errors": [],
            "messages": []
        }

        config = {"configurable": {"thread_id": session_id}}

        try:
            final_state = self.graph.invoke(initial_state, config)
            logger.info(f"Final state keys: {final_state.keys() if final_state else 'None'}")

            # 디버깅: 에이전트 결과 확인
            logger.info(f"Transport result: {final_state.get('transport_result')}")
            logger.info(f"Accommodation result: {final_state.get('accommodation_result')}")
            logger.info(f"Restaurant result: {final_state.get('restaurant_result')}")
            logger.info(f"Activity result: {final_state.get('activity_result')}")
        except Exception as e:
            logger.error(f"Graph execution error: {e}")
            final_state = initial_state

        result = self._format_result(final_state or initial_state)
        logger.info(f"Formatted agentResults: {result.get('agentResults', {}).keys()}")
        return result

    def _format_result(self, state: Dict) -> Dict[str, Any]:
        """결과 포맷팅 (camelCase for frontend)"""
        def get_agent_result(result: Optional[Dict], agent_name: str) -> Dict:
            """에이전트 결과를 안전하게 가져오기"""
            if result and isinstance(result, dict) and result.get("status"):
                return result
            return {
                "agent": agent_name,
                "status": "pending",
                "data": {},
                "recommendations": [],
                "notes": ""
            }

        return {
            "success": state.get("current_phase") == "complete",
            "destination": state.get("requirements", {}).get("destination", ""),
            "schedule": state.get("final_schedule", []),
            "budgetPlan": state.get("optimized_plan", {}),
            "agentResults": {
                "transport": get_agent_result(state.get("transport_result"), "transport"),
                "accommodation": get_agent_result(state.get("accommodation_result"), "accommodation"),
                "restaurant": get_agent_result(state.get("restaurant_result"), "restaurant"),
                "activity": get_agent_result(state.get("activity_result"), "activity")
            },
            "messages": state.get("messages", []),
            "errors": state.get("errors", [])
        }
