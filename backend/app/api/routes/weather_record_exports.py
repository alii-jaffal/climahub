import csv
import json
from datetime import datetime
from enum import Enum
from io import StringIO
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import get_weather_record_service
from app.schemas.weather_record import WeatherRecordResponse
from app.services.weather_record_service import WeatherRecordService


class ExportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"


router = APIRouter(
    prefix="/api/weather-records",
    tags=["Weather Records"],
)

EXPORT_RECORDS_RESPONSES = {
    500: {"description": "Unexpected database failure"},
}

CSV_COLUMNS = (
    "record_id",
    "resolved_location",
    "latitude",
    "longitude",
    "start_date",
    "end_date",
    "weather_date",
    "temperature_min",
    "temperature_max",
    "precipitation_sum",
    "wind_speed_max",
    "weather_code",
)


@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    responses=EXPORT_RECORDS_RESPONSES,
)
async def export_weather_records(
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
    format: Annotated[ExportFormat, Query(alias="format")] = ExportFormat.JSON,
) -> Response:
    try:
        records = service.get_all_records(limit=None)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    if format == ExportFormat.CSV:
        content = _build_csv_export(records)
        filename = f"weather-records-{timestamp}.csv"
        media_type = "text/csv; charset=utf-8"
    else:
        content = _build_json_export(records)
        filename = f"weather-records-{timestamp}.json"
        media_type = "application/json"

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


def _build_json_export(records: list[Any]) -> str:
    payload = [
        WeatherRecordResponse.model_validate(record).model_dump(mode="json")
        for record in records
    ]
    return json.dumps(payload, indent=2)


def _build_csv_export(records: list[Any]) -> str:
    buffer = StringIO()
    writer = csv.DictWriter(buffer, fieldnames=CSV_COLUMNS)
    writer.writeheader()

    for record in records:
        validated_record = WeatherRecordResponse.model_validate(record)

        for daily_row in validated_record.daily_weather:
            writer.writerow(
                {
                    "record_id": validated_record.record_id,
                    "resolved_location": validated_record.resolved_location,
                    "latitude": validated_record.latitude,
                    "longitude": validated_record.longitude,
                    "start_date": validated_record.start_date.isoformat(),
                    "end_date": validated_record.end_date.isoformat(),
                    "weather_date": daily_row.weather_date.isoformat(),
                    "temperature_min": daily_row.temperature_min,
                    "temperature_max": daily_row.temperature_max,
                    "precipitation_sum": daily_row.precipitation_sum,
                    "wind_speed_max": daily_row.wind_speed_max,
                    "weather_code": daily_row.weather_code,
                }
            )

    return buffer.getvalue()


__all__ = ["router"]
