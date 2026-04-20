"""
산책 쾌적도 점수 모델
기온 + 습도 + 미세먼지(PM2.5) + 풍속 + UV → 0~100점

각 요소별 부분 점수를 계산 후 가중 합산.
가중치: 기온 30%, 습도 15%, 미세먼지 25%, 풍속 15%, UV 15%
"""

from typing import Optional


def _temp_score(temp: float) -> float:
    """기온 점수 (18~22도가 최적)"""
    if 18 <= temp <= 22:
        return 100.0
    elif 15 <= temp < 18:
        return 70 + (temp - 15) * 10  # 70~100
    elif 22 < temp <= 26:
        return 100 - (temp - 22) * 7.5  # 100~70
    elif 10 <= temp < 15:
        return 40 + (temp - 10) * 6  # 40~70
    elif 26 < temp <= 32:
        return 70 - (temp - 26) * 8.3  # 70~20
    elif 5 <= temp < 10:
        return 15 + (temp - 5) * 5  # 15~40
    elif 32 < temp <= 38:
        return max(0, 20 - (temp - 32) * 3.3)
    elif temp < 5:
        return max(0, 15 + (temp - 5) * 3)
    else:
        return 0


def _humidity_score(humidity: float) -> float:
    """습도 점수 (40~60%가 최적)"""
    if 40 <= humidity <= 60:
        return 100.0
    elif 30 <= humidity < 40:
        return 70 + (humidity - 30) * 3
    elif 60 < humidity <= 75:
        return 100 - (humidity - 60) * 2
    elif 20 <= humidity < 30:
        return 50 + (humidity - 20) * 2
    elif 75 < humidity <= 90:
        return 70 - (humidity - 75) * 3.3
    else:
        return max(0, 20)


def _pm25_score(pm25: float) -> float:
    """PM2.5 점수 (WHO 기준 참고)"""
    if pm25 <= 15:
        return 100.0
    elif pm25 <= 25:
        return 80 + (25 - pm25) * 2  # 80~100
    elif pm25 <= 35:
        return 60 + (35 - pm25) * 2  # 60~80
    elif pm25 <= 50:
        return 35 + (50 - pm25) * 1.67  # 35~60
    elif pm25 <= 75:
        return 10 + (75 - pm25) * 1  # 10~35
    else:
        return max(0, 10 - (pm25 - 75) * 0.13)


def _wind_score(wind_speed: float) -> float:
    """풍속 점수 (1~3 m/s가 최적)"""
    if 1.0 <= wind_speed <= 3.0:
        return 100.0
    elif wind_speed < 1.0:
        return 80 + wind_speed * 20
    elif 3.0 < wind_speed <= 5.0:
        return 100 - (wind_speed - 3) * 15  # 100~70
    elif 5.0 < wind_speed <= 8.0:
        return 70 - (wind_speed - 5) * 13.3  # 70~30
    elif 8.0 < wind_speed <= 14.0:
        return max(0, 30 - (wind_speed - 8) * 5)
    else:
        return 0


def _uv_score(uv_index: float) -> float:
    """자외선 점수 (0~2가 최적)"""
    if uv_index <= 2:
        return 100.0
    elif uv_index <= 5:
        return 100 - (uv_index - 2) * 13.3  # 100~60
    elif uv_index <= 7:
        return 60 - (uv_index - 5) * 15  # 60~30
    elif uv_index <= 10:
        return 30 - (uv_index - 7) * 8.3  # 30~5
    else:
        return 0


def calculate_walk_score(
    temperature: float,
    humidity: float,
    pm25: Optional[float] = None,
    wind_speed: float = 2.0,
    uv_index: Optional[float] = None,
) -> dict:
    """
    산책 쾌적도 종합 점수 계산.

    Returns:
        {
            "total_score": 0~100,
            "grade": "최고" | "좋음" | "보통" | "나쁨" | "매우나쁨",
            "message": str,
            "breakdown": { 요소별 점수 },
        }
    """
    t_score = _temp_score(temperature)
    h_score = _humidity_score(humidity)
    w_score = _wind_score(wind_speed)

    # PM2.5 없으면 가중치 재분배
    if pm25 is not None:
        p_score = _pm25_score(pm25)
    else:
        p_score = None

    if uv_index is not None:
        u_score = _uv_score(uv_index)
    else:
        u_score = None

    # 가중치 동적 계산
    weights = {"temp": 0.30, "humidity": 0.15, "wind": 0.15}
    scores = {"temp": t_score, "humidity": h_score, "wind": w_score}

    if p_score is not None:
        weights["pm25"] = 0.25
        scores["pm25"] = p_score
    if u_score is not None:
        weights["uv"] = 0.15
        scores["uv"] = u_score

    # 빠진 요소의 가중치를 나머지에 비례 배분
    total_w = sum(weights.values())
    if total_w < 1.0:
        factor = 1.0 / total_w
        weights = {k: v * factor for k, v in weights.items()}

    total_score = sum(scores[k] * weights[k] for k in scores)
    total_score = round(min(100, max(0, total_score)), 1)

    # 등급
    if total_score >= 80:
        grade, message = "최고", "산책하기 완벽한 날씨예요!"
    elif total_score >= 60:
        grade, message = "좋음", "산책하기 좋은 날씨예요"
    elif total_score >= 40:
        grade, message = "보통", "산책은 가능하지만 컨디션 체크!"
    elif total_score >= 20:
        grade, message = "나쁨", "실내 활동을 추천해요"
    else:
        grade, message = "매우나쁨", "외출을 자제하세요"

    breakdown = {
        "temperature": {"value": temperature, "score": round(t_score, 1)},
        "humidity": {"value": humidity, "score": round(h_score, 1)},
        "wind_speed": {"value": wind_speed, "score": round(w_score, 1)},
    }
    if pm25 is not None:
        breakdown["pm25"] = {"value": pm25, "score": round(p_score, 1)}
    if uv_index is not None:
        breakdown["uv"] = {"value": uv_index, "score": round(u_score, 1)}

    return {
        "total_score": total_score,
        "grade": grade,
        "message": message,
        "breakdown": breakdown,
    }


def find_best_walk_time(hourly_data: list[dict]) -> dict:
    """
    시간별 예보 데이터에서 최적 산책 시간 추천.

    hourly_data: [{"time": "0900", "date": "20260420", "temperature": 18, "humidity": 55, ...}, ...]

    Returns:
        {
            "best_time": "1400",
            "best_date": "20260420",
            "best_score": 85.2,
            "best_grade": "최고",
            "hourly_scores": [{"time": ..., "score": ..., "grade": ...}, ...],
        }
    """
    hourly_scores = []

    for h in hourly_data:
        temp = h.get("temperature")
        humidity = h.get("humidity")
        wind = h.get("wind_speed", 2.0)

        if temp is None or humidity is None:
            continue

        result = calculate_walk_score(
            temperature=temp,
            humidity=humidity,
            wind_speed=wind,
        )

        hourly_scores.append({
            "time": h.get("time", ""),
            "date": h.get("date", ""),
            "score": result["total_score"],
            "grade": result["grade"],
            "temperature": temp,
            "humidity": humidity,
        })

    if not hourly_scores:
        return {"best_time": None, "hourly_scores": []}

    # 활동 시간대(07~21시) 우선 필터
    active_hours = [h for h in hourly_scores if "0700" <= h["time"] <= "2100"]
    pool = active_hours if active_hours else hourly_scores

    best = max(pool, key=lambda x: x["score"])

    return {
        "best_time": best["time"],
        "best_date": best["date"],
        "best_score": best["score"],
        "best_grade": best["grade"],
        "hourly_scores": hourly_scores,
    }
