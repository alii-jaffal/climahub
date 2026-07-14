from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.weather_record_exports import router as weather_record_exports_router
from app.api.routes.weather_records import router as weather_records_router

ALLOWED_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app = FastAPI(
    title="ClimaHub API",
    description="Weather search, persistence, and travel information API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_record_exports_router)
app.include_router(weather_records_router)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
