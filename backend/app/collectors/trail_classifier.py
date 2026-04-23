"""
산책로 유형 분류기

OSM 태그 + 주변 POI 밀도를 기반으로 산책로 유형(mood)을 분류.
하나의 산책로가 여러 유형에 해당할 수 있음.
"""

from typing import List, Dict, Any, Optional
import math

# ─── 산책 유형 정의 ───
TRAIL_MOODS = {
    "healing": {
        "label": "힐링 산책",
        "emoji": "🌿",
        "color": "#2D6A4F",
        "description": "조용하고 자연 속에서 걷기 좋은 길",
    },
    "date": {
        "label": "데이트 코스",
        "emoji": "💕",
        "color": "#FF6B8A",
        "description": "분위기 좋고 카페/맛집이 가까운 길",
    },
    "family": {
        "label": "가족 나들이",
        "emoji": "👨‍👩‍👧",
        "color": "#F4A261",
        "description": "평탄하고 유모차도 가능한 편한 길",
    },
    "workout": {
        "label": "운동 산책",
        "emoji": "🏃",
        "color": "#E76F51",
        "description": "장거리/오르막 코스로 운동하기 좋은 길",
    },
    "pet": {
        "label": "반려동물",
        "emoji": "🐕",
        "color": "#8B5CF6",
        "description": "공원 내부, 넓고 강아지와 걷기 좋은 길",
    },
    "night": {
        "label": "야경 산책",
        "emoji": "🌙",
        "color": "#3B82F6",
        "description": "조명이 있어 밤에도 안전한 길",
    },
}


def _trail_length_meters(geometry: List[List[float]]) -> float:
    """geometry 좌표 리스트로 대략적 총 거리(m) 계산"""
    total = 0.0
    for i in range(len(geometry) - 1):
        lat1, lon1 = geometry[i]
        lat2, lon2 = geometry[i + 1]
        # Haversine 간이 계산
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        total += 6371000 * c
    return total


def classify_trail(
    trail: Dict[str, Any],
    nearby_pois: Optional[Dict[str, int]] = None,
) -> List[str]:
    """
    산책로 하나를 분류하여 해당하는 mood 리스트 반환.

    Args:
        trail: OSM 산책로 데이터 (tags, category, geometry 등)
        nearby_pois: 이 산책로 주변 POI 카테고리별 개수
                     예: {"cafe": 3, "bench": 5, "toilet": 2, ...}

    Returns:
        해당 mood id 리스트 (예: ["healing", "pet"])
    """
    tags = trail.get("tags", {})
    category = trail.get("category", "path")
    geometry = trail.get("geometry", [])
    surface = tags.get("surface", trail.get("surface", ""))
    lit = tags.get("lit", "")
    wheelchair = tags.get("wheelchair", "")
    name = tags.get("name", trail.get("name", "")).lower()
    highway = tags.get("highway", "")

    pois = nearby_pois or {}
    length_m = _trail_length_meters(geometry) if geometry else 0

    moods = []
    scores: Dict[str, float] = {m: 0.0 for m in TRAIL_MOODS}

    # ─── 힐링 산책 ───
    if category in ("path", "footway"):
        scores["healing"] += 2
    if "park" in name or "숲" in name or "둘레" in name or "생태" in name:
        scores["healing"] += 3
    if surface in ("ground", "grass", "earth", "gravel", "wood", "fine_gravel"):
        scores["healing"] += 1.5
    if pois.get("bench", 0) >= 2:
        scores["healing"] += 1
    # 카페/음식점 적으면 오히려 조용한 곳
    if pois.get("cafe", 0) <= 1 and pois.get("restaurant", 0) <= 1:
        scores["healing"] += 1
    if 300 < length_m < 3000:
        scores["healing"] += 1

    # ─── 데이트 코스 ───
    if category == "pedestrian":
        scores["date"] += 2.5
    if pois.get("cafe", 0) >= 2:
        scores["date"] += 2
    if pois.get("restaurant", 0) >= 2:
        scores["date"] += 1.5
    if lit == "yes":
        scores["date"] += 1.5
    if surface in ("paved", "asphalt", "concrete", "sett"):
        scores["date"] += 1
    if "거리" in name or "로" in name or "길" in name:
        scores["date"] += 0.5
    if 200 < length_m < 2000:
        scores["date"] += 0.5

    # ─── 가족 나들이 ───
    if wheelchair in ("yes", "limited"):
        scores["family"] += 3
    if surface in ("paved", "asphalt", "concrete"):
        scores["family"] += 2
    if pois.get("toilet", 0) >= 1:
        scores["family"] += 1.5
    if pois.get("bench", 0) >= 3:
        scores["family"] += 1
    if pois.get("drinking_water", 0) >= 1:
        scores["family"] += 1
    if category in ("footway", "pedestrian"):
        scores["family"] += 1
    if length_m < 2000:
        scores["family"] += 1

    # ─── 운동 산책 ───
    if category == "hiking":
        scores["workout"] += 3
    if length_m > 3000:
        scores["workout"] += 2.5
    elif length_m > 1500:
        scores["workout"] += 1
    if "등산" in name or "산" in name or "능선" in name:
        scores["workout"] += 2
    if surface in ("ground", "rock", "earth", "gravel"):
        scores["workout"] += 1

    # ─── 반려동물 ───
    if "공원" in name or "park" in name:
        scores["pet"] += 3
    if category in ("path", "footway"):
        scores["pet"] += 1
    if surface in ("ground", "grass", "earth", "fine_gravel"):
        scores["pet"] += 1.5
    if pois.get("drinking_water", 0) >= 1:
        scores["pet"] += 1
    if 300 < length_m < 3000:
        scores["pet"] += 0.5

    # ─── 야경 산책 ───
    if lit == "yes":
        scores["night"] += 4
    if surface in ("paved", "asphalt", "concrete"):
        scores["night"] += 1
    if pois.get("cafe", 0) >= 1:
        scores["night"] += 0.5
    if category in ("pedestrian", "footway"):
        scores["night"] += 1

    # ─── 임계값 기반 분류 ───
    THRESHOLD = 3.0
    for mood, score in scores.items():
        if score >= THRESHOLD:
            moods.append(mood)

    # 아무것도 해당 안 되면 가장 높은 점수 하나라도
    if not moods:
        best = max(scores, key=lambda k: scores[k])
        if scores[best] > 0:
            moods.append(best)

    # 점수순 정렬
    moods.sort(key=lambda m: scores[m], reverse=True)

    return moods


def classify_trails_batch(
    trails: List[Dict[str, Any]],
    poi_map: Optional[Dict[str, Dict[str, int]]] = None,
) -> List[Dict[str, Any]]:
    """
    산책로 리스트에 moods 필드 추가.

    Args:
        trails: OSM 산책로 리스트
        poi_map: trail_id -> {category: count} 매핑 (없으면 태그만으로 분류)

    Returns:
        moods 필드가 추가된 산책로 리스트
    """
    for trail in trails:
        trail_id = trail.get("id", "")
        pois = poi_map.get(trail_id) if poi_map else None
        trail["moods"] = classify_trail(trail, pois)
        # 대표 mood (첫 번째)
        trail["primary_mood"] = trail["moods"][0] if trail["moods"] else "healing"
        # 거리 정보
        trail["length_m"] = round(
            _trail_length_meters(trail.get("geometry", []))
        )

    return trails
