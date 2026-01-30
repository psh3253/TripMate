"""Tour API 관련 유틸리티"""
import httpx
import logging
from typing import Optional, List, Dict, Any

from app.config import settings
from .constants import AREA_CODES, CONTENT_TYPES

logger = logging.getLogger(__name__)


def get_area_code_sync(area_name: str) -> Optional[str]:
    """
    지역명으로 지역 코드 조회 (동기)

    Args:
        area_name: 지역명 (예: "제주", "서울", "부산")

    Returns:
        지역 코드 또는 None
    """
    for name, code in AREA_CODES.items():
        if name in area_name or area_name in name:
            return code
    return None


def fetch_places_sync(
    area_code: str,
    content_type: str,
    num_of_rows: int = 10,
    timeout: float = 15.0
) -> List[Dict[str, Any]]:
    """
    Tour API에서 장소 목록 조회 (동기 버전)

    FastAPI 이벤트 루프와 충돌을 피하기 위해 동기 HTTP 클라이언트 사용

    Args:
        area_code: 지역 코드
        content_type: 콘텐츠 유형 (attraction, restaurant, accommodation 등)
        num_of_rows: 조회할 개수
        timeout: 타임아웃 (초)

    Returns:
        장소 목록
    """
    content_type_id = CONTENT_TYPES.get(content_type)
    if not content_type_id:
        logger.warning(f"Unknown content_type: {content_type}")
        return []

    if not settings.TOUR_API_KEY:
        logger.warning("TOUR_API_KEY not configured")
        return []

    # URL 직접 구성 (서비스키 인코딩 방지)
    base_url = settings.TOUR_API_BASE_URL
    url = f"{base_url}/areaBasedList2?serviceKey={settings.TOUR_API_KEY}"
    url += f"&MobileOS=ETC&MobileApp=TripMate&_type=json"
    url += f"&numOfRows={num_of_rows}&pageNo=1"
    url += f"&arrange=P"
    url += f"&contentTypeId={content_type_id}&areaCode={area_code}"

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(url)

            if response.status_code != 200:
                logger.error(f"Tour API error {response.status_code}: {response.text[:200]}")
                return []

            data = response.json()
            items = data.get("response", {}).get("body", {}).get("items", {})

            # items가 빈 문자열이거나 None인 경우
            if not items or items == "":
                logger.info(f"No {content_type} found for area {area_code}")
                return []

            item_list = items.get("item", [])

            # 단일 결과인 경우 리스트로 변환
            if isinstance(item_list, dict):
                item_list = [item_list]

            logger.info(f"Fetched {len(item_list)} {content_type} for area {area_code}")
            return item_list

    except httpx.TimeoutException:
        logger.error(f"Tour API timeout for {content_type} in area {area_code}")
        return []
    except Exception as e:
        logger.error(f"Tour API error: {e}")
        return []


def format_places_for_prompt(places: List[Dict], max_items: int = 10) -> str:
    """
    장소 목록을 LLM 프롬프트용 문자열로 변환

    Args:
        places: 장소 목록
        max_items: 최대 포함할 장소 수

    Returns:
        포맷된 문자열
    """
    if not places:
        return "검색 결과 없음"

    result = []
    for i, p in enumerate(places[:max_items], 1):
        item = f"{i}. {p.get('title', '이름없음')}"
        if p.get('addr1'):
            item += f" - {p.get('addr1')}"
        if p.get('tel'):
            item += f" (Tel: {p.get('tel')})"
        result.append(item)

    return "\n".join(result)


def extract_places_with_coords(places: List[Dict], max_items: int = 10) -> List[Dict[str, Any]]:
    """
    장소 목록에서 좌표 포함 정보 추출

    Args:
        places: Tour API에서 받은 장소 목록
        max_items: 최대 포함할 장소 수

    Returns:
        이름, 좌표, 주소가 포함된 장소 정보 리스트
    """
    if not places:
        return []

    result = []
    for p in places[:max_items]:
        place_info = {
            "name": p.get('title', '이름없음'),
            "lat": float(p.get('mapy', 0)) if p.get('mapy') else None,
            "lng": float(p.get('mapx', 0)) if p.get('mapx') else None,
            "addr": p.get('addr1', ''),
        }
        if place_info["lat"] and place_info["lng"]:
            result.append(place_info)

    return result


def search_places_by_keyword_sync(
    keyword: str,
    area_code: Optional[str] = None,
    content_type: Optional[str] = None,
    num_of_rows: int = 10,
    timeout: float = 10.0
) -> List[Dict[str, Any]]:
    """
    키워드로 장소 검색 (동기 버전)

    Args:
        keyword: 검색 키워드
        area_code: 지역 코드 (선택)
        content_type: 콘텐츠 유형 (선택)
        num_of_rows: 조회할 개수
        timeout: 타임아웃

    Returns:
        검색 결과 목록
    """
    if not settings.TOUR_API_KEY:
        return []

    from urllib.parse import quote

    base_url = settings.TOUR_API_BASE_URL
    url = f"{base_url}/searchKeyword2?serviceKey={settings.TOUR_API_KEY}"
    url += f"&MobileOS=ETC&MobileApp=TripMate&_type=json"
    url += f"&numOfRows={num_of_rows}&pageNo=1"
    url += f"&keyword={quote(keyword)}"
    url += f"&arrange=P"

    if area_code:
        url += f"&areaCode={area_code}"

    if content_type:
        content_type_id = CONTENT_TYPES.get(content_type)
        if content_type_id:
            url += f"&contentTypeId={content_type_id}"

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(url)

            if response.status_code != 200:
                logger.error(f"Search API error {response.status_code}")
                return []

            data = response.json()
            items = data.get("response", {}).get("body", {}).get("items", {})

            if not items or items == "":
                return []

            item_list = items.get("item", [])
            if isinstance(item_list, dict):
                item_list = [item_list]

            return item_list

    except Exception as e:
        logger.error(f"Search API error: {e}")
        return []
