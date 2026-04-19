"""
벚꽃/단풍 예측 API 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from ..collectors.bloom_collector import (
    get_all_bloom_predictions,
    get_bloom_spot_detail,
    BLOOM_SPOTS,
)

router = APIRouter(prefix="/api/v1/bloom", tags=["bloom"])


@router.get("/spots")
async def list_bloom_spots(
    type: Optional[str] = Query(None, description="타입 필터 (cherry/autumn)"),
):
    """벚꽃/단풍 명소 목록 + 현재 예측"""
    predictions = await get_all_bloom_predictions()

    if type:
        predictions = [p for p in predictions if p["type"] == type]

    # 진행률 높은 순으로 정렬
    predictions.sort(key=lambda x: x.get("progress_pct", 0), reverse=True)

    return {
        "status": "ok",
        "data": predictions,
        "count": len(predictions),
    }


@router.get("/spots/{spot_id}")
async def bloom_spot_detail(spot_id: str):
    """명소 상세 + 일별 데이터 (차트용)"""
    detail = await get_bloom_spot_detail(spot_id)
    if not detail:
        raise HTTPException(status_code=404, detail="명소를 찾을 수 없습니다")

    return {"status": "ok", "data": detail}


@router.get("/ranking")
async def bloom_ranking(
    type: Optional[str] = Query(None, description="타입 필터 (cherry/autumn)"),
):
    """개화율/단풍률 순위"""
    predictions = await get_all_bloom_predictions()

    if type:
        predictions = [p for p in predictions if p["type"] == type]

    # 진행률 순 정렬
    predictions.sort(key=lambda x: x.get("progress_pct", 0), reverse=True)

    ranking = []
    for i, p in enumerate(predictions):
        ranking.append({
            "rank": i + 1,
            "name": p["name"],
            "region": p["region"],
            "type_label": p.get("type_label", ""),
            "progress_pct": p.get("progress_pct", 0),
            "status": p.get("status", "알 수 없음"),
        })

    return {"status": "ok", "data": ranking}
