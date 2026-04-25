"""
산책로/등산로 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..collectors.trail_collector import (
    search_trails,
    get_trail_detail,
    search_walking_trails,
)
from ..collectors.osm_trail_collector import get_osm_trails
from ..collectors.poi_collector import get_nearby_pois, POI_CATEGORIES
from ..collectors.trail_classifier import classify_trails_batch, TRAIL_MOODS
from ..collectors.llm_classifier import classify_trails_batch_llm, get_cache_stats
from ..collectors.weather_collector import get_current_weather, latlon_to_grid
from ..collectors.air_quality_collector import get_realtime_air_quality

router = APIRouter(prefix="/api/v1/trails", tags=["trails"])


@router.get("")
async def list_trails(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
    radius: int = Query(5000, description="검색 반경 (m)"),
    page: int = Query(1, description="페이지"),
    size: int = Query(20, description="페이지당 결과 수"),
):
    """위치 기반 주변 산책로/코스 검색"""
    result = await search_trails(lat, lng, radius, page, size)
    if not result:
        raise HTTPException(status_code=404, detail="산책로를 찾을 수 없습니다")

    return {
        "status": "ok",
        "data": result["items"],
        "total_count": result["total_count"],
        "page": page,
        "size": size,
    }


@router.get("/search")
async def search(
    q: str = Query("", description="검색어"),
    area: str = Query("", description="지역코드 (1=서울, 2=인천, ...)"),
    page: int = Query(1, description="페이지"),
    size: int = Query(20, description="페이지당 결과 수"),
):
    """키워드로 산책로 검색"""
    result = await search_walking_trails(q, area, page, size)
    if not result:
        raise HTTPException(status_code=404, detail="검색 결과가 없습니다")

    return {
        "status": "ok",
        "data": result["items"],
        "total_count": result["total_count"],
    }


@router.get("/nearby-paths")
async def nearby_paths(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
    radius: int = Query(3000, description="검색 반경 (m), 최대 5000"),
    mood: Optional[str] = Query(None, description="산책 유형 필터 (healing,date,family,workout,pet,night)"),
    classifier: str = Query("rule", description="분류기 선택 (llm 또는 rule). ollama 필요 시 llm"),
):
    """OSM 기반 주변 산책로/보행로 geometry 조회 (유형 분류 포함)"""
    radius = min(radius, 5000)
    result = await get_osm_trails(lat, lng, radius)
    if not result:
        return {"status": "ok", "data": [], "count": 0, "moods": TRAIL_MOODS}

    trails = result["trails"]

    # POI 데이터로 분류 정확도 향상 (선택적)
    poi_result = await get_nearby_pois(lat, lng, min(radius, 1500))
    poi_map = _build_poi_map(trails, poi_result) if poi_result else None

    # 분류 적용 (LLM 또는 rule-based)
    if classifier == "llm":
        try:
            trails = await classify_trails_batch_llm(trails, poi_map)
        except Exception as e:
            # LLM 실패 시 rule-based fallback
            import logging
            logging.getLogger(__name__).warning(f"LLM 분류 실패, rule-based fallback: {e}")
            trails = classify_trails_batch(trails, poi_map)
    else:
        trails = classify_trails_batch(trails, poi_map)

    # mood 필터
    if mood and mood in TRAIL_MOODS:
        trails = [t for t in trails if mood in t.get("moods", [])]

    return {
        "status": "ok",
        "data": trails,
        "count": len(trails),
        "moods": TRAIL_MOODS,
        "classifier": classifier,
    }


@router.get("/moods")
async def list_moods():
    """산책 유형 목록"""
    return {"status": "ok", "data": TRAIL_MOODS}


@router.get("/classifier/stats")
async def classifier_stats():
    """LLM 분류 캐시 상태"""
    return {"status": "ok", "data": get_cache_stats()}


def _build_poi_map(
    trails: list, poi_result: dict
) -> dict:
    """각 산책로 중심점 기준 반경 300m 내 POI 카운트 매핑"""
    import math

    pois = poi_result.get("pois", [])
    if not pois:
        return {}

    poi_map = {}

    for trail in trails:
        geom = trail.get("geometry", [])
        if not geom:
            continue

        # 산책로 중심점
        mid = geom[len(geom) // 2]
        clat, clng = mid[0], mid[1]

        counts: dict = {}
        for poi in pois:
            plat, plng = poi.get("lat", 0), poi.get("lng", 0)
            # 간이 거리 (약 300m 이내)
            dlat = (plat - clat) * 111000
            dlng = (plng - clng) * 111000 * math.cos(math.radians(clat))
            dist = math.sqrt(dlat**2 + dlng**2)
            if dist <= 300:
                cat = poi.get("category", "")
                counts[cat] = counts.get(cat, 0) + 1

        if counts:
            poi_map[trail.get("id", "")] = counts

    return poi_map


@router.get("/nearby-pois")
async def nearby_pois(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
    radius: int = Query(1000, description="검색 반경 (m), 최대 3000"),
    categories: Optional[str] = Query(
        None,
        description="카테고리 필터 (쉼표 구분: cafe,toilet,convenience,bench,drinking_water,parking,restaurant,pharmacy)",
    ),
):
    """OSM 기반 주변 편의시설(SOC) 조회"""
    radius = min(radius, 3000)
    cat_list = None
    if categories:
        cat_list = [c.strip() for c in categories.split(",") if c.strip() in POI_CATEGORIES]

    result = await get_nearby_pois(lat, lng, radius, cat_list or None)
    if not result:
        return {"status": "ok", "data": [], "count": 0, "categories": {}}

    return {
        "status": "ok",
        "data": result["pois"],
        "count": result["count"],
        "categories": result["categories"],
    }


@router.get("/{content_id}")
async def trail_detail(content_id: str):
    """산책로 상세 정보 + 현재 날씨/대기질"""
    detail = await get_trail_detail(content_id)
    if not detail:
        raise HTTPException(status_code=404, detail="산책로를 찾을 수 없습니다")

    # 해당 위치의 현재 날씨도 함께 제공
    weather = None
    air_quality = None

    if detail.get("latitude") and detail.get("longitude"):
        try:
            nx, ny = latlon_to_grid(detail["latitude"], detail["longitude"])
            weather = await get_current_weather(nx, ny)
        except Exception:
            pass

    detail["weather"] = weather
    detail["air_quality"] = air_quality

    return {"status": "ok", "data": detail}
