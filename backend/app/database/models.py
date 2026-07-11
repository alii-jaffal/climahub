from app.database.connection import Base
from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    __table_args__ = (
        CheckConstraint(
            "start_date <= end_date",
            name="check_valid_date_range",
        ),
        CheckConstraint(
            "latitude BETWEEN -90 AND 90",
            name="check_valid_latitude",
        ),
        CheckConstraint(
            "longitude BETWEEN -180 AND 180",
            name="check_valid_longitude",
        ),
    )

    record_id = Column(Integer, primary_key=True, index=True)
    location_query = Column(String(255), nullable=False)
    resolved_location = Column(String(255), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    weather_data = Column(JSONB, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    daily_weather = relationship(
        "DailyWeather",
        back_populates="weather_record",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DailyWeather(Base):
    __tablename__ = "daily_weather"

    __table_args__ = (
        UniqueConstraint(
            "weather_record_id",
            "weather_date",
            name="unique_weather_record_date",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    weather_record_id = Column(
        Integer,
        ForeignKey("weather_records.record_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    weather_date = Column(Date, nullable=False, index=True)
    temperature_min = Column(Float, nullable=True)
    temperature_max = Column(Float, nullable=True)
    temperature_mean = Column(Float, nullable=True)
    precipitation_sum = Column(Float, nullable=True)
    wind_speed_max = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    sunrise = Column(DateTime(timezone=True), nullable=True)
    sunset = Column(DateTime(timezone=True), nullable=True)

    weather_record = relationship(
        "WeatherRecord",
        back_populates="daily_weather",
    )
