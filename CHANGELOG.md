# Changelog

## v0.1.0 (2026-04-19) - 프로젝트 시작

3시간 만에 기획부터 동작하는 프로토타입까지.

### Backend

**API 연동 (4종)**
- 기상청 단기예보: 현재 날씨 (기온/습도/풍속/강수) + 시간별 예보
- 에어코리아 대기오염: 실시간 미세먼지/오존/대기질 + 예보
- 한국관광공사 KorService2: 위치 기반 산책로/코스 검색 + 상세 + 키워드 검색
- 기상청 ASOS: 일별 기온 데이터 (벚꽃/단풍 예측용, API 키 승인 대기)

**예측 모델**
- 벚꽃 개화 예측: 적산온도 방식 (2월 1일부터 일평균기온 누적)
- 단풍 예측: 일최저기온 5도 이하 누적일수 기반
- 명소 9곳: 여의도, 석촌호수, 진해, 경주, 제주, 하동, 내장산, 설악산, 북한산

**API 엔드포인트 (10개)**
- `GET /api/v1/weather` - 현재 날씨
- `GET /api/v1/weather/forecast` - 날씨 예보
- `GET /api/v1/air-quality` - 실시간 대기질
- `GET /api/v1/air-quality/forecast` - 대기질 예보
- `GET /api/v1/trails` - 위치 기반 산책로 검색
- `GET /api/v1/trails/search` - 키워드 검색
- `GET /api/v1/trails/{id}` - 산책로 상세
- `GET /api/v1/bloom/spots` - 벚꽃/단풍 명소 예측
- `GET /api/v1/bloom/spots/{id}` - 명소 상세
- `GET /api/v1/bloom/ranking` - 진행률 순위

### Frontend

**화면 (5개)**
- 홈: 지도 + 바텀시트 (친구 산책 카드 + 빠른 액션 4개)
- 산책로: 2열 그리드 카드 + 키워드 검색
- 산책로 상세: 히어로 이미지 + 코스 타임라인 + 현지 날씨
- 개화 현황: 벚꽃/단풍 필터 + 진행률 카드
- 사진공유/친구: 준비중 화면 (예정 기능 소개)

**디자인**
- 앱 이름: 걸어볼까
- 마스코트: 배낭 멘 곰 (AI 생성)
- 커스텀 아이콘 4종 (산책로/개화/카메라/친구)
- 컬러 테마: 자연 녹색(#2D6A4F) 기반
- 둥글둥글 라운드 디자인 (당근마켓 스타일)

### Infra

- GitHub 레포: https://github.com/Gyuhyeon-Eom/life-environment-map
- 개발환경: Windows PC (IntelliJ) + Expo 웹 미리보기
- 백엔드: FastAPI (uvicorn)
- 공공데이터 API 키 4종 신청/승인

### 문서

- README.md: 프로젝트 소개 + 실행 방법
- PLAN.md v2: 기획서 (화면 구성, 로드맵, 역할 분담)
- API_SPEC.md: 외부/내부 API 전체 명세
- CHANGELOG.md: 이 파일

### 알려진 이슈

- ASOS API 키 승인 대기 중 (벚꽃 예측 데이터 없음)
- 웹에서 실제 지도 미지원 (placeholder 표시)
- 프로젝트가 iCloud Drive 안에 위치 (--reload 이슈)
- 커뮤니티 기능 미구현 (더미 데이터)

### 다음 할 일 (v0.2.0)

- ASOS API 연동 완료 (벚꽃 실데이터)
- 산책로 카드에 대기질 태그 표시
- 산책로 데이터소스 확장 (등산로 GPX, 둘레길)
- 커뮤니티 백엔드 (회원가입, 사진 업로드, 친구)
- UI 고도화 + 네이버 지도 검토
- 프로젝트 iCloud 밖으로 이동
