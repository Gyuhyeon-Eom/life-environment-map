"""
에어코리아 대기오염정보 API 연동
"""

from typing import Optional
from ..utils import api_get


BASE_URL = "http://apis.data.go.kr/B552584/ArpltnInforInqireSvc"


async def get_realtime_air_quality(station_name: str) -> Optional[dict]:
    """측정소별 실시간 대기오염 정보 조회"""
    params = {
        "returnType": "json",
        "numOfRows": "1",
        "pageNo": "1",
        "stationName": station_name,
        "dataTerm": "DAILY",
        "ver": "1.5",
    }

    data = await api_get(BASE_URL, "getMsrstnAcctoRltmMesureDnsty", params)
    if not data:
        return None

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

    return {
        "station_name": station_name,
        "data_time": item.get("dataTime"),
        "pm10": safe_float(item.get("pm10Value")),
        "pm25": safe_float(item.get("pm25Value")),
        "o3": safe_float(item.get("o3Value")),
        "co": safe_float(item.get("coValue")),
        "no2": safe_float(item.get("no2Value")),
        "so2": safe_float(item.get("so2Value")),
        "pm10_grade": grade_map.get(safe_int(item.get("pm10Grade")), "알수없음"),
        "pm25_grade": grade_map.get(safe_int(item.get("pm25Grade")), "알수없음"),
        "khai_value": safe_float(item.get("khaiValue")),
        "khai_grade": grade_map.get(safe_int(item.get("khaiGrade")), "알수없음"),
    }


async def get_air_quality_forecast() -> Optional[list[dict]]:
    """대기질 예보 조회"""
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")

    params = {
        "returnType": "json",
        "numOfRows": "100",
        "pageNo": "1",
        "searchDate": today,
        "InformCode": "PM10",
    }

    data = await api_get(BASE_URL, "getMinuDustFrcstDspth", params)
    if not data:
        return None

    items = data.get("response", {}).get("body", {}).get("items", [])
    if not items:
        return None

    return [
        {
            "date": item.get("informData"),
            "cause": item.get("informCause"),
            "overall": item.get("informOverall"),
            "grade": item.get("informGrade"),
        }
        for item in items
    ]
