"""
LangGraph 기반 여행 플래너 에이전트
Tour API Tools를 활용하여 동적으로 정보를 수집하고 일정을 생성
"""
import json
import time
from typing import TypedDict, Annotated, Sequence, Dict, Any, Optional, List
from datetime import datetime
import operator

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode

from app.config import settings
from app.tools.tour_tools import ALL_TOOLS

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# 상태 정의
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    destination: str
    days: int
    theme: str
    budget: Optional[int]
    final_schedule: Optional[Dict]


class TravelGraphAgent:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is required for TravelGraphAgent")

        # 도구를 바인딩한 LLM
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=settings.OPENAI_API_KEY
        ).bind_tools(ALL_TOOLS)

        # 스케줄 생성용 LLM (도구 없음)
        self.scheduler_llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=settings.OPENAI_API_KEY
        )

        self.tools = ALL_TOOLS
        self.tool_node = ToolNode(self.tools)
        self.graph = self._build_graph()
        logger.info("[TravelGraphAgent] Initialized with ToolNode")

    def _build_graph(self) -> StateGraph:
        """LangGraph 워크플로우 구성"""
        workflow = StateGraph(AgentState)

        # 노드 추가
        workflow.add_node("planner", self._planner_node)
        workflow.add_node("tools", self.tool_node)
        workflow.add_node("scheduler", self._scheduler_node)

        # 엣지 설정
        workflow.set_entry_point("planner")

        # 조건부 엣지: 도구 호출이 필요한지 판단
        workflow.add_conditional_edges(
            "planner",
            self._should_use_tools,
            {
                "tools": "tools",
                "schedule": "scheduler",
            }
        )

        # 도구 실행 후 다시 planner로
        workflow.add_edge("tools", "planner")

        # 스케줄러에서 종료
        workflow.add_edge("scheduler", END)

        return workflow.compile()

    def _should_use_tools(self, state: AgentState) -> str:
        """도구 사용 여부 판단"""
        last_message = state["messages"][-1]

        # LLM이 도구를 호출하려고 하면 도구 실행
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            logger.info(f"[Router] Tool calls: {[tc['name'] for tc in last_message.tool_calls]}")
            return "tools"

        # 도구 호출이 없으면 스케줄 생성으로 이동
        tool_count = len([msg for msg in state["messages"] if isinstance(msg, ToolMessage)])
        logger.info(f"[Router] No more tools, {tool_count} tool results collected -> scheduler")
        return "schedule"

    async def _planner_node(self, state: AgentState) -> Dict:
        """여행 계획을 위한 정보 수집"""
        start_time = time.time()
        destination = state["destination"]
        days = state["days"]
        theme = state["theme"]
        budget = state.get("budget")

        # 첫 메시지인 경우 시스템 프롬프트 생성
        if len(state["messages"]) == 0:
            system_prompt = f"""당신은 한국 여행 전문 플래너입니다.
{destination}에서 {days}일간 {theme} 테마 여행을 계획해야 합니다.
{'예산은 ' + format(budget, ',') + '원입니다.' if budget else ''}

**반드시 도구를 사용하여 실제 장소 정보를 검색하세요.**

순서:
1. get_area_code를 호출하여 "{destination}"의 지역 코드를 조회하세요.
2. get_popular_places를 호출하여 해당 지역의 인기 관광지(attraction)를 검색하세요.
3. get_popular_places를 호출하여 해당 지역의 인기 맛집(restaurant)을 검색하세요.

필요한 장소:
- 관광지: {days * 2}개 이상
- 맛집: {days * 2}개 이상

지금 바로 get_area_code 도구를 호출하세요."""

            messages = [HumanMessage(content=system_prompt)]
            logger.info(f"[Planner] Starting for {destination}")
        else:
            messages = list(state["messages"])

        response = await self.llm.ainvoke(messages)

        if hasattr(response, "tool_calls") and response.tool_calls:
            logger.info(f"[Planner] LLM requested: {[tc['name'] for tc in response.tool_calls]} ({time.time() - start_time:.2f}s)")
        else:
            logger.info(f"[Planner] LLM finished tool calls ({time.time() - start_time:.2f}s)")

        return {"messages": [response]}

    async def _scheduler_node(self, state: AgentState) -> Dict:
        """수집된 정보를 바탕으로 최종 일정 생성"""
        start_time = time.time()
        destination = state["destination"]
        days = state["days"]
        theme = state["theme"]

        # ToolMessage에서 검색 결과 추출
        tool_results = []
        for msg in state["messages"]:
            if isinstance(msg, ToolMessage):
                tool_results.append(msg.content)

        search_results = "\n\n".join(tool_results) if tool_results else "검색 결과 없음"
        logger.info(f"[Scheduler] Processing {len(tool_results)} tool results")

        theme_descriptions = {
            "HEALING": "힐링과 휴식",
            "ADVENTURE": "모험과 액티비티",
            "FOOD": "맛집 탐방",
            "CULTURE": "문화와 역사",
            "SHOPPING": "쇼핑",
            "NATURE": "자연 탐방"
        }

        schedule_prompt = f"""당신은 전문 여행 플래너입니다.
{destination}에서 {days}일간 {theme_descriptions.get(theme, theme)} 테마 여행 일정을 만들어주세요.

**중요: 아래 검색 결과에 있는 실제 장소명을 그대로 사용하세요. 임의로 장소명을 만들지 마세요.**

검색 결과:
{search_results[-8000:]}

다음 JSON 형식으로 응답하세요:
{{
    "schedules": [
        {{
            "dayNumber": 1,
            "time": "09:00",
            "placeName": "검색 결과의 정확한 장소명",
            "placeType": "ATTRACTION",
            "description": "방문 이유 및 추천 포인트",
            "lat": 검색결과의위도숫자,
            "lng": 검색결과의경도숫자
        }},
        {{
            "dayNumber": 1,
            "time": "12:00",
            "placeName": "검색 결과의 정확한 맛집명",
            "placeType": "RESTAURANT",
            "description": "추천 메뉴 및 특징",
            "lat": 검색결과의위도숫자,
            "lng": 검색결과의경도숫자
        }}
    ],
    "summary": "여행 요약 (2-3문장)",
    "tips": ["여행 팁 1", "여행 팁 2"]
}}

{days}일 일정으로 각 일자별:
- 09:00: 오전 관광지
- 12:00: 점심 맛집
- 14:00: 오후 관광지
- 18:00: 저녁 맛집

**반드시 검색 결과의 장소명과 좌표를 정확히 사용하세요.**"""

        response = await self.scheduler_llm.ainvoke([HumanMessage(content=schedule_prompt)])

        # JSON 파싱
        content = response.content
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            schedule = json.loads(content.strip())
            logger.info(f"[Scheduler] Generated {len(schedule.get('schedules', []))} items ({time.time() - start_time:.2f}s)")
        except Exception as e:
            logger.error(f"[Scheduler] JSON parsing error: {e}")
            schedule = {
                "schedules": [],
                "summary": content,
                "tips": []
            }

        return {
            "messages": [response],
            "final_schedule": schedule
        }

    async def generate_schedule(
        self,
        destination: str,
        start_date: str,
        end_date: str,
        budget: Optional[int],
        theme: str
    ) -> Dict[str, Any]:
        """여행 일정 생성"""
        total_start = time.time()

        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        days = (end - start).days + 1

        logger.info(f"[TravelGraphAgent] ===== START: {destination}, {days} days =====")

        initial_state = {
            "messages": [],
            "destination": destination,
            "days": days,
            "theme": theme,
            "budget": budget,
            "final_schedule": None
        }

        try:
            final_state = await self.graph.ainvoke(initial_state)

            logger.info(f"[TravelGraphAgent] ===== DONE in {time.time() - total_start:.2f}s =====")

            if final_state.get("final_schedule"):
                return final_state["final_schedule"]

            return {
                "schedules": [],
                "summary": f"{destination} {days}일 {theme} 여행",
                "tips": []
            }

        except Exception as e:
            logger.error(f"[TravelGraphAgent] Error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "schedules": [],
                "summary": f"오류 발생: {str(e)}",
                "tips": []
            }


# 싱글톤 팩토리
_agent_instance = None

def get_travel_graph_agent() -> Optional[TravelGraphAgent]:
    global _agent_instance
    if _agent_instance is None and settings.OPENAI_API_KEY:
        try:
            _agent_instance = TravelGraphAgent()
        except Exception as e:
            logger.error(f"Failed to create TravelGraphAgent: {e}")
            return None
    return _agent_instance
