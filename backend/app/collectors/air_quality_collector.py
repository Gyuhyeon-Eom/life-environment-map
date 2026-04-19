"""
에어코리아 대기오염정보 API 연동
- 측정소별 실시간 대기오염 정보 조회
- 미세먼지(PM10, PM2.5), 오존, 통합대기환경지수

API 문서: https://www.data.go.kr/data/15073861/openapi.do
"""

import httpx
from typing import Optional
from ..config import settings


BASE_URL = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc"


async def get_nearby_station(tm_x: float, tm_y: float) -> Optional[dict]:
    """
    TM 좌표 기반 가까운 측정소 조회

    Args:
        tm_x: TM X 좌표
        tm_y: TM Y 좌표

    Returns:
        dict: {station_name, addr, distance}
    """
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "returnType": "json",
        "tmX": tm_x,
        "tmY": tm_y,
        "ver": "1.1",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BASE_URL}/getNearbyMsrstnList",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("response", {}).get("body", {}).get("items", [])
    if not items:
        return None

    station = items[0]
    return {
        "station_name": station.get("stationName"),
        "addr": station.get("addr"),
        "distance": float(station.get("tm", 0)),
    }


async def get_realtime_air_quality(station_name: str) -> Optional[dict]:
    """
    측정소별 실시간 대기오염 정보 조회

    Args:
        station_name: 측정소 이름 (예: "종로구")

    Returns:
        dict: {pm10, pm25, o3, co, no2, so2, grade, ...}
    """
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "returnType": "json",
        "numOfRows": "1",
        "pageNo": "1",
        "stationName": station_name,
        "dataTerm": "DAILY",
        "ver": "1.5",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BASE_URL}/getMsrstnAcctoRltmMesureDnsty",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("response", {}).get("body", {}).get("items", [])
    if not items:
        return None

    item = items[0]

    def safe_float(val):
        try:
            return float(val) if val and val != "-" else None
        except (ValueError, TypeError):
            return None

    def safe_int(val):
        try:
            return int(val) if val and val != "-" else None
        except (ValueError, TypeError):
            return None

    grade_map = {1: "좋음", 2: "보통", 3: "나쁨", 4: "매우나쁨"}

    pm10_grade = safe_int(item.get("pm10Grade"))
    pm25_grade = safe_int(item.get("pm25Grade"))
    khai_grade = safe_int(item.get("khaiGrade"))

    return {
        "station_name": station_name,
        "data_time": item.get("dataTime"),
        "pm10": safe_float(item.get("pm10Value")),  # 미세먼지 (㎍/㎥)
        "pm25": safe_float(item.get("pm25Value")),  # 초미세먼지 (㎍/㎥)
        "o3": safe_float(item.get("o3Value")),  # 오존 (ppm)
        "co": safe_float(item.get("coValue")),  # 일산화탄소 (ppm)
        "no2": safe_float(item.get("no2Value")),  # 이산화질소 (ppm)
        "so2": safe_float(item.get("so2Value")),  # 아황산가스 (ppm)
        "pm10_grade": grade_map.get(pm10_grade, "알수없음"),
        "pm25_grade": grade_map.get(pm25_grade, "알수없음"),
        "khai_value": safe_float(item.get("khaiValue")),  # 통합대기환경지수
        "khai_grade": grade_map.get(khai_grade, "알수없음"),
    }


async def get_air_quality_forecast() -> Optional[list[dict]]:
    """
    대기질 예보 정보 조회 (미세먼지/오존)

    Returns:
        list[dict]: 지역별 예보 정보
    """
    from datetime import datetime

    today = datetime.now().strftime("%Y-%m-%d")

    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "returnType": "json",
        "numOfRows": "100",
        "pageNo": "1",
        "searchDate": today,
        "InformCode": "PM10",  # PM10, PM25, O3
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BASE_URL}/getMinuDustFrcstDspth",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("response", {}).get("body", {}).get("items", [])
    if not items:
        return None

    forecasts = []
    for item in items:
        forecasts.append(
            {
                "date": item.get("informData"),
                "cause": item.get("informCause"),
                "overall": item.get("informOverall"),
                "grade": item.get("informGrade"),  # 지역별 등급 문자열
            }
        )

    return forecasts
