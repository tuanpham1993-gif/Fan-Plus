from datetime import datetime, timezone
from extensions import db


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    content_id = db.Column(
        db.Integer,
        db.ForeignKey("contents.id"),
        nullable=False,
        unique=True
    )

    location_name = db.Column(
        db.String(255),
        nullable=False
    )

    city = db.Column(
        db.String(100),
        nullable=False
    )

    latitude = db.Column(
        db.Numeric(10, 7),
        nullable=False
    )

    longitude = db.Column(
        db.Numeric(10, 7),
        nullable=False
    )

    start_time = db.Column(
        db.DateTime,
        nullable=False
    )

    end_time = db.Column(
        db.DateTime,
        nullable=True
    )

    register_url = db.Column(
        db.String(500),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    content = db.relationship(
        "Content",
        back_populates="event"
    )