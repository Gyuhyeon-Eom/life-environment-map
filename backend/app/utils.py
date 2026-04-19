"""공통 유틸리티"""

import httpx
from .config import settings


def build_api_url(base_url: str, endpoint: str, params: dict) -> str:
    """
    serviceKey 이중 인코딩 방지를 위한 URL 직접 조합.
    httpx의 params= 를 쓰면 디코딩 키의 +, /, = 가 이중 인코딩됨.
    """
    url = f"{base_url}/{endpoint}?serviceKey={settings.DATA_GO_KR_API_KEY}"
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
