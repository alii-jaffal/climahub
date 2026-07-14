from collections.abc import Mapping, Sequence
from datetime import date, datetime
from typing import Any, NotRequired, TypedDict

from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, selectinload

from app.database.models import DailyWeather, WeatherRecord


class DailyWeatherCreateData(TypedDict):
    weather_date: date
    temperature_min: NotRequired[float | None]
    temperature_max: NotRequired[float | None]
    temperature_mean: NotRequired[float | None]
    precipitation_sum: NotRequired[float | None]
    wind_speed_max: NotRequired[float | None]
    weather_code: NotRequired[int | None]
    sunrise: NotRequired[datetime | None]
    sunset: NotRequired[datetime | None]


class WeatherRecordCreateData(TypedDict):
    location_query: str
    resolved_location: str
    latitude: float
    longitude: float
    timezone: str
    start_date: date
    end_date: date
    notes: str | None
    weather_data: dict[str, Any]


class WeatherRecordUpdateData(TypedDict, total=False):
    location_query: str
    resolved_location: str
    latitude: float
    longitude: float
    timezone: str
    start_date: date
    end_date: date
    notes: str | None
    weather_data: dict[str, Any]


class WeatherRecordRepository:
    UPDATABLE_FIELDS = frozenset(WeatherRecordUpdateData.__annotations__)

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        record_data: WeatherRecordCreateData,
        daily_weather_rows: Sequence[DailyWeatherCreateData],
    ) -> WeatherRecord:
        record = WeatherRecord(
            **record_data,
            daily_weather=self._build_daily_weather_rows(daily_weather_rows),
        )

        try:
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
        except SQLAlchemyError:
            self.db.rollback()
            raise

        return self.get_by_id(record.record_id) or record

    def get_all(
        self,
        *,
        skip: int = 0,
        limit: int | None = 100,
    ) -> list[WeatherRecord]:
        statement = (
            select(WeatherRecord)
            .options(selectinload(WeatherRecord.daily_weather))
            .order_by(
                WeatherRecord.created_at.desc(),
                WeatherRecord.record_id.desc(),
            )
            .offset(skip)
        )

        if limit is not None:
            statement = statement.limit(limit)

        return list(self.db.scalars(statement).all())

    def get_by_id(self, record_id: int) -> WeatherRecord | None:
        statement = (
            select(WeatherRecord)
            .options(selectinload(WeatherRecord.daily_weather))
            .where(WeatherRecord.record_id == record_id)
        )

        return self.db.scalar(statement)

    def update(
        self,
        record: WeatherRecord,
        *,
        updates: Mapping[str, Any],
    ) -> WeatherRecord:
        unsupported_fields = set(updates) - self.UPDATABLE_FIELDS

        if unsupported_fields:
            invalid_fields = ", ".join(sorted(unsupported_fields))
            raise ValueError(f"Unsupported update fields: {invalid_fields}")

        for field_name, value in updates.items():
            setattr(record, field_name, value)

        try:
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
        except SQLAlchemyError:
            self.db.rollback()
            raise

        return self.get_by_id(record.record_id) or record

    def delete(self, record: WeatherRecord) -> None:
        try:
            self.db.delete(record)
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise

    def replace_daily_weather(
        self,
        record: WeatherRecord,
        *,
        daily_weather_rows: Sequence[DailyWeatherCreateData],
    ) -> WeatherRecord:
        record.daily_weather = self._build_daily_weather_rows(daily_weather_rows)

        try:
            self.db.add(record)
            self.db.commit()
            self.db.refresh(record)
        except SQLAlchemyError:
            self.db.rollback()
            raise

        return self.get_by_id(record.record_id) or record

    def _build_daily_weather_rows(
        self,
        daily_weather_rows: Sequence[DailyWeatherCreateData],
    ) -> list[DailyWeather]:
        return [
            DailyWeather(
                weather_date=row["weather_date"],
                temperature_min=row.get("temperature_min"),
                temperature_max=row.get("temperature_max"),
                temperature_mean=row.get("temperature_mean"),
                precipitation_sum=row.get("precipitation_sum"),
                wind_speed_max=row.get("wind_speed_max"),
                weather_code=row.get("weather_code"),
                sunrise=row.get("sunrise"),
                sunset=row.get("sunset"),
            )
            for row in daily_weather_rows
        ]
