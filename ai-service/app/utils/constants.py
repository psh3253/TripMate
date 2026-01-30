"""공통 상수 정의"""

# 지역 코드 매핑 (한국관광공사 API)
AREA_CODES = {
    "서울": "1",
    "인천": "2",
    "대전": "3",
    "대구": "4",
    "광주": "5",
    "부산": "6",
    "울산": "7",
    "세종": "8",
    "경기": "31",
    "강원": "32",
    "충북": "33",
    "충남": "34",
    "경북": "35",
    "경남": "36",
    "전북": "37",
    "전남": "38",
    "제주": "39",
}

# 콘텐츠 타입 ID (한국관광공사 API)
CONTENT_TYPES = {
    "attraction": 12,   # 관광지
    "culture": 14,      # 문화시설
    "festival": 15,     # 축제/공연/행사
    "leports": 28,      # 레포츠
    "accommodation": 32, # 숙박
    "shopping": 38,     # 쇼핑
    "restaurant": 39,   # 음식점
}

# 테마 레이블 (한글)
THEME_LABELS = {
    "HEALING": "힐링",
    "ADVENTURE": "모험",
    "FOOD": "맛집 탐방",
    "CULTURE": "문화 탐방",
    "SHOPPING": "쇼핑",
    "NATURE": "자연 탐방",
}

# 테마 설명 (상세)
THEME_DESCRIPTIONS = {
    "HEALING": "힐링과 휴식",
    "ADVENTURE": "모험과 액티비티",
    "FOOD": "맛집 탐방",
    "CULTURE": "문화와 역사",
    "SHOPPING": "쇼핑",
    "NATURE": "자연 탐방",
}

# 장소 타입 레이블
PLACE_TYPE_LABELS = {
    "attraction": "관광지",
    "restaurant": "맛집",
    "accommodation": "숙소",
    "activity": "액티비티",
}
