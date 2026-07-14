from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.repository import WeatherRecordRepository
from app.services.weather_record_service import WeatherRecordService


def get_weather_record_repository(
    db: Session,
) -> WeatherRecordRepository:
    return WeatherRecordRepository(db)


def get_weather_record_service(
    db: Session = Depends(get_db),
) -> WeatherRecordService:
    repository = get_weather_record_repository(db)
    return WeatherRecordService(repository=repository)


__all__ = [
    "get_db",
    "get_weather_record_repository",
    "get_weather_record_service",
]
