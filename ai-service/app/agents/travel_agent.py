"""
여행 플래너 에이전트
LangGraph 기반 에이전트를 우선 사용하고, 실패 시 단순 AI 생성으로 fallback
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
import json
import logging
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from langchain_openai import ChatOpenAI
    from langchain_core.prompts import ChatPromptTemplate
    HAS_OPENAI = bool(settings.OPENAI_API_KEY)
    logger.info(f"[TravelAgent] OpenAI available: {HAS_OPENAI}")
except ImportError as e:
    HAS_OPENAI = False
    logger.warning(f"[TravelAgent] OpenAI import failed: {e}")

# LangGraph 에이전트 임포트
try:
    from app.agents.travel_graph import get_travel_graph_agent
    HAS_LANGGRAPH = True
    logger.info("[TravelAgent] LangGraph import successful")
except ImportError as e:
    HAS_LANGGRAPH = False
    get_travel_graph_agent = None
    logger.warning(f"[TravelAgent] LangGraph import failed: {e}")
except Exception as e:
    HAS_LANGGRAPH = False
    get_travel_graph_agent = None
    logger.error(f"[TravelAgent] LangGraph import error: {e}")


class TravelAgent:
    def __init__(self):
        self.graph_agent = None

        # LangGraph 에이전트 초기화
        if HAS_LANGGRAPH and HAS_OPENAI:
            try:
                self.graph_agent = get_travel_graph_agent()
                logger.info(f"[TravelAgent] Graph agent initialized: {self.graph_agent is not None}")
            except Exception as e:
                logger.error(f"[TravelAgent] Graph agent init failed: {e}")
        else:
            logger.info(f"[TravelAgent] Skipping graph agent (HAS_LANGGRAPH={HAS_LANGGRAPH}, HAS_OPENAI={HAS_OPENAI})")

        if HAS_OPENAI:
            self.llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.7,
                api_key=settings.OPENAI_API_KEY
            )
        else:
            self.llm = None

    async def generate_schedule(
        self,
        destination: str,
        start_date: str,
        end_date: str,
        budget: Optional[int],
        theme: str
    ) -> Dict[str, Any]:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        days = (end - start).days + 1

        import time
        total_start = time.time()

        logger.info(f"[TravelAgent] ========== START ==========")
        logger.info(f"[TravelAgent] generate_schedule: {destination}, {days} days, theme={theme}")
        logger.info(f"[TravelAgent] graph_agent available: {self.graph_agent is not None}")

        # 1. LangGraph 에이전트 사용 (도구 기반 동적 검색)
        if self.graph_agent:
            try:
                logger.info("[TravelAgent] Calling LangGraph agent...")
                result = await self.graph_agent.generate_schedule(
                    destination, start_date, end_date, budget, theme
                )
                logger.info(f"[TravelAgent] LangGraph done in {time.time() - total_start:.2f}s, schedules: {len(result.get('schedules', []))}")
                if result.get("schedules"):
                    return result
                else:
                    logger.warning("[TravelAgent] LangGraph returned empty, falling back")
            except Exception as e:
                logger.error(f"[TravelAgent] LangGraph error: {e}")
                import traceback
                traceback.print_exc()

        # 2. Fallback: 단순 AI 생성
        if self.llm:
            logger.info("[TravelAgent] Using fallback AI generation...")
            return await self._generate_with_ai(destination, days, budget, theme)

        # 3. Mock 데이터
        logger.info("[TravelAgent] Using mock data...")
        return self._generate_mock(destination, days, budget, theme)

    async def _generate_with_ai(
        self,
        destination: str,
        days: int,
        budget: Optional[int],
        theme: str
    ) -> Dict[str, Any]:
        """AI만으로 일정 생성 (fallback)"""
        theme_descriptions = {
            "HEALING": "힐링과 휴식",
            "ADVENTURE": "모험과 액티비티",
            "FOOD": "맛집 탐방",
            "CULTURE": "문화와 역사",
            "SHOPPING": "쇼핑",
            "NATURE": "자연 탐방"
        }

        prompt = ChatPromptTemplate.from_messages([
            ("system", """당신은 전문 여행 플래너입니다.
사용자의 요청에 맞는 상세한 여행 일정을 JSON 형식으로 제공해주세요.

응답 형식:
{{
    "schedules": [
        {{
            "dayNumber": 1,
            "time": "09:00",
            "placeName": "장소명",
            "placeType": "ATTRACTION|RESTAURANT|ACTIVITY",
            "description": "설명",
            "lat": 위도,
            "lng": 경도
        }}
    ],
    "summary": "여행 요약"
}}"""),
            ("user", """
목적지: {destination}
여행 기간: {days}일
테마: {theme}
{budget_info}

위 조건에 맞는 {days}일간의 상세 여행 일정을 만들어주세요.
각 일자별로 오전(09:00), 점심(12:00), 오후(14:00), 저녁(18:00) 일정을 포함해주세요.
실제 존재하는 유명한 장소들을 추천해주세요.
""")
        ])

        budget_info = f"예산: {budget:,}원" if budget else "예산: 제한 없음"

        try:
            response = await self.llm.ainvoke(
                prompt.format_messages(
                    destination=destination,
                    days=days,
                    theme=theme_descriptions.get(theme, theme),
                    budget_info=budget_info
                )
            )

            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]

            return json.loads(content.strip())

        except Exception as e:
            print(f"AI generation error: {e}")
            return self._generate_mock(destination, days, budget, theme)

    def _generate_mock(
        self,
        destination: str,
        days: int,
        budget: Optional[int],
        theme: str
    ) -> Dict[str, Any]:
        """Mock 데이터 생성 (OpenAI 없을 때)"""
        theme_labels = {
            "HEALING": "힐링",
            "ADVENTURE": "모험",
            "FOOD": "맛집 탐방",
            "CULTURE": "문화 탐방",
            "SHOPPING": "쇼핑",
            "NATURE": "자연 탐방"
        }

        schedules = []
        for day in range(1, days + 1):
            schedules.extend([
                {
                    "dayNumber": day,
                    "time": "09:00",
                    "placeName": f"{destination} 관광지 {day}",
                    "placeType": "ATTRACTION",
                    "description": f"Day {day} 오전 관광",
                    "lat": 37.5665 + (day * 0.01),
                    "lng": 126.9780 + (day * 0.01)
                },
                {
                    "dayNumber": day,
                    "time": "12:00",
                    "placeName": f"{destination} 맛집 {day}",
                    "placeType": "RESTAURANT",
                    "description": f"Day {day} 점심",
                    "lat": 37.5665 + (day * 0.01),
                    "lng": 126.9780 + (day * 0.01)
                },
                {
                    "dayNumber": day,
                    "time": "14:00",
                    "placeName": f"{destination} 명소 {day}",
                    "placeType": "ATTRACTION",
                    "description": f"Day {day} 오후 관광",
                    "lat": 37.5665 + (day * 0.01),
                    "lng": 126.9780 + (day * 0.01)
                },
                {
                    "dayNumber": day,
                    "time": "18:00",
                    "placeName": f"{destination} 저녁 맛집 {day}",
                    "placeType": "RESTAURANT",
                    "description": f"Day {day} 저녁",
                    "lat": 37.5665 + (day * 0.01),
                    "lng": 126.9780 + (day * 0.01)
                },
            ])

        return {
            "schedules": schedules,
            "summary": f"{destination}에서 {days}일간의 {theme_labels.get(theme, theme)} 여행 일정입니다."
        }

    async def recommend_places(
        self,
        destination: str,
        place_type: str,
        theme: Optional[str] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """장소 추천 - LangGraph 도구 활용"""
        # LangGraph 에이전트의 도구를 직접 호출할 수도 있지만,
        # 여기서는 단순 AI 생성으로 처리
        if self.llm:
            prompt = ChatPromptTemplate.from_messages([
                ("system", """당신은 여행 장소 추천 전문가입니다.
응답 형식:
{{
    "places": [
        {{
            "name": "장소명",
            "type": "장소 유형",
            "description": "설명",
            "lat": 위도,
            "lng": 경도
        }}
    ]
}}"""),
                ("user", f"{destination}의 추천 {place_type} 5곳을 알려주세요.")
            ])

            try:
                response = await self.llm.ainvoke(prompt.format_messages())
                content = response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                return json.loads(content.strip())
            except:
                pass

        return {
            "places": [
                {
                    "name": f"{destination} {place_type} {i+1}",
                    "type": place_type,
                    "description": f"추천 {place_type}입니다.",
                    "lat": 37.5665 + (i * 0.01),
                    "lng": 126.9780 + (i * 0.01)
                }
                for i in range(5)
            ]
        }
