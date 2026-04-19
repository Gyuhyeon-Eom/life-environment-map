"""
벚꽃/단풍 개화 예측 모델
- 적산온도(Accumulated Temperature) 방식으로 개화일 예측
- 기상청 API에서 일별 기온 데이터 수집

벚꽃 개화 원리:
- 2월 1일부터 일평균기온 누적
- 누적 합이 임계값(지역별 다름, 약 150~200°C)에 도달하면 개화
- 만개는 개화 후 약 7일

단풍 원리:
- 9월 1일부터 일평균기온 기준
- 일최저기온 5°C 이하 누적일수 기반
"""

import httpx
from datetime import datetime, timedelta
from typing import Optional
from ..config import settings


# 기상청 중기예보 + 과거 관측 API
WEATHER_OBS_URL = "http://apis.data.go.kr/1360000/AsosDalyInfoService"


# 주요 벚꽃 명소 데이터 (하드코딩 - 나중에 DB로 이전)
BLOOM_SPOTS = [
    {
        "id": "cherry_yeouido",
        "name": "여의도 윤중로",
        "type": "cherry",
        "region": "서울",
        "latitude": 37.5287,
        "longitude": 126.9322,
        "station_id": "108",  # 서울 관측소
        "threshold": 165.0,  # 개화 적산온도 임계값
    },
    {
        "id": "cherry_seokchon",
        "name": "석촌호수",
        "type": "cherry",
        "region": "서울",
        "latitude": 37.5086,
        "longitude": 127.1020,
        "station_id": "108",
        "threshold": 165.0,
    },
    {
        "id": "cherry_jinhae",
        "name": "진해 경화역",
        "type": "cherry",
        "region": "경남",
        "latitude": 35.1335,
        "longitude": 128.6811,
        "station_id": "155",  # 창원 관측소
        "threshold": 145.0,
    },
    {
        "id": "cherry_gyeongju",
        "name": "경주 보문단지",
        "type": "cherry",
        "region": "경북",
        "latitude": 35.8466,
        "longitude": 129.3316,
        "station_id": "138",  # 포항 관측소
        "threshold": 150.0,
    },
    {
        "id": "cherry_jeju",
        "name": "제주 전농로",
        "type": "cherry",
        "region": "제주",
        "latitude": 33.5097,
        "longitude": 126.5298,
        "station_id": "184",  # 제주 관측소
        "threshold": 130.0,
    },
    {
        "id": "cherry_hadong",
        "name": "하동 쌍계사",
        "type": "cherry",
        "region": "경남",
        "latitude": 35.2248,
        "longitude": 127.6453,
        "station_id": "192",  # 진주 관측소
        "threshold": 140.0,
    },
    {
        "id": "autumn_naejangsan",
        "name": "내장산",
        "type": "autumn",
        "region": "전북",
        "latitude": 35.4897,
        "longitude": 126.8892,
        "station_id": "245",  # 정읍 관측소
        "threshold": 10,  # 일최저기온 5도 이하 누적일수
    },
    {
        "id": "autumn_seoraksan",
        "name": "설악산",
        "type": "autumn",
        "region": "강원",
        "latitude": 38.1191,
        "longitude": 128.4654,
        "station_id": "101",  # 춘천 관측소
        "threshold": 7,
    },
    {
        "id": "autumn_bukhansan",
        "name": "북한산",
        "type": "autumn",
        "region": "서울",
        "latitude": 37.6608,
        "longitude": 126.9930,
        "station_id": "108",
        "threshold": 12,
    },
]


async def get_daily_temperatures(
    station_id: str,
    start_date: str,
    end_date: str,
) -> Optional[list[dict]]:
    """
    ASOS 일별 기온 데이터 조회

    Args:
        station_id: 관측소 ID
        start_date: 시작일 (YYYYMMDD)
        end_date: 종료일 (YYYYMMDD)

    Returns:
        list[dict]: [{date, avg_temp, min_temp, max_temp}, ...]
    """
    params = {
        "serviceKey": settings.DATA_GO_KR_API_KEY,
        "numOfRows": "365",
        "pageNo": "1",
        "dataType": "JSON",
        "dataCd": "ASOS",
        "dateCd": "DAY",
        "startDt": start_date,
        "endDt": end_date,
        "stnIds": station_id,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{WEATHER_OBS_URL}/getWthrDataList",
            params=params,
        )

        if resp.status_code != 200:
            print(f"ASOS API error: {resp.status_code}")
            return None

        data = resp.json()

    header = data.get("response", {}).get("header", {})
    if header.get("resultCode") != "00":
        print(f"ASOS API result error: {header}")
        return None

    items = (
        data.get("response", {})
        .get("body", {})
        .get("items", {})
        .get("item", [])
    )

    if not items:
        return None

    if isinstance(items, dict):
        items = [items]

    result = []
    for item in items:
        try:
            result.append({
                "date": item.get("tm"),
                "avg_temp": float(item.get("avgTa", 0)),
                "min_temp": float(item.get("minTa", 0)),
                "max_temp": float(item.get("maxTa", 0)),
            })
        except (ValueError, TypeError):
            continue

    return result


def calculate_cherry_blossom_progress(
    temperatures: list[dict],
    threshold: float,
) -> dict:
    """
    벚꽃 개화 진행률 계산 (적산온도 방식)

    Args:
        temperatures: 일별 기온 데이터 (2월 1일부터)
        threshold: 개화 적산온도 임계값

    Returns:
        dict: {accumulated_temp, progress_pct, estimated_bloom_date, status}
    """
    accumulated = 0.0
    bloom_date = None

    for day in temperatures:
        avg_temp = day["avg_temp"]
        # 양수 기온만 누적 (일부 모델은 기준온도 5°C 이상만)
        if avg_temp > 0:
            accumulated += avg_temp

        if accumulated >= threshold and bloom_date is None:
            bloom_date = day["date"]

    progress = min((accumulated / threshold) * 100, 100) if threshold > 0 else 0

    # 상태 판단
    if progress >= 100:
        status = "만개"
    elif progress >= 90:
        status = "개화"
    elif progress >= 70:
        status = "개화 임박"
    elif progress >= 50:
        status = "꽃봉오리"
    else:
        status = "준비 중"

    # 예상 개화일 추정 (아직 개화 안 했으면)
    estimated_bloom = bloom_date
    if not bloom_date and len(temperatures) > 0 and accumulated > 0:
        remaining = threshold - accumulated
        # 최근 7일 평균 기온으로 추정
        recent_temps = [d["avg_temp"] for d in temperatures[-7:] if d["avg_temp"] > 0]
        if recent_temps:
            avg_daily_increase = sum(recent_temps) / len(recent_temps)
            if avg_daily_increase > 0:
                days_remaining = int(remaining / avg_daily_increase)
                last_date = datetime.strptime(temperatures[-1]["date"], "%Y-%m-%d")
                estimated_bloom = (last_date + timedelta(days=days_remaining)).strftime(
                    "%Y-%m-%d"
                )

    # 만개일은 개화일 + 7일
    estimated_peak = None
    target_date = bloom_date or estimated_bloom
    if target_date:
        try:
            peak = datetime.strptime(target_date, "%Y-%m-%d") + timedelta(days=7)
            estimated_peak = peak.strftime("%Y-%m-%d")
        except ValueError:
            pass

    return {
        "accumulated_temp": round(accumulated, 1),
        "threshold": threshold,
        "progress_pct": round(progress, 1),
        "estimated_bloom_date": estimated_bloom,
        "estimated_peak_date": estimated_peak,
        "status": status,
    }


def calculate_autumn_leaves_progress(
    temperatures: list[dict],
    threshold: int,
) -> dict:
    """
    단풍 진행률 계산

    Args:
        temperatures: 일별 기온 데이터 (9월 1일부터)
        threshold: 일최저기온 5°C 이하 누적일수 임계값

    Returns:
        dict: {cold_days, progress_pct, status}
    """
    cold_days = 0
    first_color_date = None

    for day in temperatures:
        if day["min_temp"] <= 5.0:
            cold_days += 1
            if cold_days >= threshold and first_color_date is None:
                first_color_date = day["date"]

    progress = min((cold_days / threshold) * 100, 100) if threshold > 0 else 0

    if progress >= 100:
        status = "절정"
    elif progress >= 70:
        status = "단풍 진행 중"
    elif progress >= 40:
        status = "부분 변색"
    elif progress >= 10:
        status = "첫 단풍"
    else:
        status = "준비 중"

    return {
        "cold_days": cold_days,
        "threshold": threshold,
        "progress_pct": round(progress, 1),
        "first_color_date": first_color_date,
        "status": status,
    }


async def get_all_bloom_predictions() -> list[dict]:
    """
    모든 명소의 개화/단풍 예측 조회
    """
    now = datetime.now()
    results = []

    for spot in BLOOM_SPOTS:
        prediction = None

        if spot["type"] == "cherry":
            # 벚꽃: 2월 1일부터 어제까지 기온 데이터 (ASOS는 전날까지만 제공)
            start = f"{now.year}0201"
            end = (now - timedelta(days=1)).strftime("%Y%m%d")

            temps = await get_daily_temperatures(
                spot["station_id"], start, end
            )

            if temps:
                prediction = calculate_cherry_blossom_progress(
                    temps, spot["threshold"]
                )

        elif spot["type"] == "autumn":
            # 단풍: 9월 1일부터 어제까지
            start = f"{now.year}0901"
            end = (now - timedelta(days=1)).strftime("%Y%m%d")

            temps = await get_daily_temperatures(
                spot["station_id"], start, end
            )

            if temps:
                prediction = calculate_autumn_leaves_progress(
                    temps, spot["threshold"]
                )

        result = {
            "id": spot["id"],
            "name": spot["name"],
            "type": spot["type"],
            "type_label": "벚꽃" if spot["type"] == "cherry" else "단풍",
            "region": spot["region"],
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
        }

        if prediction:
            result.update(prediction)
        else:
            result["status"] = "데이터 없음"
            result["progress_pct"] = 0

        results.append(result)

    return results


async def get_bloom_spot_detail(spot_id: str) -> Optional[dict]:
    """
    특정 명소의 상세 예측 조회
    """
    spot = next((s for s in BLOOM_SPOTS if s["id"] == spot_id), None)
    if not spot:
        return None

    now = datetime.now()

    if spot["type"] == "cherry":
        start = f"{now.year}0201"
        end = (now - timedelta(days=1)).strftime("%Y%m%d")
        temps = await get_daily_temperatures(spot["station_id"], start, end)

        result = {
            "id": spot["id"],
            "name": spot["name"],
            "type": "cherry",
            "type_label": "벚꽃",
            "region": spot["region"],
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
        }

        if temps:
            prediction = calculate_cherry_blossom_progress(temps, spot["threshold"])
            result.update(prediction)

            # 일별 적산온도 추이 (차트용)
            daily_accumulated = []
            acc = 0.0
            for day in temps:
                if day["avg_temp"] > 0:
                    acc += day["avg_temp"]
                daily_accumulated.append({
                    "date": day["date"],
                    "temp": day["avg_temp"],
                    "accumulated": round(acc, 1),
                })
            result["daily_data"] = daily_accumulated
        else:
            result["status"] = "데이터 없음"
            result["progress_pct"] = 0

        return result

    elif spot["type"] == "autumn":
        start = f"{now.year}0901"
        end = (now - timedelta(days=1)).strftime("%Y%m%d")
        temps = await get_daily_temperatures(spot["station_id"], start, end)

        result = {
            "id": spot["id"],
            "name": spot["name"],
            "type": "autumn",
            "type_label": "단풍",
            "region": spot["region"],
            "latitude": spot["latitude"],
            "longitude": spot["longitude"],
        }

        if temps:
            prediction = calculate_autumn_leaves_progress(temps, spot["threshold"])
            result.update(prediction)

            daily_data = []
            for day in temps:
                daily_data.append({
                    "date": day["date"],
                    "min_temp": day["min_temp"],
                    "avg_temp": day["avg_temp"],
                    "cold": day["min_temp"] <= 5.0,
                })
            result["daily_data"] = daily_data
        else:
            result["status"] = "데이터 없음"
            result["progress_pct"] = 0

        return result

    return None
