from datetime import date
from typing import Any

import httpx


class ForecastWeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    CURRENT_VARIABLES = (
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "is_day",
    )

    DAILY_VARIABLES = (
        "weather_code",
        "temperature_2m_min",
        "temperature_2m_max",
        "temperature_2m_mean",
        "apparent_temperature_min",
        "apparent_temperature_max",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
        "wind_gusts_10m_max",
        "sunrise",
        "sunset",
        "uv_index_max",
    )

    async def query(
        self,
        latitude: float,
        longitude: float,
        start_date: date,
        end_date: date,
        timezone: str = "auto",
    ) -> dict[str, Any]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "current": ",".join(self.CURRENT_VARIABLES),
            "daily": ",".join(self.DAILY_VARIABLES),
            "timezone": timezone,
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                self.BASE_URL,
                params=params,
            )

        response.raise_for_status()

        return response.json()
