"""공통 유틸리티"""

import httpx
from urllib.parse import quote
from .config import settings


def build_api_url(base_url: str, endpoint: str, params: dict) -> str:
    """
    serviceKey를 올바르게 URL 인코딩하여 URL 조합.
    디코딩 키(+, /, =)를 직접 인코딩 처리.
    """
    encoded_key = quote(settings.DATA_GO_KR_API_KEY, safe="")
    url = f"{base_url}/{endpoint}?serviceKey={encoded_key}"
    for k, v in params.items():
        url += f"&{k}={v}"
    return url


async def api_get(base_url: str, endpoint: str, params: dict) -> dict | None:
    """공통 API GET 호출"""
    url = build_api_url(base_url, endpoint, params)

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url)

        if resp.status_code != 200:
            print(f"API error [{endpoint}]: {resp.status_code}")
            return None

        try:
            return resp.json()
        except Exception:
            print(f"API JSON error [{endpoint}]: {resp.text[:200]}")
            return None
