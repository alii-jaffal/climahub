from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import get_weather_record_service
from app.schemas.weather_record import (
    WeatherRecordCoordinatesCreate,
    WeatherRecordCreate,
    WeatherRecordListResponse,
    WeatherRecordResponse,
    WeatherRecordUpdate,
)
from app.services.weather_record_service import (
    InvalidWeatherDateRangeError,
    LocationNotFoundError,
    WeatherRecordService,
)

router = APIRouter(
    prefix="/api/weather-records",
    tags=["Weather Records"],
)

LIST_RECORDS_RESPONSES = {
    500: {"description": "Unexpected database failure"},
}

WRITE_RECORD_RESPONSES = {
    404: {"description": "Location not found or stored record not found"},
    422: {"description": "Pydantic validation failure"},
    502: {"description": "Open-Meteo HTTP failure"},
    504: {"description": "Open-Meteo timeout"},
    500: {"description": "Unexpected database failure"},
}

READ_RECORD_RESPONSES = {
    404: {"description": "Stored record not found"},
    500: {"description": "Unexpected database failure"},
}


@router.post(
    "",
    response_model=WeatherRecordResponse,
    status_code=status.HTTP_201_CREATED,
    responses=WRITE_RECORD_RESPONSES,
)
async def create_weather_record(
    payload: WeatherRecordCreate,
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
) -> WeatherRecordResponse:
    try:
        return await service.create_record(payload)
    except LocationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidWeatherDateRangeError as exc:
        raise RequestValidationError(
            [{"loc": ("body",), "msg": str(exc), "type": "value_error"}]
        ) from exc
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Open-Meteo request timed out",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Open-Meteo request failed",
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc


@router.post(
    "/coordinates",
    response_model=WeatherRecordResponse,
    status_code=status.HTTP_201_CREATED,
    responses=WRITE_RECORD_RESPONSES,
)
async def create_weather_record_from_coordinates(
    payload: WeatherRecordCoordinatesCreate,
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
) -> WeatherRecordResponse:
    try:
        return await service.create_record_from_coordinates(payload)
    except InvalidWeatherDateRangeError as exc:
        raise RequestValidationError(
            [{"loc": ("body",), "msg": str(exc), "type": "value_error"}]
        ) from exc
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Open-Meteo request timed out",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Open-Meteo request failed",
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc


@router.get(
    "",
    response_model=WeatherRecordListResponse,
    status_code=status.HTTP_200_OK,
    responses=LIST_RECORDS_RESPONSES,
)
async def list_weather_records(
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> WeatherRecordListResponse:
    try:
        records = service.get_all_records(skip=skip, limit=limit)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc

    return WeatherRecordListResponse(records=records)


@router.get(
    "/{record_id}",
    response_model=WeatherRecordResponse,
    status_code=status.HTTP_200_OK,
    responses=READ_RECORD_RESPONSES,
)
async def get_weather_record(
    record_id: int,
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
) -> WeatherRecordResponse:
    try:
        record = service.get_record_by_id(record_id)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weather record {record_id} was not found",
        )

    return record


@router.patch(
    "/{record_id}",
    response_model=WeatherRecordResponse,
    status_code=status.HTTP_200_OK,
    responses=WRITE_RECORD_RESPONSES,
)
async def update_weather_record(
    record_id: int,
    payload: WeatherRecordUpdate,
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
) -> WeatherRecordResponse:
    try:
        record = await service.update_record(record_id, payload)
    except LocationNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except InvalidWeatherDateRangeError as exc:
        raise RequestValidationError(
            [{"loc": ("body",), "msg": str(exc), "type": "value_error"}]
        ) from exc
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Open-Meteo request timed out",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Open-Meteo request failed",
        ) from exc
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weather record {record_id} was not found",
        )

    return record


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=READ_RECORD_RESPONSES,
)
async def delete_weather_record(
    record_id: int,
    service: Annotated[WeatherRecordService, Depends(get_weather_record_service)],
) -> Response:
    try:
        deleted = service.delete_record(record_id)
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database operation failed",
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Weather record {record_id} was not found",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


__all__ = ["router"]
