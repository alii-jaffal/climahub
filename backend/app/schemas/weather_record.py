from datetime import date, datetime
from typing import Any, Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class WeatherRecordCreate(BaseModel):
    location: str
    start_date: date
    end_date: date
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("location", mode="before")
    @classmethod
    def clean_location(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()

        return value

    @field_validator("location")
    @classmethod
    def validate_location(cls, value: str) -> str:
        if not value:
            raise ValueError("Location must not be empty")

        return value

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be less than or equal to end_date")

        return self


class WeatherRecordCoordinatesCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    start_date: date
    end_date: date
    notes: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be less than or equal to end_date")

        return self


class WeatherRecordUpdate(BaseModel):
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("location", mode="before")
    @classmethod
    def clean_location(cls, value: Any) -> Any:
        if isinstance(value, str):
            return value.strip()

        return value

    @field_validator("location")
    @classmethod
    def validate_location(cls, value: str | None) -> str | None:
        if value == "":
            raise ValueError("Location must not be empty")

        return value

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.start_date > self.end_date
        ):
            raise ValueError("start_date must be less than or equal to end_date")

        return self


class DailyWeatherResponse(BaseModel):
    id: int
    weather_date: date
    temperature_min: float | None = None
    temperature_max: float | None = None
    temperature_mean: float | None = None
    precipitation_sum: float | None = None
    wind_speed_max: float | None = None
    weather_code: int | None = None
    sunrise: datetime | None = None
    sunset: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class WeatherRecordResponse(BaseModel):
    record_id: int
    location_query: str
    resolved_location: str
    latitude: float
    longitude: float
    timezone: str
    start_date: date
    end_date: date
    notes: str | None = None
    weather_data: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    daily_weather: list[DailyWeatherResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class WeatherRecordListResponse(BaseModel):
    records: list[WeatherRecordResponse] = Field(default_factory=list)
