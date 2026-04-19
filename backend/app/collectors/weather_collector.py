"""
기상청 단기예보 API 연동
"""

import math
from datetime import datetime, timedelta
from typing import Optional
from ..utils import api_get


BASE_URL = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"


def _get_ultra_srt_datetime() -> tuple[str, str]:
    now = datetime.now()
    if now.minute < 40:
        now = now - timedelta(hours=1)
    return now.strftime("%Y%m%d"), now.strftime("%H00")


def _get_base_datetime() -> tuple[str, str]:
    now = datetime.now() - timedelta(minutes=10)
    base_times = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"]
    current_hhmm = now.strftime("%H%M")

    base_time = "2300"
    base_date = (now - timedelta(days=1)).strftime("%Y%m%d")

    for bt in base_times:
        if current_hhmm >= bt:
            base_time = bt
            base_date = now.strftime("%Y%m%d")

    return base_date, base_time


async def get_current_weather(nx: int, ny: int) -> Optional[dict]:
    """초단기실황 조회"""
    base_date, base_time = _get_ultra_srt_datetime()

    params = {
        "numOfRows": "10",
        "pageNo": "1",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    data = await api_get(BASE_URL, "getUltraSrtNcst", params)
    if not data:
        return None

    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    if not items:
        return None

    result = {}
    for item in items:
        cat = item["category"]
        val = item["obsrValue"]
        if cat == "T1H": result["temperature"] = float(val)
        elif cat == "REH": result["humidity"] = float(val)
        elif cat == "WSD": result["wind_speed"] = float(val)
        elif cat == "RN1": result["rainfall"] = float(val)
        elif cat == "PTY": result["rain_type"] = int(val)
        elif cat == "VEC": result["wind_direction"] = float(val)

    result.update({"base_date": base_date, "base_time": base_time, "nx": nx, "ny": ny})
    return result


async def get_forecast(nx: int, ny: int) -> Optional[list[dict]]:
    """단기예보 조회"""
    base_date, base_time = _get_base_datetime()

    params = {
        "numOfRows": "300",
        "pageNo": "1",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }

    data = await api_get(BASE_URL, "getVilageFcst", params)
    if not data:
        return None

    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
    if not items:
        return None

    forecasts = {}
    for item in items:
        key = f"{item['fcstDate']}_{item['fcstTime']}"
        if key not in forecasts:
            forecasts[key] = {"date": item["fcstDate"], "time": item["fcstTime"]}

        cat = item["category"]
        val = item["fcstValue"]
        if cat == "TMP": forecasts[key]["temperature"] = float(val)
        elif cat == "POP": forecasts[key]["rain_probability"] = int(val)
        elif cat == "PTY": forecasts[key]["rain_type"] = int(val)
        elif cat == "REH": forecasts[key]["humidity"] = float(val)
        elif cat == "WSD": forecasts[key]["wind_speed"] = float(val)
        elif cat == "SKY": forecasts[key]["sky"] = int(val)

    return sorted(forecasts.values(), key=lambda x: f"{x['date']}_{x['time']}")


def latlon_to_grid(lat: float, lon: float) -> tuple[int, int]:
    """위경도를 기상청 격자 좌표로 변환"""
    RE = 6371.00877
    GRID = 5.0
    SLAT1 = 30.0
    SLAT2 = 60.0
    OLON = 126.0
    OLAT = 38.0
    XO = 43
    YO = 136
    DEGRAD = math.pi / 180.0

    re = RE / GRID
    slat1 = SLAT1 * DEGRAD
    slat2 = SLAT2 * DEGRAD
    olon = OLON * DEGRAD
    olat = OLAT * DEGRAD

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = math.pow(sf, sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / math.pow(ro, sn)

    ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
    ra = re * sf / math.pow(ra, sn)
    theta = lon * DEGRAD - olon
    if theta > math.pi: theta -= 2.0 * math.pi
    if theta < -math.pi: theta += 2.0 * math.pi
    theta *= sn

    return int(ra * math.sin(theta) + XO + 0.5), int(ro - ra * math.cos(theta) + YO + 0.5)
