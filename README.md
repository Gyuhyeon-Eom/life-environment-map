# Life Environment Map

내 주변 산책로의 혼잡도, 소음, 공기질, 벚꽃/단풍을 한눈에 보여주는 지도 앱

## Features
- 산책로/등산로 탐색 + 실시간 혼잡도
- 동네별 소음지도 (히트맵)
- 벚꽃/단풍 개화 예측

## Tech Stack
- **Frontend**: React Native (Expo) + TypeScript
- **Backend**: Python FastAPI
- **Database**: PostgreSQL + PostGIS
- **Cache**: Redis
- **Batch**: Celery

## Project Structure
```
life-environment-map/
├── mobile/          # React Native (Expo) 앱
├── backend/         # FastAPI 백엔드
│   ├── app/
│   │   ├── routers/     # API 엔드포인트
│   │   ├── models/      # DB 모델
│   │   ├── services/    # 비즈니스 로직
│   │   ├── collectors/  # 데이터 수집기
│   │   └── ml/          # 예측 모델
│   ├── docker-compose.yml
│   └── requirements.txt
├── data/            # 원본 데이터
└── docs/            # 문서
```

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
docker-compose up -d  # PostgreSQL + Redis
uvicorn app.main:app --reload
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```
