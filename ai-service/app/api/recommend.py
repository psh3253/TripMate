from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date
import logging
import time

from app.agents.travel_agent import TravelAgent
from app.agents.multi_agent_planner import MultiAgentTravelPlanner
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

class ScheduleRequest(BaseModel):
    destination: str
    startDate: str
    endDate: str
    budget: Optional[int] = None
    theme: str

class Schedule(BaseModel):
    dayNumber: int
    time: str
    placeName: str
    placeType: str
    description: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class ScheduleResponse(BaseModel):
    schedules: List[Schedule]
    summary: str

class PlaceRequest(BaseModel):
    destination: str
    placeType: str
    theme: Optional[str] = None

class Place(BaseModel):
    name: str
    type: str
    description: str
    rating: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class PlaceResponse(BaseModel):
    places: List[Place]

@router.post("/recommend-schedule", response_model=ScheduleResponse)
async def recommend_schedule(request: ScheduleRequest):
    start_time = time.time()
    logger.info(f"[API] /recommend-schedule called: {request.destination}, {request.theme}")

    try:
        agent = TravelAgent()
        logger.info(f"[API] TravelAgent created, calling generate_schedule...")
        result = await agent.generate_schedule(
            destination=request.destination,
            start_date=request.startDate,
            end_date=request.endDate,
            budget=request.budget,
            theme=request.theme
        )
        logger.info(f"[API] Done in {time.time() - start_time:.2f}s, schedules: {len(result.get('schedules', []))}")
        return result
    except Exception as e:
        logger.error(f"[API] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommend-places", response_model=PlaceResponse)
async def recommend_places(request: PlaceRequest):
    try:
        agent = TravelAgent()
        result = await agent.recommend_places(
            destination=request.destination,
            place_type=request.placeType,
            theme=request.theme
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== 다중 에이전트 플래너 API ==============

class MultiAgentPlanRequest(BaseModel):
    destination: str
    startDate: str
    endDate: str
    budget: int
    travelers: int = 2
    preferences: List[str] = ["healing"]
    specialRequests: Optional[str] = None


class AgentResultResponse(BaseModel):
    agent: str
    status: str
    recommendations: List[Dict[str, Any]]
    notes: str


class BudgetBreakdown(BaseModel):
    transport: Optional[int] = 0
    accommodation: Optional[int] = 0
    food: Optional[int] = 0
    activities: Optional[int] = 0
    miscellaneous: Optional[int] = 0
    total: Optional[int] = 0


class ScheduleItem(BaseModel):
    time: str
    type: str
    name: str
    description: Optional[str] = None
    duration: Optional[str] = None
    cost: Optional[int] = 0
    tips: Optional[str] = None


class DaySchedule(BaseModel):
    day: int
    date: Optional[str] = None
    theme: Optional[str] = None
    items: List[ScheduleItem]


class MultiAgentPlanResponse(BaseModel):
    success: bool
    destination: str
    schedule: List[DaySchedule]
    budgetPlan: Dict[str, Any]
    agentResults: Dict[str, Any]
    messages: List[str]
    errors: List[str]


@router.post("/multi-agent-plan")
async def create_multi_agent_plan(request: MultiAgentPlanRequest):
    """
    다중 에이전트 협업 여행 플래너

    5개의 전문 에이전트가 협업하여 최적의 여행 계획을 생성합니다:
    - Transport Agent: 교통편 전문가
    - Accommodation Agent: 숙소 전문가
    - Restaurant Agent: 맛집 전문가
    - Activity Agent: 관광/액티비티 전문가
    - Budget Optimizer: 예산 최적화 전문가
    """
    start_time = time.time()
    logger.info(f"[MultiAgent] Planning started: {request.destination}")
    logger.info(f"[MultiAgent] Period: {request.startDate} ~ {request.endDate}")
    logger.info(f"[MultiAgent] Budget: {request.budget:,}원, Travelers: {request.travelers}")
    logger.info(f"[MultiAgent] Preferences: {request.preferences}")

    try:
        planner = MultiAgentTravelPlanner(openai_api_key=settings.OPENAI_API_KEY)

        result = planner.plan(
            destination=request.destination,
            start_date=request.startDate,
            end_date=request.endDate,
            budget=request.budget,
            travelers=request.travelers,
            preferences=request.preferences,
            special_requests=request.specialRequests
        )

        elapsed = time.time() - start_time
        logger.info(f"[MultiAgent] Completed in {elapsed:.2f}s")
        logger.info(f"[MultiAgent] Success: {result.get('success')}")
        logger.info(f"[MultiAgent] Schedule days: {len(result.get('schedule', []))}")

        # 응답에 처리 시간 추가
        result["processingTime"] = f"{elapsed:.2f}s"

        logger.info(f"[MultiAgent] agentResults keys: {result.get('agentResults', {}).keys()}")

        # Spring Boot에서 ApiResponse로 감싸주므로 result를 직접 반환
        return result

    except Exception as e:
        logger.error(f"[MultiAgent] Error: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/multi-agent-plan/status")
async def get_multi_agent_status():
    """다중 에이전트 플래너 상태 확인"""
    return {
        "status": "ready",
        "agents": [
            {"name": "Coordinator", "description": "전체 계획 조율"},
            {"name": "Transport Agent", "description": "교통편 전문가"},
            {"name": "Accommodation Agent", "description": "숙소 전문가"},
            {"name": "Restaurant Agent", "description": "맛집 전문가"},
            {"name": "Activity Agent", "description": "관광/액티비티 전문가"},
            {"name": "Budget Optimizer", "description": "예산 최적화 전문가"},
            {"name": "Schedule Generator", "description": "최종 일정 생성"}
        ]
    }
