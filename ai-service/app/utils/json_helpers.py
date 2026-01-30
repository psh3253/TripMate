"""JSON 처리 유틸리티"""
import re
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def extract_json_from_response(content: str) -> str:
    """LLM 응답에서 JSON 부분만 추출"""
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]
    return content.strip()


def fix_json_string(s: str) -> str:
    """
    LLM이 생성한 잘못된 JSON 수정 시도

    - 코드 블록 제거
    - 후행 쉼표 제거
    - 일반적인 JSON 오류 수정
    """
    # 코드 블록 제거
    s = extract_json_from_response(s)

    # 후행 쉼표 제거 (}, 또는 ], 앞의 쉼표)
    s = re.sub(r',\s*}', '}', s)
    s = re.sub(r',\s*]', ']', s)

    # 줄바꿈 문자가 포함된 문자열 처리
    # (문자열 내부가 아닌 곳의 줄바꿈만 제거)

    return s


def parse_json_safely(content: str) -> Optional[Dict[str, Any]]:
    """
    JSON을 안전하게 파싱

    1. 기본 파싱 시도
    2. 수정 후 파싱 시도
    3. 부분 추출 시도 (schedule 배열)
    """
    # 1. 기본 시도
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # 2. 수정 후 시도
    try:
        fixed = fix_json_string(content)
        return json.loads(fixed)
    except json.JSONDecodeError as e:
        logger.warning(f"JSON parse failed after fix: {e}")

    # 3. schedule 배열만 추출 시도
    try:
        fixed = fix_json_string(content)
        match = re.search(r'"schedule"\s*:\s*(\[.*?\])\s*[,}]', fixed, re.DOTALL)
        if match:
            schedule = json.loads(match.group(1))
            return {"schedule": schedule}
    except Exception as e:
        logger.warning(f"Schedule extraction failed: {e}")

    # 4. schedules 배열 추출 시도 (다른 형식)
    try:
        fixed = fix_json_string(content)
        match = re.search(r'"schedules"\s*:\s*(\[.*?\])\s*[,}]', fixed, re.DOTALL)
        if match:
            schedules = json.loads(match.group(1))
            return {"schedules": schedules}
    except Exception as e:
        logger.warning(f"Schedules extraction failed: {e}")

    return None


def safe_json_loads(content: str, default: Any = None) -> Any:
    """
    JSON 파싱 (실패 시 기본값 반환)
    """
    result = parse_json_safely(content)
    return result if result is not None else default
