from datetime import date
from typing import Any

import httpx


class HistoricalWeatherService:
    BASE_URL = "https://archive-api.open-meteo.com/v1/archive"

    DAILY_VARIABLES = (
        "weather_code",
        "temperature_2m_min",
        "temperature_2m_max",
        "temperature_2m_mean",
        "apparent_temperature_min",
        "apparent_temperature_max",
        "precipitation_sum",
        "wind_speed_10m_max",
        "wind_gusts_10m_max",
        "sunrise",
        "sunset",
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
