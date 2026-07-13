"""create weather tables

Revision ID: 6b01eb27be89
Revises:
Create Date: 2026-07-13 12:37:41.131053
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "6b01eb27be89"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create the ClimaHub weather tables."""

    op.create_table(
        "weather_records",
        sa.Column(
            "record_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "location_query",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "resolved_location",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "latitude",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "longitude",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "timezone",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "start_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "end_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "weather_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "latitude BETWEEN -90 AND 90",
            name="check_valid_latitude",
        ),
        sa.CheckConstraint(
            "longitude BETWEEN -180 AND 180",
            name="check_valid_longitude",
        ),
        sa.CheckConstraint(
            "start_date <= end_date",
            name="check_valid_date_range",
        ),
        sa.PrimaryKeyConstraint("record_id"),
    )

    op.create_index(
        op.f("ix_weather_records_resolved_location"),
        "weather_records",
        ["resolved_location"],
        unique=False,
    )

    op.create_table(
        "daily_weather",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "weather_record_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "weather_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "temperature_min",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "temperature_max",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "temperature_mean",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "precipitation_sum",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "wind_speed_max",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "weather_code",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "sunrise",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "sunset",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["weather_record_id"],
            ["weather_records.record_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "weather_record_id",
            "weather_date",
            name="unique_weather_record_date",
        ),
    )

    op.create_index(
        op.f("ix_daily_weather_weather_date"),
        "daily_weather",
        ["weather_date"],
        unique=False,
    )

    op.create_index(
        op.f("ix_daily_weather_weather_record_id"),
        "daily_weather",
        ["weather_record_id"],
        unique=False,
    )


def downgrade() -> None:
    """Remove the ClimaHub weather tables."""

    op.drop_index(
        op.f("ix_daily_weather_weather_record_id"),
        table_name="daily_weather",
    )

    op.drop_index(
        op.f("ix_daily_weather_weather_date"),
        table_name="daily_weather",
    )

    op.drop_table("daily_weather")

    op.drop_index(
        op.f("ix_weather_records_resolved_location"),
        table_name="weather_records",
    )

    op.drop_table("weather_records")
