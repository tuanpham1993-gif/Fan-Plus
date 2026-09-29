from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from datetime import datetime
from typing import Optional
from decimal import Decimal
from urllib.parse import urlparse

from utils.event_time import parse_event_datetime, vn_iso, utc_iso

EVENT_STATUSES = ("PENDING", "DONE", "REJECTED")


def _clean_text(value):
    if value is None:
        return None
    value = str(value).strip()
    return value or None


def _check_register_url(value):
    if value is None:
        return None
    parsed = urlparse(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ValueError("register_url must be an http(s) link")
    return value


def _parse_time(value):
    if value is None or isinstance(value, datetime):
        return value
    try:
        return parse_event_datetime(value)
    except ValueError:
        raise ValueError("Use ISO format like 2026-10-01T08:00:00+07:00")


class EventCreate(BaseModel):
    """Fields of the multipart POST /events form."""

    title: str = Field(min_length=3, max_length=255)
    body: str = Field(min_length=1, max_length=5000)
    category_id: int
    city: str = Field(min_length=1, max_length=100)
    location_name: str = Field(min_length=1, max_length=255)
    latitude: Decimal = Field(ge=-90, le=90)
    longitude: Decimal = Field(ge=-180, le=180)
    start_time: datetime
    end_time: Optional[datetime] = None
    register_url: Optional[str] = Field(default=None, max_length=500)

    clean_text_fields = field_validator(
        "title", "body", "city", "location_name", "register_url", mode="before"
    )(_clean_text)
    parse_time_fields = field_validator("start_time", "end_time", mode="before")(_parse_time)
    check_register_url = field_validator("register_url")(_check_register_url)

    @model_validator(mode="after")
    def check_end_after_start(self):
        if self.end_time is not None and self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


class EventUpdate(BaseModel):
    """JSON body of PUT /events/<id>. Omitted fields are left unchanged."""

    title: Optional[str] = Field(default=None, min_length=3, max_length=255)
    body: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    category_id: Optional[int] = None
    location_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    city: Optional[str] = Field(default=None, min_length=1, max_length=100)
    latitude: Optional[Decimal] = Field(default=None, ge=-90, le=90)
    longitude: Optional[Decimal] = Field(default=None, ge=-180, le=180)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    register_url: Optional[str] = Field(default=None, max_length=500)

    clean_text_fields = field_validator(
        "title", "body", "city", "location_name", "register_url", mode="before"
    )(_clean_text)
    parse_time_fields = field_validator("start_time", "end_time", mode="before")(_parse_time)
    check_register_url = field_validator("register_url")(_check_register_url)


class EventStatusUpdate(BaseModel):
    status: str

    @field_validator("status", mode="before")
    @classmethod
    def check_known_status(cls, value):
        value = str(value or "").strip().upper()
        if value not in EVENT_STATUSES:
            raise ValueError("status must be one of PENDING, DONE, REJECTED")
        return value


class EventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content_id: int
    location_name: str
    city: str
    latitude: Decimal
    longitude: Decimal
    start_time: datetime
    end_time: Optional[datetime]
    register_url: Optional[str]
    created_at: datetime
    updated_at: datetime


def media_public_url(media_url):
    if not media_url:
        return None
    url = media_url.replace("\\", "/")
    if url.startswith(("http://", "https://", "/")):
        return url
    return "/" + url


def serialize_event(event, author=None, category=None):
    """Full event payload shared by list, detail, create and update responses."""
    content = event.content
    image = next(
        (m for m in sorted(content.medias, key=lambda m: m.display_order)
         if m.media_type == "IMAGE"),
        None,
    )
    return {
        "id": event.id,
        "content_id": event.content_id,
        "location_name": event.location_name,
        "city": event.city,
        "latitude": float(event.latitude),
        "longitude": float(event.longitude),
        "start_time": vn_iso(event.start_time),
        "end_time": vn_iso(event.end_time),
        "register_url": event.register_url,
        "image_url": media_public_url(image.media_url) if image else None,
        "created_at": utc_iso(event.created_at),
        "updated_at": utc_iso(event.updated_at),
        "content": {
            "id": content.id,
            "title": content.title,
            "body": content.body,
            "category_id": content.category_id,
            "category_name": category.name if category else None,
            "author_id": content.author_id,
            "author_name": author.name if author else None,
            "content_type": content.content_type,
            "status": content.status,
        },
    }
