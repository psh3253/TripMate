"""
한국관광공사 API를 LangGraph Tool로 구현
"""
from typing import Optional
from langchain.tools import tool

from app.services.tour_api import tour_api_client
from app.utils.constants import AREA_CODES, CONTENT_TYPES, PLACE_TYPE_LABELS


@tool
async def get_area_code(area_name: str) -> str:
    """
    지역명으로 지역 코드를 조회합니다.

    Args:
        area_name: 지역명 (예: 서울, 부산, 제주, 강원 등)

    Returns:
        지역 코드 또는 찾을 수 없음 메시지
    """
    for name, code in AREA_CODES.items():
        if name in area_name or area_name in name:
            return f"지역코드: {code} (지역명: {name})"

    available = ", ".join(AREA_CODES.keys())
    return f"'{area_name}' 지역을 찾을 수 없습니다. 사용 가능한 지역: {available}"


@tool
async def search_attractions(
    keyword: str,
    area_code: Optional[str] = None,
    num_of_rows: int = 5
) -> str:
    """
    관광지를 검색합니다.

    Args:
        keyword: 검색 키워드 (예: 해변, 산, 공원, 전망대 등)
        area_code: 지역 코드 (선택사항, get_area_code로 조회)
        num_of_rows: 검색 결과 개수 (기본 5개)

    Returns:
        검색된 관광지 목록
    """
    places = await tour_api_client.search_places(
        keyword=keyword,
        area_code=area_code,
        content_type_id=CONTENT_TYPES["attraction"],
        num_of_rows=num_of_rows
    )

    if not places:
        return f"'{keyword}' 관련 관광지를 찾을 수 없습니다."

    return _format_places(places, "관광지")


@tool
async def search_restaurants(
    keyword: str,
    area_code: Optional[str] = None,
    num_of_rows: int = 5
) -> str:
    """
    맛집/음식점을 검색합니다.

    Args:
        keyword: 검색 키워드 (예: 해산물, 고기, 한식, 카페 등)
        area_code: 지역 코드 (선택사항)
        num_of_rows: 검색 결과 개수 (기본 5개)

    Returns:
        검색된 맛집 목록
    """
    places = await tour_api_client.search_places(
        keyword=keyword,
        area_code=area_code,
        content_type_id=CONTENT_TYPES["restaurant"],
        num_of_rows=num_of_rows
    )

    if not places:
        return f"'{keyword}' 관련 맛집을 찾을 수 없습니다."

    return _format_places(places, "맛집")


@tool
async def search_accommodations(
    keyword: str,
    area_code: Optional[str] = None,
    num_of_rows: int = 5
) -> str:
    """
    숙소를 검색합니다.

    Args:
        keyword: 검색 키워드 (예: 호텔, 펜션, 리조트, 게스트하우스 등)
        area_code: 지역 코드 (선택사항)
        num_of_rows: 검색 결과 개수 (기본 5개)

    Returns:
        검색된 숙소 목록
    """
    places = await tour_api_client.search_places(
        keyword=keyword,
        area_code=area_code,
        content_type_id=CONTENT_TYPES["accommodation"],
        num_of_rows=num_of_rows
    )

    if not places:
        return f"'{keyword}' 관련 숙소를 찾을 수 없습니다."

    return _format_places(places, "숙소")


@tool
async def search_activities(
    keyword: str,
    area_code: Optional[str] = None,
    num_of_rows: int = 5
) -> str:
    """
    레포츠/액티비티를 검색합니다.

    Args:
        keyword: 검색 키워드 (예: 서핑, 스키, 래프팅, 골프 등)
        area_code: 지역 코드 (선택사항)
        num_of_rows: 검색 결과 개수 (기본 5개)

    Returns:
        검색된 액티비티 목록
    """
    places = await tour_api_client.search_places(
        keyword=keyword,
        area_code=area_code,
        content_type_id=CONTENT_TYPES["leports"],
        num_of_rows=num_of_rows
    )

    if not places:
        return f"'{keyword}' 관련 액티비티를 찾을 수 없습니다."

    return _format_places(places, "액티비티")


@tool
async def get_popular_places(
    area_code: str,
    place_type: str = "attraction",
    num_of_rows: int = 10
) -> str:
    """
    특정 지역의 인기 장소를 조회합니다.

    Args:
        area_code: 지역 코드 (get_area_code로 조회)
        place_type: 장소 유형 (attraction, restaurant, accommodation, activity)
        num_of_rows: 결과 개수 (기본 10개)

    Returns:
        인기 장소 목록
    """
    type_mapping = {
        "attraction": CONTENT_TYPES["attraction"],
        "restaurant": CONTENT_TYPES["restaurant"],
        "accommodation": CONTENT_TYPES["accommodation"],
        "activity": CONTENT_TYPES["leports"],
    }

    content_type_id = type_mapping.get(place_type, CONTENT_TYPES["attraction"])

    places = await tour_api_client.get_area_based_list(
        area_code=area_code,
        content_type_id=content_type_id,
        num_of_rows=num_of_rows
    )

    if not places:
        return f"해당 지역의 {place_type} 정보를 찾을 수 없습니다."

    label = PLACE_TYPE_LABELS.get(place_type, place_type)
    return _format_places(places, f"인기 {label}")


@tool
async def get_nearby_places(
    latitude: float,
    longitude: float,
    place_type: str = "attraction",
    radius: int = 5000,
    num_of_rows: int = 5
) -> str:
    """
    특정 위치 주변의 장소를 검색합니다.

    Args:
        latitude: 위도 (예: 33.4996)
        longitude: 경도 (예: 126.5312)
        place_type: 장소 유형 (attraction, restaurant, accommodation)
        radius: 검색 반경 미터 (기본 5000m)
        num_of_rows: 결과 개수 (기본 5개)

    Returns:
        주변 장소 목록
    """
    type_mapping = {
        "attraction": CONTENT_TYPES["attraction"],
        "restaurant": CONTENT_TYPES["restaurant"],
        "accommodation": CONTENT_TYPES["accommodation"],
    }

    content_type_id = type_mapping.get(place_type)

    places = await tour_api_client.get_nearby_places(
        map_x=longitude,
        map_y=latitude,
        radius=radius,
        content_type_id=content_type_id,
        num_of_rows=num_of_rows
    )

    if not places:
        return f"주변 {radius}m 내에 {place_type}을(를) 찾을 수 없습니다."

    result = [f"주변 {radius}m 내 장소 ({len(places)}개):"]
    for i, p in enumerate(places, 1):
        dist = p.get('dist', '')
        dist_str = f" ({float(dist):.0f}m)" if dist else ""
        result.append(f"{i}. {p.get('title', '이름없음')}{dist_str}")
        result.append(f"   주소: {p.get('addr1', '주소없음')}")

    return "\n".join(result)


@tool
async def get_place_detail(content_id: str) -> str:
    """
    장소의 상세 정보를 조회합니다.

    Args:
        content_id: 콘텐츠 ID (다른 검색 결과에서 확인)

    Returns:
        장소 상세 정보
    """
    detail = await tour_api_client.get_detail(content_id)

    if not detail:
        return f"콘텐츠 ID '{content_id}'의 상세 정보를 찾을 수 없습니다."

    result = [f"📍 {detail.get('title', '이름없음')}"]

    if detail.get('overview'):
        result.append(f"\n소개:\n{detail.get('overview')}")

    if detail.get('addr1'):
        result.append(f"\n주소: {detail.get('addr1')} {detail.get('addr2', '')}")

    if detail.get('tel'):
        result.append(f"전화: {detail.get('tel')}")

    if detail.get('mapx') and detail.get('mapy'):
        result.append(f"좌표: ({detail.get('mapy')}, {detail.get('mapx')})")

    return "\n".join(result)


def _format_places(places: list, label: str) -> str:
    """장소 목록 포맷팅 헬퍼"""
    result = [f"검색된 {label} ({len(places)}개):"]

    for i, p in enumerate(places, 1):
        result.append(f"{i}. {p.get('title', '이름없음')}")
        result.append(f"   주소: {p.get('addr1', '주소없음')}")
        result.append(f"   콘텐츠ID: {p.get('contentid', '')}")
        if p.get('mapx') and p.get('mapy'):
            result.append(f"   좌표: ({p.get('mapy')}, {p.get('mapx')})")
        if p.get('tel'):
            result.append(f"   전화: {p.get('tel')}")

    return "\n".join(result)


# 모든 도구 목록
ALL_TOOLS = [
    get_area_code,
    search_attractions,
    search_restaurants,
    search_accommodations,
    search_activities,
    get_popular_places,
    get_nearby_places,
    get_place_detail,
]
