from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import weather

app = FastAPI(
    title="Life Environment Map API",
    description="산책로 혼잡도, 소음, 공기질, 벚꽃/단풍 예측 API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(weather.router)


@app.get("/")
async def root():
    return {"message": "Life Environment Map API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
