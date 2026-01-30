# TripMate - 여행 계획 및 동행 모집 서비스

AI 기반 여행 계획 수립 및 동행 모집 플랫폼

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite |
| 상태관리 | Zustand + React Query |
| UI/스타일 | Tailwind CSS |
| Backend | Spring Boot 3.x + Java 17 |
| 실시간 통신 | WebSocket (STOMP) |
| AI Service | Python + FastAPI + LangGraph + OpenAI |
| Database | PostgreSQL + Redis |
| 인증 | 카카오 소셜 로그인 (OAuth 2.0) |

## 프로젝트 구조

```
TripMate/
├── frontend/                 # React 프론트엔드
├── backend/                  # Spring Boot 백엔드
├── ai-service/               # Python AI 서비스
└── docker-compose.yml        # Docker 설정
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- Java 17+
- Python 3.11+
- Docker & Docker Compose

### 환경 변수 설정

1. **카카오 개발자 앱 등록**
   - https://developers.kakao.com 에서 앱 생성
   - REST API 키 발급
   - Redirect URI 등록: `http://localhost:3000/oauth/kakao/callback`

2. **환경 변수 파일 생성**

```bash
# 프로젝트 루트에 .env 파일 생성
KAKAO_CLIENT_ID=your_kakao_rest_api_key
OPENAI_API_KEY=your_openai_api_key  # 선택사항
JWT_SECRET=your-256-bit-secret-key-for-jwt-token-signing-must-be-at-least-32-chars
```

### Docker로 실행 (권장)

```bash
# 데이터베이스만 실행
docker-compose up -d postgres redis

# 전체 서비스 실행
docker-compose --profile full up -d
```

### 로컬 개발 환경

#### 1. 데이터베이스 실행

```bash
docker-compose up -d postgres redis
```

#### 2. Backend 실행

```bash
cd backend
./gradlew bootRun
```

#### 3. AI Service 실행

```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### 4. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

### 접속

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- AI Service: http://localhost:8000

## 주요 기능

### 1. 사용자 인증
- 카카오 OAuth 2.0 로그인
- JWT 토큰 기반 인증
- 프로필 관리

### 2. 여행 계획
- 여행 생성 (목적지, 날짜, 예산, 테마)
- AI 기반 일정 추천
- 일정 수정 및 저장

### 3. 동행 모집
- 모집 글 작성/조회/수정/삭제
- 동행 신청/승인/거절
- 실시간 채팅 (WebSocket)

### 4. AI 여행 추천
- 사용자 취향 분석
- 맞춤형 코스 생성
- 숙소, 맛집, 관광지 추천

## API 엔드포인트

### Auth
- `POST /api/auth/kakao` - 카카오 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 내 정보

### Trips
- `GET/POST /api/trips` - 여행 목록/생성
- `GET/PUT/DELETE /api/trips/{id}` - 여행 상세/수정/삭제
- `POST /api/trips/{id}/ai-recommend` - AI 일정 추천

### Companions
- `GET/POST /api/companions` - 동행 모집 목록/생성
- `GET/PUT/DELETE /api/companions/{id}` - 상세/수정/삭제
- `POST /api/companions/{id}/apply` - 동행 신청
- `POST /api/companions/{id}/approve/{userId}` - 승인

### Chat
- `GET /api/chat/rooms` - 채팅방 목록
- `GET /api/chat/rooms/{roomId}/messages` - 메시지 조회
- WebSocket: `/ws` - 실시간 채팅

## 라이선스

MIT License
