# 생활환경 맵 (Life Environment Map) - MVP 기획서

## 1. 앱 개요

**앱 이름 (가칭):** 걸어볼까 / WalkScore / 동네산책

**한줄 설명:** 내 주변 산책로의 혼잡도, 소음, 공기질, 계절 풍경을 한눈에 보여주는 지도 앱

**타겟 사용자:**
- 산책/등산 좋아하는 2030
- 이사/원룸 구할 때 동네 환경 궁금한 사람
- 벚꽃/단풍 명소 타이밍 알고 싶은 사람

**수익 모델:**
- 기본 무료 + 프리미엄 구독 (상세 분석, 알림 기능)
- 지역 광고 (카페, 음식점 등 주변 상권)
- 부동산 중개업소 제휴 (소음지도 연동)

---

## 2. 핵심 기능 (MVP)

### Feature 1: 산책로/등산로 탐색
- 지도 위에 산책로, 둘레길, 등산로 경로 표시
- 각 경로별 정보: 거리, 소요시간, 난이도
- 현재 날씨 + 미세먼지 상태 오버레이
- 혼잡도 등급 표시 (한산 / 보통 / 혼잡)

### Feature 2: 소음지도
- 동네별 소음 레벨을 히트맵으로 표시
- 소음 등급: 매우 조용 / 조용 / 보통 / 시끄러움 / 매우 시끄러움
- 소음 원인 태그 (교통, 유흥가, 공사, 항공 등)
- 이사할 때 참고용 필터

### Feature 3: 벚꽃/단풍 예측
- 주요 명소별 개화/단풍 예측 퍼센트
- "지금 가면 볼 수 있어요" / "아직 이른 편이에요" 상태 표시
- 시즌별 활성화 (3~5월 벚꽃, 10~11월 단풍)

---

## 3. 화면 구성

### Screen 1: 메인 지도 화면 (홈)
```
+------------------------------------------+
|  [검색바: 장소/주소 검색]                    |
|                                          |
|                                          |
|            < 지도 영역 >                   |
|     (산책로 경로 + 오버레이 레이어)           |
|                                          |
|                                          |
|                                          |
|  [현재위치]                    [레이어 버튼] |
+------------------------------------------+
|  [산책로]  [소음]  [벚꽃/단풍]  [설정]       |
+------------------------------------------+
```
- 하단 탭으로 레이어 전환
- 레이어 버튼: 날씨/미세먼지/혼잡도 토글

### Screen 2: 산책로 상세
```
+------------------------------------------+
|  < 뒤로                                   |
|                                          |
|  북한산 둘레길 3코스                         |
|  거리: 4.2km | 소요: 1시간 30분 | 난이도: 중  |
|                                          |
|  +--------------------------------------+|
|  |  지금 상태                              ||
|  |  혼잡도: 보통        미세먼지: 좋음       ||
|  |  기온: 18도          습도: 45%          ||
|  +--------------------------------------+|
|                                          |
|  [경로 미리보기 지도]                        |
|                                          |
|  추천 시간대                                |
|  - 오전 7~9시: 한산                         |
|  - 오후 2~4시: 혼잡                         |
|  - 오후 5~7시: 보통                         |
|                                          |
|  [ 길안내 시작 ]                            |
+------------------------------------------+
```

### Screen 3: 소음지도 상세
```
+------------------------------------------+
|  < 뒤로                                   |
|                                          |
|  서울시 마포구 합정동                         |
|                                          |
|  소음 등급: 보통 (55~60dB)                   |
|                                          |
|  주요 소음원:                                |
|  - 교통 소음 (60%)                          |
|  - 상업시설 (25%)                           |
|  - 기타 (15%)                              |
|                                          |
|  시간대별 소음 그래프                         |
|  [======= 막대 그래프 =======]              |
|                                          |
|  주변 비교                                  |
|  합정동 55dB > 상수동 48dB > 망원동 52dB      |
+------------------------------------------+
```

### Screen 4: 벚꽃/단풍 상세
```
+------------------------------------------+
|  < 뒤로                                   |
|                                          |
|  여의도 윤중로                               |
|                                          |
|  현재 상태: 만개 (95%)                       |
|  예상 절정일: 4월 8일                        |
|  추천 방문일: 4월 6일 ~ 4월 12일             |
|                                          |
|  개화 진행률                                 |
|  [====================----] 80%           |
|                                          |
|  다른 명소 비교                              |
|  석촌호수: 70% | 경주 보문단지: 50%           |
+------------------------------------------+
```

### Screen 5: 설정
- 관심 지역 설정
- 알림 설정 (벚꽃 개화 알림, 미세먼지 알림 등)
- 지도 스타일

---

## 4. 기술 스택

### Frontend (모바일 앱)
- **React Native (Expo)** - iOS/Android 동시 개발
- **react-native-maps** - 지도 렌더링 (Google Maps 또는 Naver Maps)
- **react-native-chart-kit** - 간단한 차트

### Backend (API 서버)
- **Python FastAPI** - REST API 서버
- **PostgreSQL + PostGIS** - 공간 데이터 저장/쿼리
- **Redis** - 실시간 데이터 캐싱
- **Celery + Redis** - 배치 데이터 수집 스케줄링

### 배포
- MVP: 맥미니 자체 호스팅 (기존 인프라 활용)
- 확장 시: AWS/GCP 이전

---

## 5. 데이터소스 및 API

### 5-1. 산책로/등산로 경로 데이터
| API | 제공기관 | 비용 | 용도 |
|-----|---------|------|------|
| 등산로 Open API (WMS/WFS) | 국토교통부 | 무료 | 전국 등산로 경로 좌표 |
| 전국길관광정보 표준데이터 | 공공데이터포털 | 무료 | 둘레길, 산책로 정보 |
| 봉우리 코스 GPX | 한국등산트레킹지원센터 | 무료 | 상세 코스 좌표 |

**API 신청처:** https://www.data.go.kr/data/15057232/openapi.do

### 5-2. 날씨/대기질
| API | 제공기관 | 비용 | 용도 |
|-----|---------|------|------|
| 단기예보 조회서비스 | 기상청 | 무료 | 기온, 강수, 습도, 풍속 |
| 대기오염정보 | 에어코리아 (환경공단) | 무료 | 미세먼지, 오존, 대기질 등급 |
| 자외선지수 | 기상청 | 무료 | UV 지수 |

**API 신청처:**
- 기상청: https://www.data.go.kr/data/15084084/openapi.do
- 에어코리아: https://www.data.go.kr/data/15073861/openapi.do

### 5-3. 혼잡도 추정 데이터
| API | 제공기관 | 비용 | 용도 |
|-----|---------|------|------|
| 서울 실시간 도시데이터 | 서울시 | 무료 | 서울 주요 장소 실시간 혼잡도 |
| 지하철 승하차 데이터 | 서울교통공사 등 | 무료 | 지역 유입량 추정 |
| 버스 승하차 데이터 | 각 시도 | 무료 | 지역 유입량 추정 |
| 실시간 도로 교통량 | 국토교통부 | 무료 | 주변 혼잡 간접 추정 |

**혼잡도 추정 모델:**
```
혼잡도_점수 = 
    w1 * 시간대별_교통량(정규화)
  + w2 * 대중교통_승하차수(정규화)
  + w3 * 날씨_보정계수   # 맑음+주말 = 높음
  + w4 * 요일_보정계수   # 주말/공휴일 = 높음
  + w5 * 시설밀집도(정규화)
```
- 등급 분류: 한산(0~30) / 보통(30~60) / 혼잡(60~100)
- 서울은 실시간 도시데이터로 보정 가능

**API 신청처:** https://data.seoul.go.kr/dataVisual/seoul/guide.do

### 5-4. 소음 데이터
| API | 제공기관 | 비용 | 용도 |
|-----|---------|------|------|
| 소음측정 데이터 | 국가소음정보시스템 | 무료 | 측정소별 소음 레벨 |
| 서울 소음도 통계 | 서울 열린데이터광장 | 무료 | 서울 지역별 소음 |
| 도시 소리 데이터 | AI Hub | 무료 | 소음 분류 AI 학습용 |
| 도로 교통량 | 국토교통부 | 무료 | 교통 소음 추정 |

**소음 추정 모델 (측정소 없는 지역):**
```
추정_소음(dB) = 
    base_noise(지역유형)          # 주거=40, 상업=55, 공업=60
  + traffic_noise(교통량, 도로폭)  # 교통량 비례, 도로 폭 반비례
  + commercial_noise(유흥시설수)   # 시설 밀집도 비례
  + construction_noise(공사현황)   # 인허가 데이터 활용
  + airport_noise(항공경로거리)    # 항공 경로 근접도
```

**API 신청처:** https://www.noiseinfo.or.kr/

### 5-5. 벚꽃/단풍 예측
| 데이터 | 소스 | 비용 | 용도 |
|--------|------|------|------|
| 일별 기온 (과거 30년) | 기상자료개방포털 | 무료 | 적산온도 계산 |
| 봄꽃 개화 현황 (과거) | 기상청 날씨누리 | 무료 | 학습 데이터 |
| 실시간 기온 | 기상청 단기예보 | 무료 | 예측 입력값 |

**벚꽃 개화 예측 모델:**
```
적산온도 방식:
1. 2월 1일부터 일평균기온 누적 합산
2. 적산온도가 임계값(약 150~200도) 도달 시 = 개화일
3. 지역별 임계값은 과거 데이터로 학습

개화 진행률 = 현재_적산온도 / 지역별_임계값 * 100

단풍도 유사:
- 9월부터 일평균기온 기준
- 일최저기온 5도 이하 누적일수 기반
```

**API 신청처:** https://data.kma.go.kr/api/selectApiList.do

---

## 6. 데이터베이스 설계

### 주요 테이블

```sql
-- 산책로/등산로 경로
CREATE TABLE trails (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    region VARCHAR(100),        -- 시도/시군구
    distance_km FLOAT,
    duration_min INT,
    difficulty VARCHAR(20),     -- 쉬움/보통/어려움
    trail_type VARCHAR(50),     -- 등산로/둘레길/산책로
    geometry GEOMETRY(LineString, 4326),  -- PostGIS 경로
    created_at TIMESTAMP DEFAULT NOW()
);

-- 실시간 환경 데이터 (시간별 갱신)
CREATE TABLE trail_conditions (
    id SERIAL PRIMARY KEY,
    trail_id INT REFERENCES trails(id),
    measured_at TIMESTAMP,
    temperature FLOAT,
    humidity FLOAT,
    pm25 FLOAT,                 -- 미세먼지
    pm10 FLOAT,
    congestion_score INT,       -- 0~100
    congestion_level VARCHAR(20), -- 한산/보통/혼잡
    uv_index INT
);

-- 소음 데이터
CREATE TABLE noise_data (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(20),
    region_name VARCHAR(100),
    noise_db FLOAT,
    noise_level VARCHAR(20),    -- 매우조용~매우시끄러움
    noise_sources JSONB,        -- {"교통": 60, "상업": 25, ...}
    geometry GEOMETRY(Point, 4326),
    measured_at TIMESTAMP
);

-- 벚꽃/단풍 명소
CREATE TABLE bloom_spots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    region VARCHAR(100),
    spot_type VARCHAR(20),      -- 벚꽃/단풍
    latitude FLOAT,
    longitude FLOAT,
    threshold_temp FLOAT        -- 개화 임계 적산온도
);

-- 벚꽃/단풍 예측 데이터
CREATE TABLE bloom_predictions (
    id SERIAL PRIMARY KEY,
    spot_id INT REFERENCES bloom_spots(id),
    prediction_date DATE,
    accumulated_temp FLOAT,     -- 현재 적산온도
    progress_pct FLOAT,         -- 개화 진행률 (0~100)
    estimated_bloom_date DATE,  -- 예상 개화일
    estimated_peak_date DATE,   -- 예상 만개일
    status VARCHAR(50),         -- 준비중/개화시작/만개/낙화
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 사용자 즐겨찾기
CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    item_type VARCHAR(20),      -- trail/noise_region/bloom_spot
    item_id INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. API 엔드포인트 설계

### 산책로
```
GET  /api/v1/trails                    # 산책로 목록 (위치 기반)
GET  /api/v1/trails/{id}               # 산책로 상세
GET  /api/v1/trails/{id}/conditions    # 현재 환경 상태
GET  /api/v1/trails/search?q=북한산     # 검색
```

### 소음
```
GET  /api/v1/noise/map?lat=&lng=&zoom= # 소음 히트맵 데이터
GET  /api/v1/noise/region/{code}       # 지역 소음 상세
GET  /api/v1/noise/compare?regions=    # 지역 비교
```

### 벚꽃/단풍
```
GET  /api/v1/bloom/spots               # 명소 목록
GET  /api/v1/bloom/spots/{id}          # 명소 상세 + 예측
GET  /api/v1/bloom/ranking             # 개화율 순위
```

### 공통
```
GET  /api/v1/weather?lat=&lng=         # 현재 날씨
GET  /api/v1/air-quality?lat=&lng=     # 현재 대기질
POST /api/v1/favorites                 # 즐겨찾기 추가
GET  /api/v1/favorites                 # 즐겨찾기 목록
```

---

## 8. 배치 데이터 파이프라인

```
[공공데이터 API들] 
    --> [Celery Worker: 데이터 수집]
    --> [Python: 전처리/가공]
    --> [PostgreSQL/PostGIS: 저장]
    --> [Redis: 캐싱]
    --> [FastAPI: 앱에 서빙]
```

### 갱신 주기
| 데이터 | 주기 | 방법 |
|--------|------|------|
| 날씨/미세먼지 | 1시간 | Celery beat |
| 교통량/혼잡도 | 1시간 | Celery beat |
| 소음 데이터 | 1일 | Celery beat (새벽) |
| 산책로 경로 | 1주 | 수동/배치 |
| 벚꽃/단풍 예측 | 1일 (시즌 중) | Celery beat |

---

## 9. 개발 로드맵

### Phase 1: 기반 세팅 (1주)
- [ ] 공공데이터포털 API 키 발급 (기상청, 에어코리아, 국토교통부, 서울시)
- [ ] React Native (Expo) 개발환경 세팅
- [ ] FastAPI 프로젝트 구조 생성
- [ ] PostgreSQL + PostGIS 설치
- [ ] Hello World 앱 + 지도 띄우기

### Phase 2: 백엔드 - 데이터 수집 (2주)
- [ ] 산책로/등산로 데이터 수집 및 DB 적재
- [ ] 기상청 날씨 API 연동
- [ ] 에어코리아 대기질 API 연동
- [ ] 교통량/대중교통 데이터 수집
- [ ] 혼잡도 추정 모델 v1

### Phase 3: 백엔드 - API 서버 (1주)
- [ ] FastAPI 엔드포인트 구현
- [ ] Redis 캐싱 적용
- [ ] Celery 배치 스케줄링

### Phase 4: 프론트엔드 (2주)
- [ ] 메인 지도 화면 구현
- [ ] 산책로 목록/상세 화면
- [ ] 소음 히트맵 레이어
- [ ] 벚꽃/단풍 화면 (시즌 기능)
- [ ] 설정 화면

### Phase 5: 예측 모델 (1주)
- [ ] 벚꽃 개화 예측 모델 구축
- [ ] 소음 추정 모델 구축
- [ ] 혼잡도 모델 튜닝

### Phase 6: 마무리 (1주)
- [ ] 테스트 및 버그 수정
- [ ] 앱스토어 등록 준비
- [ ] 베타 테스트

**예상 총 기간: 약 8주 (주말 포함, 풀타임 아닌 사이드 프로젝트 기준)**

---

## 10. 공공데이터 API 키 발급 가이드

### Step 1: 공공데이터포털 회원가입
1. https://www.data.go.kr 접속
2. 회원가입 (공인인증서 또는 간편인증)

### Step 2: API 활용 신청 (아래 4개)
1. **기상청 단기예보**: https://www.data.go.kr/data/15084084/openapi.do
2. **에어코리아 대기오염정보**: https://www.data.go.kr/data/15073861/openapi.do
3. **국토교통부 등산로**: https://www.data.go.kr/data/15057232/openapi.do
4. **전국길관광정보**: https://www.data.go.kr/data/15017321/standard.do

### Step 3: 서울 열린데이터광장
1. https://data.seoul.go.kr 회원가입
2. 실시간 도시데이터 API 신청

### Step 4: 기상자료개방포털
1. https://data.kma.go.kr 회원가입
2. 과거 기온 데이터 다운로드 (벚꽃 예측용)

**참고: API 키 발급은 보통 즉시~1일 소요**

---

## 11. 프로젝트 구조 (예시)

```
life-environment-map/
+-- mobile/                     # React Native (Expo)
|   +-- app/
|   |   +-- (tabs)/
|   |   |   +-- index.tsx       # 메인 지도
|   |   |   +-- noise.tsx       # 소음지도
|   |   |   +-- bloom.tsx       # 벚꽃/단풍
|   |   |   +-- settings.tsx    # 설정
|   |   +-- trail/[id].tsx      # 산책로 상세
|   +-- components/
|   +-- package.json
|
+-- backend/                    # Python FastAPI
|   +-- app/
|   |   +-- main.py             # FastAPI 앱
|   |   +-- routers/
|   |   |   +-- trails.py
|   |   |   +-- noise.py
|   |   |   +-- bloom.py
|   |   |   +-- weather.py
|   |   +-- models/             # DB 모델
|   |   +-- services/           # 비즈니스 로직
|   |   +-- collectors/         # 데이터 수집기
|   |   |   +-- weather_collector.py
|   |   |   +-- air_quality_collector.py
|   |   |   +-- traffic_collector.py
|   |   |   +-- trail_collector.py
|   |   +-- ml/                 # 예측 모델
|   |   |   +-- congestion_model.py
|   |   |   +-- noise_model.py
|   |   |   +-- bloom_model.py
|   +-- requirements.txt
|   +-- docker-compose.yml      # PostgreSQL + Redis
|
+-- data/                       # 원본 데이터, GPX 파일 등
+-- docs/                       # 문서
+-- PLAN.md                     # 이 파일
```
