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
