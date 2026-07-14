from datetime import date, timedelta
from typing import Self

from app.schemas.location import CoordinatesRequest
from pydantic import BaseModel, Field, field_validator, model_validator


class WeatherSearchRequest(BaseModel):
    location: str = Field(
        min_length=2,
        max_length=255,
        examples=["Beirut"],
    )

    start_date: date
    end_date: date

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )

    @field_validator("location", mode="before")
    @classmethod
    def clean_location(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()

        return value

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after end date.")

        return self


class ForecastWeatherRequest(CoordinatesRequest):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_forecast_dates(self) -> Self:
        today = date.today()
        final_forecast_date = today + timedelta(days=15)

        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after end date.")

        if self.start_date < today:
            raise ValueError("Forecast dates cannot be before today.")

        if self.end_date > final_forecast_date:
            raise ValueError("Forecast weather is available for up to 16 days.")

        return self


class HistoricalWeatherRequest(CoordinatesRequest):
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_historical_dates(self) -> Self:
        earliest_supported_date = date(1940, 1, 1)

        if self.start_date > self.end_date:
            raise ValueError("Start date cannot be after end date.")

        if self.start_date < earliest_supported_date:
            raise ValueError("Historical weather is available from 1940 onward.")

        if self.end_date >= date.today():
            raise ValueError("Historical weather dates must be before today.")

        return self


class AirQualityRequest(CoordinatesRequest):
    forecast_days: int = Field(
        default=5,
        ge=1,
        le=7,
    )
