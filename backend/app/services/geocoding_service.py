from typing import Any

import httpx


class GeocodingService:
    BASE_URL = "https://geocoding-api.open-meteo.com/v1/search"
    RESULT_LIMIT = 5

    async def query(
        self,
        name: str,
    ) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                self.BASE_URL,
                params={
                    "name": name,
                    "count": self.RESULT_LIMIT,
                    "language": "en",
                    "format": "json",
                },
            )

        response.raise_for_status()

        data = response.json()

        return data.get("results", [])
