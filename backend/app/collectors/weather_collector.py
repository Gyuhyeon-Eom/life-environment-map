"""
기상청 단기예보 API 연동
- 초단기실황: 현재 기온, 습도, 풍속 등
- 단기예보: 향후 날씨 예보

API 문서: https://www.data.go.kr/data/15084084/openapi.do
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional
from ..config import settings


BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"


def _get_base_datetime() -> tuple[str, str]:
    """
    단기예보 발표 시각 계산.
    발표 시각: 0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300
    API 제공 시간은 발표 시각 + 10분 이후
    """
    now = datetime.now()
    base_times = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"]

    # 현재 시각에서 10분 빼서 가장 가까운 발표 시각 찾기
    current = now - timedelta(minutes=10)
    current_hhmm = current.strftime("%H%M")

    base_time = "2300"  # 기본값 (전날 23시)
    base_date = (current - timedelta(days=1)).strftime("%Y%m%d")

    for bt in base_times:
        if current_hhmm >= bt:
            base_time = bt
            base_date = current.strftime("%Y%m%d")

    return base_date, base_time


def _get_ultra_srt_datetime() -> tuple[str, str]:
    """
    초단기실황 발표 시각 계산.
    매시간 정시 발표, 40분 이후 제공
    """
    now = datetime.now()
    if now.minute < 40:
        now = now - timedelta(hours=1)
    base_date = now.strftime("%Y%m%d")
    base_time = now.strftime("%H00")
    return base_date, base_time


async def get_current_weather(nx: int, ny: int) -> Optional[dict]:
    """
    초단기실황 조회 - 현재 날씨 정보

    Args:
        nx: 예보지점 X 좌표 (격자)
        ny: 예보지점 Y 좌표 (격자)

    Returns:
        dict: {temperature, humidity, wind_speed, rain_type, ...}
    """
    base_date, base_time = _get_ultra_srt_datetime()

    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "numOfRows": "10",
        "pageNo": "1",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BASE_URL}/getUltraSrtNcst",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    if not items:
        return None

    result = {}
    for item in items:
        category = item["category"]
        value = item["obsrValue"]

        if category == "T1H":
            result["temperature"] = float(value)  # 기온 (℃)
        elif category == "REH":
            result["humidity"] = float(value)  # 습도 (%)
        elif category == "WSD":
            result["wind_speed"] = float(value)  # 풍속 (m/s)
        elif category == "RN1":
            result["rainfall"] = float(value)  # 1시간 강수량 (mm)
        elif category == "PTY":
            # 강수형태: 0=없음, 1=비, 2=비/눈, 3=눈, 5=빗방울, 6=빗방울눈날림, 7=눈날림
            result["rain_type"] = int(value)
        elif category == "VEC":
            result["wind_direction"] = float(value)  # 풍향 (deg)

    result["base_date"] = base_date
    result["base_time"] = base_time
    result["nx"] = nx
    result["ny"] = ny

    return result


async def get_forecast(nx: int, ny: int) -> Optional[list[dict]]:
    """
    단기예보 조회 - 향후 날씨 예보

    Args:
        nx: 예보지점 X 좌표 (격자)
        ny: 예보지점 Y 좌표 (격자)

    Returns:
        list[dict]: 시간대별 예보 정보
    """
    base_date, base_time = _get_base_datetime()

    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "numOfRows": "300",
        "pageNo": "1",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{BASE_URL}/getVilageFcst",
            params=params,
        )
        resp.raise_for_status()
        data = resp.json()

    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    if not items:
        return None

    # 시간대별로 그룹핑
    forecasts = {}
    for item in items:
        key = f"{item['fcstDate']}_{item['fcstTime']}"
        if key not in forecasts:
            forecasts[key] = {
                "date": item["fcstDate"],
                "time": item["fcstTime"],
            }

        category = item["category"]
        value = item["fcstValue"]

        if category == "TMP":
            forecasts[key]["temperature"] = float(value)
        elif category == "POP":
            forecasts[key]["rain_probability"] = int(value)
        elif category == "PTY":
            forecasts[key]["rain_type"] = int(value)
        elif category == "REH":
            forecasts[key]["humidity"] = float(value)
        elif category == "WSD":
            forecasts[key]["wind_speed"] = float(value)
        elif category == "SKY":
            # 하늘상태: 1=맑음, 3=구름많음, 4=흐림
            forecasts[key]["sky"] = int(value)

    return sorted(forecasts.values(), key=lambda x: f"{x['date']}_{x['time']}")


# 위경도 -> 격자 좌표 변환 (기상청 격자 변환 공식)
import math


def latlon_to_grid(lat: float, lon: float) -> tuple[int, int]:
    """
    위경도를 기상청 격자 좌표로 변환

    Args:
        lat: 위도
        lon: 경도

    Returns:
        (nx, ny): 격자 좌표
    """
    RE = 6371.00877  # 지구 반경 (km)
    GRID = 5.0  # 격자 간격 (km)
    SLAT1 = 30.0  # 표준 위도 1
    SLAT2 = 60.0  # 표준 위도 2
    OLON = 126.0  # 기준점 경도
    OLAT = 38.0  # 기준점 위도
    XO = 43  # 기준점 X 좌표
    YO = 136  # 기준점 Y 좌표

    DEGRAD = math.pi / 180.0

    re = RE / GRID
    slat1 = SLAT1 * DEGRAD
    slat2 = SLAT2 * DEGRAD
    olon = OLON * DEGRAD
    olat = OLAT * DEGRAD

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(
        math.pi * 0.25 + slat1 * 0.5
    )
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)

    ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
    ra = re * sf / math.pow(ra, sn)
    theta = lon * DEGRAD - olon
    if theta > math.pi:
        theta -= 2.0 * math.pi
    if theta < -math.pi:
        theta += 2.0 * math.pi
    theta *= sn

    nx = int(ra * math.sin(theta) + XO + 0.5)
    ny = int(ro - ra * math.cos(theta) + YO + 0.5)

    return nx, ny
