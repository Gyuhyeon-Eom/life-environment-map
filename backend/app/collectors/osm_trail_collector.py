"""
OpenStreetMap Overpass API 기반 산책로/보행로 수집

- highway=footway (보행자 전용도로)
- highway=path (오솔길/등산로)
- highway=pedestrian (보행자 거리)
- leisure=park 내 경로
- route=hiking / route=foot (하이킹/도보 경로)

Overpass API: 무료, 키 불필요
"""

import httpx
from typing import Optional

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def _build_query(lat: float, lng: float, radius: int = 3000) -> str:
    """Overpass QL 쿼리 생성"""
    return f"""
[out:json][timeout:15];
(
  // 보행자 도로, 산책로, 오솔길
  way["highway"="footway"](around:{radius},{lat},{lng});
  way["highway"="path"](around:{radius},{lat},{lng});
  way["highway"="pedestrian"](around:{radius},{lat},{lng});
  way["highway"="track"]["tracktype"="grade1"](around:{radius},{lat},{lng});

  // 하이킹/도보 경로 (relation)
  relation["route"="hiking"](around:{radius},{lat},{lng});
  relation["route"="foot"](around:{radius},{lat},{lng});

  // 공원 내 경로
  way["highway"="footway"]["leisure"](around:{radius},{lat},{lng});
  way["footway"="sidewalk"](around:{radius},{lat},{lng});
);
out body geom;
"""


async def get_osm_trails(
    lat: float,
    lng: float,
    radius: int = 3000,
) -> Optional[dict]:
    """
    OSM에서 산책로/보행로 geometry 가져오기.

    Returns:
        {
            "trails": [
                {
                    "id": "way/123456",
                    "name": "둘레길 1코스",
                    "type": "footway",
                    "geometry": [[lat, lng], [lat, lng], ...],
                    "tags": {...},
                },
                ...
            ],
            "count": int,
        }
    """
    query = _build_query(lat, lng, radius)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if resp.status_code != 200:
                print(f"Overpass API error: {resp.status_code}")
                return None

            data = resp.json()
    except Exception as e:
        print(f"Overpass API exception: {e}")
        return None

    elements = data.get("elements", [])
    trails = []

    for el in elements:
        el_type = el.get("type", "")
        el_id = el.get("id", "")
        tags = el.get("tags", {})

        # geometry 추출
        geometry = []
        if el_type == "way" and "geometry" in el:
            geometry = [[p["lat"], p["lon"]] for p in el["geometry"]]
        elif el_type == "relation" and "members" in el:
            # relation의 way 멤버들 geometry 합치기
            for member in el["members"]:
                if member.get("type") == "way" and "geometry" in member:
                    geometry.extend(
                        [[p["lat"], p["lon"]] for p in member["geometry"]]
                    )

        if len(geometry) < 2:
            continue

        name = tags.get("name", tags.get("description", ""))
        highway = tags.get("highway", "")
        route = tags.get("route", "")
        surface = tags.get("surface", "")

        trail_type = highway or route or "path"

        # 분류
        if route in ("hiking", "foot"):
            category = "hiking"
        elif highway == "pedestrian":
            category = "pedestrian"
        elif highway == "footway":
            category = "footway"
        else:
            category = "path"

        trails.append({
            "id": f"{el_type}/{el_id}",
            "name": name,
            "type": trail_type,
            "category": category,
            "surface": surface,
            "geometry": geometry,
            "tags": {
                k: v for k, v in tags.items()
                if k in ("name", "highway", "surface", "lit", "wheelchair",
                         "route", "description", "operator", "network")
            },
        })

    return {
        "trails": trails,
        "count": len(trails),
    }
