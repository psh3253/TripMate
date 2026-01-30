"""
한국관광공사 API 클라이언트 (비동기 버전)
"""
import httpx
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import quote

from app.config import settings
from app.utils.constants import AREA_CODES, CONTENT_TYPES

logger = logging.getLogger(__name__)


class TourApiClient:
    """한국관광공사 Tour API 클라이언트 (비동기)"""

    def __init__(self):
        self.base_url = settings.TOUR_API_BASE_URL
        self.service_key = settings.TOUR_API_KEY

    def _build_url(self, endpoint: str, params: Dict[str, Any]) -> str:
        """URL 빌드 (서비스키는 인코딩하지 않음)"""
        url = f"{self.base_url}/{endpoint}?serviceKey={self.service_key}"
        url += "&MobileOS=ETC&MobileApp=TripMate&_type=json"

        for key, value in params.items():
            if value is not None:
                if key == "keyword":
                    url += f"&{key}={quote(str(value))}"
                else:
                    url += f"&{key}={value}"
        return url

    async def search_places(
        self,
        keyword: str,
        area_code: Optional[str] = None,
        content_type_id: Optional[int] = None,
        num_of_rows: int = 10
    ) -> List[Dict[str, Any]]:
        """키워드로 장소 검색"""
        if not self.service_key:
            logger.warning("TOUR_API_KEY not configured")
            return []

        params = {
            "keyword": keyword,
            "numOfRows": num_of_rows,
            "pageNo": 1,
            "arrange": "P"
        }
        if area_code:
            params["areaCode"] = area_code
        if content_type_id:
            params["contentTypeId"] = content_type_id

        url = self._build_url("searchKeyword2", params)
        logger.info(f"[TourAPI] search: keyword={keyword}, area={area_code}")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                return self._parse_response(response, "search")
        except Exception as e:
            logger.error(f"[TourAPI] search error: {e}")
            return []

    async def get_area_based_list(
        self,
        area_code: str,
        content_type_id: Optional[int] = None,
        num_of_rows: int = 10
    ) -> List[Dict[str, Any]]:
        """지역 기반 장소 목록 조회"""
        if not self.service_key:
            return []

        params = {
            "areaCode": area_code,
            "numOfRows": num_of_rows,
            "pageNo": 1,
            "arrange": "P"
        }
        if content_type_id:
            params["contentTypeId"] = content_type_id

        url = self._build_url("areaBasedList2", params)
        logger.info(f"[TourAPI] area list: area={area_code}, type={content_type_id}")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                return self._parse_response(response, "area_list")
        except Exception as e:
            logger.error(f"[TourAPI] area list error: {e}")
            return []

    async def get_nearby_places(
        self,
        map_x: float,
        map_y: float,
        radius: int = 5000,
        content_type_id: Optional[int] = None,
        num_of_rows: int = 10
    ) -> List[Dict[str, Any]]:
        """위치 기반 주변 장소 조회"""
        if not self.service_key:
            return []

        params = {
            "mapX": map_x,
            "mapY": map_y,
            "radius": radius,
            "numOfRows": num_of_rows,
            "pageNo": 1,
            "arrange": "E"
        }
        if content_type_id:
            params["contentTypeId"] = content_type_id

        url = self._build_url("locationBasedList2", params)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                return self._parse_response(response, "nearby")
        except Exception as e:
            logger.error(f"[TourAPI] nearby error: {e}")
            return []

    async def get_detail(self, content_id: str) -> Optional[Dict[str, Any]]:
        """상세 정보 조회"""
        if not self.service_key:
            return None

        params = {
            "contentId": content_id,
            "defaultYN": "Y",
            "overviewYN": "Y",
            "addrinfoYN": "Y",
            "mapinfoYN": "Y"
        }

        url = self._build_url("detailCommon2", params)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                items = self._parse_response(response, "detail")
                return items[0] if items else None
        except Exception as e:
            logger.error(f"[TourAPI] detail error: {e}")
            return None

    def _parse_response(self, response: httpx.Response, operation: str) -> List[Dict]:
        """API 응답 파싱"""
        if response.status_code != 200:
            logger.error(f"[TourAPI] {operation} returned {response.status_code}")
            return []

        try:
            data = response.json()
            items = data.get("response", {}).get("body", {}).get("items", {})

            if not items or items == "":
                return []

            item_list = items.get("item", [])

            # 단일 결과인 경우 리스트로 변환
            if isinstance(item_list, dict):
                item_list = [item_list]

            logger.info(f"[TourAPI] {operation} returned {len(item_list)} items")
            return item_list

        except Exception as e:
            logger.error(f"[TourAPI] {operation} parse error: {e}")
            return []


# 싱글톤 인스턴스
tour_api_client = TourApiClient()
