from typing import Any

import httpx


class AirQualityService:
    BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

    CURRENT_VARIABLES = (
        "us_aqi",
        "european_aqi",
        "pm2_5",
        "pm10",
        "carbon_monoxide",
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "ozone",
        "dust",
        "uv_index",
    )

    HOURLY_VARIABLES = (
        "us_aqi",
        "european_aqi",
        "pm2_5",
        "pm10",
        "ozone",
        "dust",
        "uv_index",
    )

    async def query(
        self,
        latitude: float,
        longitude: float,
        timezone: str = "auto",
        forecast_days: int = 5,
    ) -> dict[str, Any]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join(self.CURRENT_VARIABLES),
            "hourly": ",".join(self.HOURLY_VARIABLES),
            "timezone": timezone,
            "forecast_days": forecast_days,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                self.BASE_URL,
                params=params,
            )

        response.raise_for_status()

        return response.json()
