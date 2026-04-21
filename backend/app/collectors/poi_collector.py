"""
OSM Overpass API 기반 주변 편의시설(POI) 수집

카페, 화장실, 편의점, 벤치, 음수대, 주차장 등
산책로 주변 생활 인프라(SOC) 데이터
"""

import httpx
from typing import Optional

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# POI 카테고리 정의
POI_CATEGORIES = {
    "cafe": {
        "label": "카페",
        "icon": "cafe",
        "query": 'nwr["amenity"="cafe"]',
    },
    "toilet": {
        "label": "화장실",
        "icon": "toilet",
        "query": 'nwr["amenity"="toilets"]',
    },
    "convenience": {
        "label": "편의점",
        "icon": "convenience",
        "query": 'nwr["shop"="convenience"]',
    },
    "bench": {
        "label": "벤치",
        "icon": "bench",
        "query": 'nwr["amenity"="bench"]',
    },
    "drinking_water": {
        "label": "음수대",
        "icon": "water",
        "query": 'nwr["amenity"="drinking_water"]',
    },
    "parking": {
        "label": "주차장",
        "icon": "parking",
        "query": 'nwr["amenity"="parking"]',
    },
    "restaurant": {
        "label": "음식점",
        "icon": "restaurant",
        "query": 'nwr["amenity"="restaurant"]',
    },
    "pharmacy": {
        "label": "약국",
        "icon": "pharmacy",
        "query": 'nwr["amenity"="pharmacy"]',
    },
}


def _build_poi_query(
    lat: float,
    lng: float,
    radius: int = 1000,
    categories: list[str] | None = None,
) -> str:
    """Overpass QL 쿼리 생성"""
    cats = categories or list(POI_CATEGORIES.keys())
    queries = []
    for cat in cats:
        if cat in POI_CATEGORIES:
            queries.append(
                f'{POI_CATEGORIES[cat]["query"]}(around:{radius},{lat},{lng});'
            )

    return (
        f"[out:json][timeout:15];"
        f'({"".join(queries)});'
        f"out center;"
    )


async def get_nearby_pois(
    lat: float,
    lng: float,
    radius: int = 1000,
    categories: list[str] | None = None,
) -> Optional[dict]:
    """
    OSM에서 주변 편의시설 가져오기.

    Returns:
        {
            "pois": [
                {
                    "id": "node/123",
                    "name": "스타벅스",
                    "category": "cafe",
                    "label": "카페",
                    "icon": "cafe",
                    "lat": 37.123,
                    "lng": 126.456,
                },
                ...
            ],
            "count": int,
            "categories": { "cafe": 5, "toilet": 3, ... }
        }
    """
    query = _build_poi_query(lat, lng, radius, categories)

    try:
        headers = {"User-Agent": "LifeEnvMap/1.0", "Accept": "*/*"}
        async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
            resp = await client.get(
                OVERPASS_URL,
                params={"data": query},
            )

            if resp.status_code != 200:
                print(f"Overpass POI error: {resp.status_code}")
                return None

            data = resp.json()
    except Exception as e:
        print(f"Overpass POI exception: {e}")
        return None

    elements = data.get("elements", [])
    pois = []
    cat_counts: dict[str, int] = {}

    for el in elements:
        tags = el.get("tags", {})

        # 좌표 추출 (node: lat/lon, way/relation: center)
        poi_lat = el.get("lat") or (el.get("center", {}).get("lat"))
        poi_lng = el.get("lon") or (el.get("center", {}).get("lon"))
        if not poi_lat or not poi_lng:
            continue

        # 카테고리 판별
        category = _classify_poi(tags)
        if not category:
            continue

        cat_info = POI_CATEGORIES[category]
        name = tags.get("name", tags.get("brand", cat_info["label"]))

        pois.append({
            "id": f'{el.get("type", "node")}/{el.get("id", "")}',
            "name": name,
            "category": category,
            "label": cat_info["label"],
            "icon": cat_info["icon"],
            "lat": poi_lat,
            "lng": poi_lng,
            "opening_hours": tags.get("opening_hours", ""),
            "wheelchair": tags.get("wheelchair", ""),
        })

        cat_counts[category] = cat_counts.get(category, 0) + 1

    # 최대 300개
    pois = pois[:300]

    return {
        "pois": pois,
        "count": len(pois),
        "categories": cat_counts,
    }


def _classify_poi(tags: dict) -> str | None:
    """태그로 카테고리 판별"""
    amenity = tags.get("amenity", "")
    shop = tags.get("shop", "")

    if amenity == "cafe":
        return "cafe"
    elif amenity == "toilets":
        return "toilet"
    elif amenity == "bench":
        return "bench"
    elif amenity == "drinking_water":
        return "drinking_water"
    elif amenity == "parking":
        return "parking"
    elif amenity == "restaurant":
        return "restaurant"
    elif amenity == "pharmacy":
        return "pharmacy"
    elif shop == "convenience":
        return "convenience"
    return None
