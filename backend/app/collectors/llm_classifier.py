"""
LLM 기반 산책로 유형 분류기

ollama (로컬 LLM)를 활용하여 산책로 이름, OSM 태그, 주변 POI 등을
종합적으로 분석하여 mood를 분류.

기존 rule-based 분류기(trail_classifier.py)를 보완/대체.
분류 결과는 캐싱하여 동일 산책로 재분류 방지.
"""

import asyncio
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:7b"

# 분류 캐시 (메모리 기반, 앱 재시작 시 초기화)
# 프로덕션에서는 Redis/DB로 교체
_classification_cache: Dict[str, Dict[str, Any]] = {}

MOOD_DEFINITIONS = """
- healing: 힐링 산책 - 조용하고 자연 속에서 걷기 좋은 길 (숲길, 둘레길, 생태공원, 호수 주변)
- date: 데이트 코스 - 분위기 좋고 카페/맛집이 가까운 길 (한강공원, 도심 보행로, 야경 명소)
- family: 가족 나들이 - 평탄하고 유모차/어린이도 가능한 편한 길 (놀이터 근처, 넓은 공원, 자전거도로)
- workout: 운동 산책 - 장거리/오르막 코스로 운동하기 좋은 길 (등산로, 트레일, 능선길)
- pet: 반려동물 - 넓고 강아지와 걷기 좋은 길 (공원, 잔디밭, 하천 산책로)
- night: 야경 산책 - 조명이 있어 밤에도 안전하고 야경이 좋은 길 (한강, 도심 야경, 다리 주변)
"""

CLASSIFY_PROMPT_TEMPLATE = """당신은 산책로 유형 분류 전문가입니다.
아래 산책로 정보를 보고, 가장 적합한 유형(mood)을 1~3개 골라주세요.

## 유형 정의
{mood_definitions}

## 산책로 정보
- 이름: {name}
- 카테고리: {category}
- 노면: {surface}
- 조명: {lit}
- 휠체어 접근: {wheelchair}
- 길이: {length}m
- 위치 특성: {location_hint}
- 주변 POI: {pois}

## 응답 형식
반드시 JSON만 출력하세요. 다른 텍스트 없이:
{{"moods": ["mood1", "mood2"], "reason": "간단한 이유"}}

moods에는 healing, date, family, workout, pet, night 중에서만 선택하세요.
첫 번째가 가장 대표적인 유형입니다."""


def _make_cache_key(trail: Dict[str, Any]) -> str:
    """산책로 고유 캐시 키 생성"""
    key_data = f"{trail.get('id', '')}:{trail.get('name', '')}:{trail.get('category', '')}"
    return hashlib.md5(key_data.encode()).hexdigest()


def _format_pois(pois: Optional[Dict[str, int]]) -> str:
    """POI 정보를 읽기 좋게 포맷"""
    if not pois:
        return "정보 없음"
    labels = {
        "cafe": "카페", "toilet": "화장실", "convenience": "편의점",
        "bench": "벤치", "drinking_water": "음수대", "parking": "주차장",
        "restaurant": "음식점", "pharmacy": "약국",
    }
    parts = [f"{labels.get(k, k)} {v}곳" for k, v in pois.items() if v > 0]
    return ", ".join(parts) if parts else "주변 시설 적음"


def _get_location_hint(trail: Dict[str, Any]) -> str:
    """산책로 이름/태그에서 위치 힌트 추출"""
    name = trail.get("name", "") or trail.get("tags", {}).get("name", "")
    hints = []

    keyword_map = {
        "한강": "한강 주변",
        "공원": "공원 내부",
        "산": "산/언덕 지역",
        "숲": "숲 지역",
        "호수": "호수/저수지 주변",
        "하천": "하천/개울 주변",
        "강": "강 주변",
        "해변": "해안가",
        "둘레": "둘레길/순환 코스",
        "등산": "등산로",
        "능선": "산 능선",
        "도심": "도심",
        "거리": "상업/보행 거리",
    }

    for keyword, hint in keyword_map.items():
        if keyword in name:
            hints.append(hint)

    return ", ".join(hints) if hints else "일반 보행로"


async def classify_trail_llm(
    trail: Dict[str, Any],
    nearby_pois: Optional[Dict[str, int]] = None,
) -> List[str]:
    """
    단일 산책로를 LLM으로 분류.

    Returns:
        mood 리스트 (예: ["healing", "pet"])
    """
    cache_key = _make_cache_key(trail)

    # 캐시 히트
    if cache_key in _classification_cache:
        return _classification_cache[cache_key]["moods"]

    tags = trail.get("tags", {})
    name = trail.get("name", "") or tags.get("name", "") or "이름 없는 산책로"
    category_labels = {
        "hiking": "등산로", "footway": "보행로",
        "pedestrian": "보행자거리", "path": "오솔길/산책로",
    }

    prompt = CLASSIFY_PROMPT_TEMPLATE.format(
        mood_definitions=MOOD_DEFINITIONS,
        name=name,
        category=category_labels.get(trail.get("category", ""), trail.get("category", "기타")),
        surface=tags.get("surface", trail.get("surface", "정보 없음")),
        lit=tags.get("lit", "정보 없음"),
        wheelchair=tags.get("wheelchair", "정보 없음"),
        length=trail.get("length_m", 0),
        location_hint=_get_location_hint(trail),
        pois=_format_pois(nearby_pois),
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 150,
                    },
                },
            )
            resp.raise_for_status()
            result = resp.json()
            text = result.get("response", "").strip()

            # JSON 파싱
            # LLM이 ```json ... ``` 같은 래퍼를 붙일 수 있으므로 추출
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()

            parsed = json.loads(text)
            moods = parsed.get("moods", [])

            # 유효한 mood만 필터
            valid_moods = {"healing", "date", "family", "workout", "pet", "night"}
            moods = [m for m in moods if m in valid_moods]

            if not moods:
                moods = ["healing"]  # fallback

            # 캐시 저장
            _classification_cache[cache_key] = {
                "moods": moods,
                "reason": parsed.get("reason", ""),
            }

            return moods

    except Exception as e:
        logger.warning(f"LLM 분류 실패 ({name}): {e}")
        return ["healing"]  # fallback


async def classify_trails_batch_llm(
    trails: List[Dict[str, Any]],
    poi_map: Optional[Dict[str, Dict[str, int]]] = None,
    max_concurrent: int = 5,
) -> List[Dict[str, Any]]:
    """
    산책로 리스트를 LLM으로 일괄 분류.
    동시 요청을 max_concurrent로 제한하여 ollama 과부하 방지.

    Args:
        trails: OSM 산책로 리스트
        poi_map: trail_id -> {category: count}
        max_concurrent: 동시 분류 요청 수

    Returns:
        moods/primary_mood 필드가 추가된 산책로 리스트
    """
    import math

    semaphore = asyncio.Semaphore(max_concurrent)

    async def _classify_one(trail: Dict[str, Any]) -> None:
        trail_id = trail.get("id", "")
        pois = poi_map.get(trail_id) if poi_map else None

        async with semaphore:
            moods = await classify_trail_llm(trail, pois)

        trail["moods"] = moods
        trail["primary_mood"] = moods[0] if moods else "healing"

        # 거리 계산
        geometry = trail.get("geometry", [])
        if geometry and not trail.get("length_m"):
            total = 0.0
            for i in range(len(geometry) - 1):
                lat1, lon1 = geometry[i]
                lat2, lon2 = geometry[i + 1]
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
            trail["length_m"] = round(total)

    await asyncio.gather(*[_classify_one(t) for t in trails])

    return trails


def get_cache_stats() -> Dict[str, Any]:
    """캐시 상태 확인"""
    return {
        "cached_count": len(_classification_cache),
        "sample": list(_classification_cache.values())[:3],
    }
