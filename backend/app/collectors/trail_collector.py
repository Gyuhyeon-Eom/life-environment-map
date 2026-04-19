"""
산책로/등산로 데이터 수집
- 한국관광공사 Tour API (KorService2)
"""

import httpx
from urllib.parse import urlencode
from typing import Optional
from ..config import settings


TOUR_BASE_URL = "http://apis.data.go.kr/B551011/KorService2"


def _build_url(endpoint: str, params: dict) -> str:
    """serviceKey 이중 인코딩 방지를 위해 URL 직접 조합"""
    base = f"{TOUR_BASE_URL}/{endpoint}?serviceKey={settings.DATA_GO_KR_API_KEY}"
    if params:
        base += "&" + "&".join(f"{k}={v}" for k, v in params.items())
    return base


async def _api_call(endpoint: str, params: dict) -> Optional[dict]:
    """공통 API 호출"""
    url = _build_url(endpoint, params)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)

        if resp.status_code != 200:
            print(f"Tour API error: {resp.status_code}")
            return None

        try:
            data = resp.json()
        except Exception:
            print(f"Tour API JSON error: {resp.text[:200]}")
            return None

    # v2 에러 체크
    if data.get("resultCode") and data["resultCode"] != "0000":
        print(f"Tour API v2 error: {data.get('resultMsg')}")
        return None

    return data


async def search_trails(
    lat: float,
    lng: float,
    radius: int = 5000,
    page: int = 1,
    size: int = 20,
) -> Optional[dict]:
    """위치 기반 산책로/관광코스 검색"""
    params = {
        "numOfRows": size,
        "pageNo": page,
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "arrange": "E",
        "mapX": lng,
        "mapY": lat,
        "radius": radius,
        "contentTypeId": "25",
    }

    data = await _api_call("locationBasedList2", params)
    if not data:
        return {"items": [], "total_count": 0}

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
        items.append({
            "id": item.get("contentid"),
            "title": item.get("title"),
            "address": (item.get("addr1", "") + " " + item.get("addr2", "")).strip(),
            "image": item.get("firstimage") or item.get("firstimage2"),
            "latitude": float(item.get("mapy", 0)),
            "longitude": float(item.get("mapx", 0)),
            "distance": float(item.get("dist", 0)),
            "tel": item.get("tel"),
        })

    return {"items": items, "total_count": total}


async def get_trail_detail(content_id: str) -> Optional[dict]:
    """산책로/코스 상세 정보 조회"""
    params = {
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": "25",
        "defaultYN": "Y",
        "firstImageYN": "Y",
        "areacodeYN": "Y",
        "overviewYN": "Y",
    }

    data = await _api_call("detailCommon2", params)
    if not data:
        return None

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
        "address": (item.get("addr1", "") + " " + item.get("addr2", "")).strip(),
        "overview": item.get("overview", "").replace("<br>", "\n").replace("<br />", "\n"),
        "image": item.get("firstimage") or item.get("firstimage2"),
        "homepage": item.get("homepage"),
        "tel": item.get("tel"),
        "latitude": float(item.get("mapy", 0)),
        "longitude": float(item.get("mapx", 0)),
    }

    # 코스 반복 정보
    course_params = {
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "contentId": content_id,
        "contentTypeId": "25",
    }

    course_data = await _api_call("detailInfo2", course_params)

    if course_data:
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
    else:
        detail["courses"] = []

    return detail


async def search_walking_trails(
    keyword: str = "",
    area_code: str = "",
    page: int = 1,
    size: int = 20,
) -> Optional[dict]:
    """키워드로 산책로/코스 검색"""
    params = {
        "numOfRows": size,
        "pageNo": page,
        "MobileOS": "ETC",
        "MobileApp": "LifeEnvMap",
        "_type": "json",
        "arrange": "R",
        "contentTypeId": "25",
    }

    if keyword:
        params["keyword"] = keyword

    if area_code:
        params["areaCode"] = area_code

    endpoint = "searchKeyword2" if keyword else "areaBasedList2"

    data = await _api_call(endpoint, params)
    if not data:
        return {"items": [], "total_count": 0}

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
        items.append({
            "id": item.get("contentid"),
            "title": item.get("title"),
            "address": (item.get("addr1", "") + " " + item.get("addr2", "")).strip(),
            "image": item.get("firstimage") or item.get("firstimage2"),
            "latitude": float(item.get("mapy", 0)),
            "longitude": float(item.get("mapx", 0)),
        })

    return {"items": items, "total_count": total}
