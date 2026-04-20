"""
날씨 + 대기질 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Query

from ..collectors.weather_collector import (
    get_current_weather,
    get_forecast,
    latlon_to_grid,
)
from ..collectors.air_quality_collector import (
    get_realtime_air_quality,
    get_air_quality_forecast,
)
from ..services.walk_score import calculate_walk_score, find_best_walk_time

router = APIRouter(prefix="/api/v1", tags=["weather"])


@router.get("/weather")
async def current_weather(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
):
    """현재 날씨 조회 (위경도 기반)"""
    nx, ny = latlon_to_grid(lat, lng)

    weather = await get_current_weather(nx, ny)
    if not weather:
        raise HTTPException(status_code=404, detail="날씨 데이터를 찾을 수 없습니다")

    return {"status": "ok", "data": weather, "grid": {"nx": nx, "ny": ny}}


@router.get("/weather/forecast")
async def weather_forecast(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
):
    """날씨 예보 조회"""
    nx, ny = latlon_to_grid(lat, lng)

    forecast = await get_forecast(nx, ny)
    if not forecast:
        raise HTTPException(status_code=404, detail="예보 데이터를 찾을 수 없습니다")

    return {"status": "ok", "data": forecast, "count": len(forecast)}


@router.get("/walk-score")
async def walk_score(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
    station: str = Query("", description="대기질 측정소 (없으면 PM2.5 제외)"),
):
    """현재 산책 쾌적도 점수 + 최적 시간 추천"""
    nx, ny = latlon_to_grid(lat, lng)

    # 현재 날씨
    weather = await get_current_weather(nx, ny)
    if not weather:
        raise HTTPException(status_code=404, detail="날씨 데이터를 가져올 수 없습니다")

    # 대기질 (선택)
    pm25 = None
    if station:
        air = await get_realtime_air_quality(station)
        if air and air.get("pm25") is not None:
            pm25 = air["pm25"]

    # 현재 쾌적도
    current_score = calculate_walk_score(
        temperature=weather.get("temperature", 20),
        humidity=weather.get("humidity", 50),
        pm25=pm25,
        wind_speed=weather.get("wind_speed", 2),
    )

    # 시간별 예보 기반 최적 시간
    forecast = await get_forecast(nx, ny)
    best_time = None
    if forecast:
        best_time = find_best_walk_time(forecast)

    return {
        "status": "ok",
        "current": {
            "score": current_score["total_score"],
            "grade": current_score["grade"],
            "message": current_score["message"],
            "breakdown": current_score["breakdown"],
        },
        "best_time": best_time,
        "weather": weather,
    }


@router.get("/air-quality")
async def air_quality(
    station: str = Query(..., description="측정소 이름 (예: 종로구)"),
):
    """실시간 대기질 조회 (측정소 기반)"""
    data = await get_realtime_air_quality(station)
    if not data:
        raise HTTPException(
            status_code=404, detail=f"'{station}' 측정소 데이터를 찾을 수 없습니다"
        )

    return {"status": "ok", "data": data}


@router.get("/air-quality/forecast")
async def air_quality_forecast():
    """대기질 예보 조회"""
    data = await get_air_quality_forecast()
    if not data:
        raise HTTPException(status_code=404, detail="예보 데이터를 찾을 수 없습니다")

    return {"status": "ok", "data": data, "count": len(data)}
