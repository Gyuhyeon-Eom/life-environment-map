# 걸어볼까 (Walk Shall We)

내 주변 산책로의 혼잡도, 공기질, 벚꽃/단풍을 한눈에 보여주는 지도 앱.
친구들과 산책 사진을 공유하고, 장소를 태그하는 커뮤니티 기능 포함.

## 앱 구조

```
홈 (지도 중심)
├── 지도 위 친구 사진 핀
├── 바텀시트: 친구들의 산책 (가로 카드)
└── 빠른 액션: 산책로 / 개화현황 / 사진공유 / 친구

산책로 탭
├── 2열 그리드 카드 (이미지 + 거리 + 장소)
├── 키워드 검색
└── 상세: 코스 정보 + 날씨 + 대기질

개화 탭
├── 벚꽃/단풍 필터
├── 명소별 진행률 카드
└── 적산온도 기반 예측 모델
```

## Tech Stack

| 구분 | 기술 |
|------|------|
| Frontend | React Native (Expo) + TypeScript |
| Backend | Python FastAPI |
| Database | PostgreSQL + PostGIS (예정) |
| Cache | Redis (예정) |
| Batch | Celery (예정) |
| 배포 | 맥미니 자체 호스팅 (MVP) |

## Project Structure

```
life-environment-map/
├── mobile/                 # React Native (Expo) 앱
│   ├── App.tsx             # 메인 (지도 + 바텀시트)
│   ├── MapViewComponent.tsx    # 네이티브 지도
│   ├── MapViewComponent.web.tsx # 웹 placeholder
│   ├── TrailList.tsx       # 산책로 2열 그리드
│   ├── TrailDetail.tsx     # 산책로 상세 (코스 타임라인)
│   ├── BloomList.tsx       # 벚꽃/단풍 목록
│   ├── FeedScreen.tsx      # 피드 (deprecated → 홈 통합)
│   ├── theme.ts            # 디자인 테마
│   └── assets/             # 마스코트, 아이콘
├── backend/                # Python FastAPI
│   ├── app/
│   │   ├── main.py         # FastAPI 앱 + 라우터 등록
│   │   ├── config.py       # 환경변수 (API 키 등)
│   │   ├── routers/
│   │   │   ├── weather.py  # 날씨 + 대기질 API
│   │   │   ├── trails.py   # 산책로 API
│   │   │   └── bloom.py    # 벚꽃/단풍 예측 API
│   │   ├── collectors/
│   │   │   ├── weather_collector.py     # 기상청 API
│   │   │   ├── air_quality_collector.py # 에어코리아 API
│   │   │   ├── trail_collector.py       # 한국관광공사 API
│   │   │   └── bloom_collector.py       # 벚꽃/단풍 예측 모델
│   │   ├── models/         # DB 모델 (예정)
│   │   ├── services/       # 비즈니스 로직 (예정)
│   │   └── ml/             # 예측 모델 (예정)
│   ├── .env.example        # 환경변수 템플릿
│   ├── docker-compose.yml  # PostgreSQL + Redis
│   └── requirements.txt
├── PLAN.md                 # 기획서
├── API_SPEC.md             # 데이터/API 명세서
└── README.md               # 이 파일
```

## Getting Started

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# .env 파일 생성
cp .env.example .env
# .env에 API 키 입력

# 서버 실행
uvicorn app.main:app --host 127.0.0.1 --port 9090
```

### 2. Mobile

```bash
cd mobile
npm install
npx expo install react-native-maps expo-location react-dom react-native-web

# 웹에서 확인
npx expo start --web

# 모바일 (Expo Go 앱 필요)
npx expo start
```

### 3. API 키 발급 (공공데이터포털)

| API | 신청 URL | 용도 |
|-----|---------|------|
| 기상청 단기예보 | https://www.data.go.kr/data/15084084/openapi.do | 날씨 |
| 에어코리아 대기오염 | https://www.data.go.kr/data/15073861/openapi.do | 미세먼지 |
| 한국관광공사 관광정보_GW | https://www.data.go.kr/data/15101578/openapi.do | 산책로 |
| 기상청 ASOS 일기온 | https://www.data.go.kr/data/15059093/openapi.do | 벚꽃 예측 |

## 로드맵

- [x] Phase 1: 기반 세팅 + API 연동
- [ ] Phase 2: 지도 중심 UI 완성
- [ ] Phase 3: 커뮤니티 (사진 공유, 친구)
- [ ] Phase 4: 벚꽃/단풍 예측 모델 고도화
- [ ] Phase 5: 앱스토어 출시
