from pydantic import BaseModel, Field, field_validator


class LocationSearchRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=255,
        examples=["Beirut"],
    )

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()

        return value


class CoordinatesRequest(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90,
        examples=[33.8938],
    )

    longitude: float = Field(
        ge=-180,
        le=180,
        examples=[35.5018],
    )

    timezone: str = Field(
        default="auto",
        min_length=1,
        max_length=100,
        examples=["Asia/Beirut"],
    )


class LocationResult(BaseModel):
    name: str
    latitude: float
    longitude: float

    country: str | None = None
    country_code: str | None = None
    admin1: str | None = None
    timezone: str | None = None
    population: int | None = None
