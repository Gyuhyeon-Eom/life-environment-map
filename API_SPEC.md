# API 명세서

## 외부 데이터소스 (공공데이터 API)

### 1. 기상청 단기예보 (VilageFcstInfoService_2.0)

| 항목 | 내용 |
|------|------|
| 제공기관 | 기상청 |
| 엔드포인트 | `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0` |
| 인증 | 공공데이터포털 API 키 (query param: serviceKey) |
| 비용 | 무료 |

#### 사용 API

| 기능 | 경로 | 용도 |
|------|------|------|
| 초단기실황 | `getUltraSrtNcst` | 현재 기온, 습도, 풍속, 강수 |
| 단기예보 | `getVilageFcst` | 시간별 날씨 예보 |

#### 주요 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| serviceKey | string | API 인증키 |
| base_date | string | 발표일 (YYYYMMDD) |
| base_time | string | 발표시각 (HHMM) |
| nx | int | 예보지점 X 격자좌표 |
| ny | int | 예보지점 Y 격자좌표 |
| dataType | string | JSON 또는 XML |

#### 응답 카테고리 코드

| 코드 | 의미 | 단위 |
|------|------|------|
| T1H | 기온 | C |
| REH | 습도 | % |
| WSD | 풍속 | m/s |
| RN1 | 1시간 강수량 | mm |
| PTY | 강수형태 | 코드 (0=없음, 1=비, 2=비/눈, 3=눈) |
| SKY | 하늘상태 | 코드 (1=맑음, 3=구름많음, 4=흐림) |
| POP | 강수확률 | % |

#### 격자좌표 변환

위경도를 기상청 격자좌표로 변환 필요. `weather_collector.py`의 `latlon_to_grid()` 함수 사용.

---

### 2. 에어코리아 대기오염정보 (ArpltnInforInqireSvc)

| 항목 | 내용 |
|------|------|
| 제공기관 | 한국환경공단 |
| 엔드포인트 | `http://apis.data.go.kr/B552584/ArpltnInforInqireSvc` |
| 인증 | 공공데이터포털 API 키 |
| 비용 | 무료 |

#### 사용 API

| 기능 | 경로 | 용도 |
|------|------|------|
| 측정소별 실시간 | `getMsrstnAcctoRltmMesureDnsty` | 미세먼지, 오존 등 실시간 |
| 가까운 측정소 | `getNearbyMsrstnList` | TM좌표 기반 근접 측정소 |
| 대기질 예보 | `getMinuDustFrcstDspth` | 미세먼지 예보 |

#### 주요 응답 필드

| 필드 | 의미 | 단위 |
|------|------|------|
| pm10Value | 미세먼지 | ug/m3 |
| pm25Value | 초미세먼지 | ug/m3 |
| o3Value | 오존 | ppm |
| khaiValue | 통합대기환경지수 | - |
| pm10Grade | 미세먼지 등급 | 1=좋음, 2=보통, 3=나쁨, 4=매우나쁨 |

---

### 3. 한국관광공사 관광정보 (KorService2)

| 항목 | 내용 |
|------|------|
| 제공기관 | 한국관광공사 |
| 엔드포인트 | `http://apis.data.go.kr/B551011/KorService2` |
| 인증 | 공공데이터포털 API 키 |
| 비용 | 무료 |

#### 사용 API

| 기능 | 경로 | 용도 |
|------|------|------|
| 위치기반 조회 | `locationBasedList2` | 좌표 주변 관광지 검색 |
| 키워드 검색 | `searchKeyword2` | 키워드로 관광지 검색 |
| 공통정보 상세 | `detailCommon2` | 관광지 상세 정보 |
| 반복정보 상세 | `detailInfo2` | 코스 구간별 정보 |
| 지역기반 조회 | `areaBasedList2` | 지역별 관광지 목록 |

#### 주요 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| mapX | float | 경도 (X좌표) |
| mapY | float | 위도 (Y좌표) |
| radius | int | 검색반경 (m) |
| contentTypeId | string | 콘텐츠 타입 (25=여행코스) |
| arrange | string | 정렬 (E=거리순, R=제목순) |
| keyword | string | 검색어 |
| areaCode | string | 지역코드 (1=서울, 2=인천 ...) |

#### contentTypeId 코드

| 코드 | 의미 |
|------|------|
| 12 | 관광지 |
| 14 | 문화시설 |
| 15 | 축제/공연/행사 |
| 25 | 여행코스 |
| 28 | 레포츠 |
| 32 | 숙박 |
| 38 | 쇼핑 |
| 39 | 음식점 |

---

### 4. 기상청 ASOS 종관기상관측 (AsosDalyInfoService)

| 항목 | 내용 |
|------|------|
| 제공기관 | 기상청 |
| 엔드포인트 | `http://apis.data.go.kr/1360000/AsosDalyInfoService` |
| 인증 | 공공데이터포털 API 키 |
| 비용 | 무료 |
| 제한 | 전날까지의 데이터만 제공 |

#### 사용 API

| 기능 | 경로 | 용도 |
|------|------|------|
| 일별 기온 조회 | `getWthrDataList` | 벚꽃/단풍 예측용 일평균/최저/최고기온 |

#### 주요 파라미터

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| stnIds | string | 관측소 ID (108=서울, 184=제주 등) |
| startDt | string | 시작일 (YYYYMMDD) |
| endDt | string | 종료일 (YYYYMMDD, 전날까지) |
| dataCd | string | ASOS |
| dateCd | string | DAY |

#### 주요 관측소

| ID | 지역 | 용도 |
|----|------|------|
| 108 | 서울 | 여의도, 석촌호수, 북한산 |
| 155 | 창원 | 진해 |
| 138 | 포항 | 경주 |
| 184 | 제주 | 제주 전농로 |
| 192 | 진주 | 하동 |
| 101 | 춘천 | 설악산 |
| 245 | 정읍 | 내장산 |

---

## 내부 API (FastAPI 백엔드)

### Base URL: `http://127.0.0.1:9090`

### 날씨/대기질

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/weather?lat={lat}&lng={lng}` | 현재 날씨 |
| GET | `/api/v1/weather/forecast?lat={lat}&lng={lng}` | 날씨 예보 |
| GET | `/api/v1/air-quality?station={name}` | 실시간 대기질 |
| GET | `/api/v1/air-quality/forecast` | 대기질 예보 |

### 산책로

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/trails?lat={lat}&lng={lng}&radius={m}` | 위치 기반 산책로 |
| GET | `/api/v1/trails/search?q={keyword}` | 키워드 검색 |
| GET | `/api/v1/trails/{content_id}` | 상세 (날씨 포함) |

### 벚꽃/단풍

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/v1/bloom/spots?type={cherry\|autumn}` | 전체 명소 + 예측 |
| GET | `/api/v1/bloom/spots/{spot_id}` | 상세 + 일별 데이터 |
| GET | `/api/v1/bloom/ranking?type={cherry\|autumn}` | 진행률 순위 |

### Swagger UI

`http://127.0.0.1:9090/docs` 에서 모든 API 테스트 가능.

---

## 예측 모델

### 벚꽃 개화 예측 (적산온도 방식)

```
1. 2월 1일부터 일평균기온 누적 (양수만)
2. 누적값이 임계값(지역별) 도달 시 = 개화
3. 만개 = 개화 + 7일

개화 진행률(%) = (현재 적산온도 / 임계값) * 100

지역별 임계값:
- 제주: 130도
- 하동: 140도
- 진해: 145도
- 경주: 150도
- 서울: 165도
```

### 단풍 예측

```
1. 9월 1일부터 일최저기온 5도 이하 일수 누적
2. 누적일수가 임계값 도달 시 = 단풍 절정

지역별 임계값:
- 설악산: 7일
- 내장산: 10일
- 북한산: 12일
```

### 혼잡도 추정 모델 (예정)

```
혼잡도 점수 = 
  w1 * 시간대별 교통량(정규화)
+ w2 * 대중교통 승하차수(정규화)
+ w3 * 날씨 보정계수
+ w4 * 요일 보정계수(주말/공휴일)
+ w5 * 시설밀집도(정규화)

등급: 한산(0~30) / 보통(30~60) / 혼잡(60~100)
```
