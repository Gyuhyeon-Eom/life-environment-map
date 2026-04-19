"""
산책로/등산로 데이터 수집
- 전국길관광정보 표준데이터 (공공데이터포털)
- 국토교통부 등산로 API

API 문서: https://www.data.go.kr/data/15017321/standard.do
"""

import httpx
from typing import Optional
from ..config import settings


# 한국관광공사 Tour API (산책로/둘레길 정보)
TOUR_BASE_URL = "http://apis.data.go.kr/B551011/KorService2"

# API v2 엔드포인트 매핑 (모두 뒤에 2가 붙음)
EP_LOCATION = "locationBasedList2"
EP_SEARCH = "searchKeyword2"
EP_AREA = "areaBasedList2"
EP_DETAIL = "detailCommon2"
EP_DETAIL_INFO = "detailInfo2"


async def search_trails(
    lat: float,
    lng: float,
    radius: int = 5000,
    page: int = 1,
    size: int = 20,
) -> Optional[dict]:
    """
    위치 기반 산책로/관광코스 검색

    Args:
        lat: 위도
        lng: 경도
        radius: 검색 반경 (m), 기본 5km
        page: 페이지
        size: 한 페이지당 결과 수

    Returns:
        dict: {items: [...], total_count: int}
    """
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "numOfRows": size,
        "pageNo": page,
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "listYN": "Y",
        "arrange": "E",  # 거리순
        "mapX": lng,
        "mapY": lat,
        "radius": radius,
        # contentTypeId: 12=관광지, 14=문화시설, 15=축제, 25=여행코스, 28=레포츠
        # 산책로 관련은 25(여행코스) + 12(관광지)
        "contentTypeId": "25",
    }

    # serviceKey는 이미 인코딩된 상태이므로 직접 URL에 붙여야 함
    query_parts = [f"serviceKey={settings.DATA_GO_KR_API_KEY}"]
    for k, v in params.items():
        if k != "serviceKey":
            query_parts.append(f"{k}={v}")
    url = f"{TOUR_BASE_URL}/locationBasedList2?{'&'.join(query_parts)}"

    print(f"[DEBUG] Tour API URL: {url[:150]}...")

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)

        print(f"[DEBUG] Tour API status: {resp.status_code}")
        print(f"[DEBUG] Tour API response: {resp.text[:300]}")

        if resp.status_code != 200:
            print(f"Tour API error: {resp.status_code} - {resp.text[:200]}")
            return {"items": [], "total_count": 0}

        try:
            data = resp.json()
        except Exception:
            print(f"Tour API JSON parse error: {resp.text[:200]}")
            return {"items": [], "total_count": 0}

    # API 에러 응답 체크
    header = data.get("response", {}).get("header", {})
    result_code = header.get("resultCode", "")
    print(f"[DEBUG] header: {header}, resultCode: '{result_code}'")

    if result_code not in ("0000", ""):
        print(f"Tour API result error: {header}")
        return {"items": [], "total_count": 0}

    body = data.get("response", {}).get("body", {})
    total = body.get("totalCount", 0)
    items_data = body.get("items", {})
    print(f"[DEBUG] totalCount: {total}, items type: {type(items_data)}")

    if not items_data or items_data == "":
        return {"items": [], "total_count": 0}

    raw_items = items_data.get("item", [])
    if isinstance(raw_items, dict):
        raw_items = [raw_items]

    items = []
    for item in raw_items:
        items.append(
            {
                "id": item.get("contentid"),
                "title": item.get("title"),
                "address": item.get("addr1", "") + " " + item.get("addr2", ""),
                "image": item.get("firstimage") or item.get("firstimage2"),
                "latitude": float(item.get("mapy", 0)),
                "longitude": float(item.get("mapx", 0)),
                "distance": float(item.get("dist", 0)),  # 현재 위치에서 거리(m)
                "tel": item.get("tel"),
            }
        )

    return {"items": items, "total_count": total}


async def get_trail_detail(content_id: str) -> Optional[dict]:
    """
    산책로/코스 상세 정보 조회

    Args:
        content_id: 콘텐츠 ID

    Returns:
        dict: 상세 정보
    """
    # 기본 정보
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": "25",
        "defaultYN": "Y",
        "firstImageYN": "Y",
        "areacodeYN": "Y",
        "addrinfoYN": "Y",
        "overviewYN": "Y",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{TOUR_BASE_URL}/detailCommon2",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    items = (
        data.get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )
    if not items:
        return None

    item = items[0] if isinstance(items, list) else items

    detail = {
        "id": content_id,
        "title": item.get("title"),
        "address": item.get("addr1", "") + " " + item.get("addr2", ""),
        "overview": item.get("overview", "").replace("<br>", "\n").replace("<br />", "\n"),
        "image": item.get("firstimage") or item.get("firstimage2"),
        "homepage": item.get("homepage"),
        "tel": item.get("tel"),
        "latitude": float(item.get("mapy", 0)),
        "longitude": float(item.get("mapx", 0)),
    }

    # 코스 반복 정보 (구간별 상세)
    course_params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": "25",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{TOUR_BASE_URL}/detailInfo2",
            params=params,
        )
        resp.raise_for_status()
        course_data = resp.json()

    course_items = (
        course_data.get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )

    if course_items and course_items != "":
        if isinstance(course_items, dict):
            course_items = [course_items]
        detail["courses"] = [
            {
                "number": c.get("subnum"),
                "name": c.get("subname"),
                "overview": c.get("subdetailoverview", "")
                .replace("<br>", "\n")
                .replace("<br />", "\n"),
                "image": c.get("subdetailimg"),
            }
            for c in course_items
        ]
    else:
        detail["courses"] = []

    return detail


async def search_walking_trails(
    keyword: str = "",
    area_code: str = "",
    page: int = 1,
    size: int = 20,
) -> Optional[dict]:
    """
    키워드로 산책로/코스 검색

    Args:
        keyword: 검색어
        area_code: 지역 코드 (1=서울, 2=인천, 3=대전, ...)
        page: 페이지
        size: 한 페이지당 결과 수
    """
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "numOfRows": size,
        "pageNo": page,
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "listYN": "Y",
        "arrange": "R",  # 제목순
        "contentTypeId": "25",
    }

    if keyword:
        params["keyword"] = keyword

    if area_code:
        params["areaCode"] = area_code

    url = f"{TOUR_BASE_URL}/searchKeyword2" if keyword else f"{TOUR_BASE_URL}/areaBasedList2"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    body = data.get("response", {}).get("body", {})
    total = body.get("totalCount", 0)
    items_data = body.get("items", {})

    if not items_data or items_data == "":
        return {"items": [], "total_count": 0}

    raw_items = items_data.get("item", [])
    if isinstance(raw_items, dict):
        raw_items = [raw_items]

    items = []
    for item in raw_items:
        items.append(
            {
                "id": item.get("contentid"),
                "title": item.get("title"),
                "address": item.get("addr1", "") + " " + item.get("addr2", ""),
                "image": item.get("firstimage") or item.get("firstimage2"),
                "latitude": float(item.get("mapy", 0)),
                "longitude": float(item.get("mapx", 0)),
            }
        )

    return {"items": items, "total_count": total}
