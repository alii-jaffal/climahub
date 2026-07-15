from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from app.database.models import WeatherRecord
from app.database.repository import (
    DailyWeatherCreateData,
    WeatherRecordCreateData,
    WeatherRecordRepository,
)
from app.schemas.weather_record import (
    WeatherRecordCoordinatesCreate,
    WeatherRecordCreate,
    WeatherRecordUpdate,
)
from app.services.forcast_weather_service import ForecastWeatherService
from app.services.geocoding_service import GeocodingService
from app.services.historical_weather_service import HistoricalWeatherService


class WeatherRecordServiceError(Exception):
    pass


class LocationNotFoundError(WeatherRecordServiceError):
    pass


class InvalidWeatherDateRangeError(WeatherRecordServiceError):
    pass


@dataclass(frozen=True)
class ResolvedLocation:
    location_query: str
    resolved_location: str
    latitude: float
    longitude: float
    timezone: str


class WeatherRecordService:
    DAILY_FIELD_MAP = {
        "temperature_min": "temperature_2m_min",
        "temperature_max": "temperature_2m_max",
        "temperature_mean": "temperature_2m_mean",
        "precipitation_sum": "precipitation_sum",
        "wind_speed_max": "wind_speed_10m_max",
        "weather_code": "weather_code",
        "sunrise": "sunrise",
        "sunset": "sunset",
    }

    def __init__(
        self,
        repository: WeatherRecordRepository,
        geocoding_service: GeocodingService | None = None,
        forecast_weather_service: ForecastWeatherService | None = None,
        historical_weather_service: HistoricalWeatherService | None = None,
    ) -> None:
        self.repository = repository
        self.geocoding_service = geocoding_service or GeocodingService()
        self.forecast_weather_service = (
            forecast_weather_service or ForecastWeatherService()
        )
        self.historical_weather_service = (
            historical_weather_service or HistoricalWeatherService()
        )

    async def create_record(
        self,
        payload: WeatherRecordCreate,
    ) -> WeatherRecord:
        resolved_location = await self._resolve_location(payload.location)
        weather_data = await self._fetch_weather_data(
            latitude=resolved_location.latitude,
            longitude=resolved_location.longitude,
            start_date=payload.start_date,
            end_date=payload.end_date,
            timezone=resolved_location.timezone,
        )
        daily_weather_rows = self._build_daily_weather_rows(weather_data)

        return self.repository.create(
            record_data=self._build_record_data(
                location_query=payload.location,
                start_date=payload.start_date,
                end_date=payload.end_date,
                notes=payload.notes,
                resolved_location=resolved_location,
                weather_data=weather_data,
            ),
            daily_weather_rows=daily_weather_rows,
        )

    async def create_record_from_coordinates(
        self,
        payload: WeatherRecordCoordinatesCreate,
    ) -> WeatherRecord:
        resolved_location = self._build_coordinate_location(
            latitude=payload.latitude,
            longitude=payload.longitude,
        )
        weather_data = await self._fetch_weather_data(
            latitude=resolved_location.latitude,
            longitude=resolved_location.longitude,
            start_date=payload.start_date,
            end_date=payload.end_date,
            timezone=resolved_location.timezone,
        )
        resolved_location = self._apply_provider_timezone(
            resolved_location,
            weather_data,
        )
        daily_weather_rows = self._build_daily_weather_rows(weather_data)

        return self.repository.create(
            record_data=self._build_record_data(
                location_query=resolved_location.location_query,
                start_date=payload.start_date,
                end_date=payload.end_date,
                notes=payload.notes,
                resolved_location=resolved_location,
                weather_data=weather_data,
            ),
            daily_weather_rows=daily_weather_rows,
        )

    def get_all_records(
        self,
        *,
        skip: int = 0,
        limit: int | None = 100,
    ) -> list[WeatherRecord]:
        return self.repository.get_all(skip=skip, limit=limit)

    def get_record_by_id(self, record_id: int) -> WeatherRecord | None:
        return self.repository.get_by_id(record_id)

    async def update_record(
        self,
        record_id: int,
        payload: WeatherRecordUpdate,
    ) -> WeatherRecord | None:
        record = self.repository.get_by_id(record_id)

        if record is None:
            return None

        updates = payload.model_dump(exclude_unset=True)

        if not updates:
            return record

        merged_payload = WeatherRecordCreate(
            location=updates.get("location", record.location_query),
            start_date=updates.get("start_date", record.start_date),
            end_date=updates.get("end_date", record.end_date),
            notes=updates.get("notes", record.notes),
        )

        weather_inputs_changed = (
            merged_payload.location != record.location_query
            or merged_payload.start_date != record.start_date
            or merged_payload.end_date != record.end_date
        )

        if not weather_inputs_changed:
            if "notes" not in updates:
                return record

            return self.repository.update(
                record,
                updates={"notes": merged_payload.notes},
            )

        if merged_payload.location == record.location_query:
            resolved_location = self._build_resolved_location_from_record(record)
        else:
            resolved_location = await self._resolve_location(merged_payload.location)

        weather_data = await self._fetch_weather_data(
            latitude=resolved_location.latitude,
            longitude=resolved_location.longitude,
            start_date=merged_payload.start_date,
            end_date=merged_payload.end_date,
            timezone=resolved_location.timezone,
        )
        resolved_location = self._apply_provider_timezone(
            resolved_location,
            weather_data,
        )
        daily_weather_rows = self._build_daily_weather_rows(weather_data)
        refreshed_parent_data = self._build_record_data(
            location_query=merged_payload.location,
            start_date=merged_payload.start_date,
            end_date=merged_payload.end_date,
            notes=merged_payload.notes,
            resolved_location=resolved_location,
            weather_data=weather_data,
        )

        for field_name, value in refreshed_parent_data.items():
            setattr(record, field_name, value)

        return self.repository.replace_daily_weather(
            record,
            daily_weather_rows=daily_weather_rows,
        )

    def delete_record(self, record_id: int) -> bool:
        record = self.repository.get_by_id(record_id)

        if record is None:
            return False

        self.repository.delete(record)
        return True

    def _build_record_data(
        self,
        *,
        location_query: str,
        start_date: date,
        end_date: date,
        notes: str | None,
        resolved_location: ResolvedLocation,
        weather_data: dict[str, Any],
    ) -> WeatherRecordCreateData:
        return {
            "location_query": location_query,
            "resolved_location": resolved_location.resolved_location,
            "latitude": resolved_location.latitude,
            "longitude": resolved_location.longitude,
            "timezone": resolved_location.timezone,
            "start_date": start_date,
            "end_date": end_date,
            "notes": notes,
            "weather_data": weather_data,
        }

    async def _resolve_location(self, location: str) -> ResolvedLocation:
        results = await self.geocoding_service.query(location)

        if not results:
            raise LocationNotFoundError(f"No location match found for '{location}'")

        best_result = self._select_best_result(location, results)
        latitude = best_result.get("latitude")
        longitude = best_result.get("longitude")
        name = best_result.get("name")

        if latitude is None or longitude is None or not name:
            raise LocationNotFoundError(
                f"Location match for '{location}' is missing required fields"
            )

        timezone = best_result.get("timezone") or "auto"

        return ResolvedLocation(
            location_query=location,
            resolved_location=self._build_resolved_location_name(best_result),
            latitude=float(latitude),
            longitude=float(longitude),
            timezone=timezone,
        )

    def _select_best_result(
        self,
        location: str,
        results: list[dict[str, Any]],
    ) -> dict[str, Any]:
        normalized_location = location.casefold()
        exact_matches = [
            result
            for result in results
            if str(result.get("name", "")).casefold() == normalized_location
        ]
        candidates = exact_matches or results

        for result in candidates:
            if (
                result.get("name")
                and result.get("latitude") is not None
                and result.get("longitude") is not None
            ):
                return result

        return candidates[0]

    def _build_resolved_location_name(self, result: dict[str, Any]) -> str:
        parts = [
            result.get("name"),
            result.get("admin1"),
            result.get("country"),
        ]

        return ", ".join(part for part in parts if part)

    def _build_coordinate_location(
        self,
        *,
        latitude: float,
        longitude: float,
    ) -> ResolvedLocation:
        coordinate_query = self._format_coordinate_query(latitude, longitude)

        return ResolvedLocation(
            location_query=coordinate_query,
            resolved_location=f"Current location ({coordinate_query})",
            latitude=latitude,
            longitude=longitude,
            timezone="auto",
        )

    def _build_resolved_location_from_record(
        self,
        record: WeatherRecord,
    ) -> ResolvedLocation:
        return ResolvedLocation(
            location_query=record.location_query,
            resolved_location=record.resolved_location,
            latitude=record.latitude,
            longitude=record.longitude,
            timezone=record.timezone,
        )

    def _apply_provider_timezone(
        self,
        resolved_location: ResolvedLocation,
        weather_data: dict[str, Any],
    ) -> ResolvedLocation:
        provider_timezone = weather_data.get("timezone")

        if not provider_timezone or provider_timezone == resolved_location.timezone:
            return resolved_location

        return ResolvedLocation(
            location_query=resolved_location.location_query,
            resolved_location=resolved_location.resolved_location,
            latitude=resolved_location.latitude,
            longitude=resolved_location.longitude,
            timezone=str(provider_timezone),
        )

    def _format_coordinate_query(self, latitude: float, longitude: float) -> str:
        return f"{latitude:.4f}, {longitude:.4f}"

    async def _fetch_weather_data(
        self,
        *,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
        timezone: str,
    ) -> dict[str, Any]:
        weather_service = self._select_weather_service(
            start_date=start_date,
            end_date=end_date,
        )

        return await weather_service.query(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
            timezone=timezone,
        )

    def _select_weather_service(
        self,
        *,
        start_date: date,
        end_date: date,
    ) -> HistoricalWeatherService | ForecastWeatherService:
        today = date.today()

        if start_date > end_date:
            raise InvalidWeatherDateRangeError(
                "start_date must be less than or equal to end_date"
            )

        if start_date < today <= end_date:
            raise InvalidWeatherDateRangeError(
                "Date ranges that cross today are not supported"
            )

        if end_date < today:
            return self.historical_weather_service

        return self.forecast_weather_service

    def _build_daily_weather_rows(
        self,
        weather_data: dict[str, Any],
    ) -> list[DailyWeatherCreateData]:
        daily_data = weather_data.get("daily")

        if not isinstance(daily_data, dict):
            raise ValueError("Weather provider response is missing daily data")

        dates = daily_data.get("time")

        if not isinstance(dates, list) or not dates:
            raise ValueError("Weather provider response did not include daily dates")

        rows: list[DailyWeatherCreateData] = []

        for index, raw_weather_date in enumerate(dates):
            row: DailyWeatherCreateData = {
                "weather_date": self._parse_date(raw_weather_date),
            }

            for target_field, source_field in self.DAILY_FIELD_MAP.items():
                raw_value = self._get_daily_value(daily_data, source_field, index)

                if raw_value is None:
                    continue

                if target_field in {"sunrise", "sunset"}:
                    row[target_field] = self._parse_datetime(raw_value)
                elif target_field == "weather_code":
                    row[target_field] = int(raw_value)
                else:
                    row[target_field] = float(raw_value)

            rows.append(row)

        return rows

    def _get_daily_value(
        self,
        daily_data: dict[str, Any],
        field_name: str,
        index: int,
    ) -> Any:
        values = daily_data.get(field_name)

        if not isinstance(values, list) or index >= len(values):
            return None

        return values[index]

    def _parse_date(self, raw_value: Any) -> date:
        if isinstance(raw_value, date) and not isinstance(raw_value, datetime):
            return raw_value

        if isinstance(raw_value, str):
            return date.fromisoformat(raw_value)

        raise ValueError("Invalid weather date in provider response")

    def _parse_datetime(self, raw_value: Any) -> datetime:
        if isinstance(raw_value, datetime):
            return raw_value

        if isinstance(raw_value, str):
            return datetime.fromisoformat(raw_value)

        raise ValueError("Invalid datetime in provider response")
