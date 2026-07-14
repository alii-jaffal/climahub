from fastapi import FastAPI

from app.api.routes.weather_record_exports import router as weather_record_exports_router
from app.api.routes.weather_records import router as weather_records_router

app = FastAPI(
    title="ClimaHub API",
    description="Weather search, persistence, and travel information API",
    version="1.0.0",
)

app.include_router(weather_record_exports_router)
app.include_router(weather_records_router)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
