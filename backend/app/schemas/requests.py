from datetime import datetime, timezone
from typing import Literal
from urllib.parse import urlsplit
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
class RegisterInput(Input):
    email: str = Field(min_length=3, max_length=254)
    display_name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=12, max_length=128)
    @field_validator("email")
    @classmethod
    def email_shape(cls, value):
        # Shape validation is not proof of ownership; verify by a one-time link.
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value.casefold()
    @field_validator("display_name", mode="before")
    @classmethod
    def clean_display_name(cls, value):
        return value.strip() if isinstance(value, str) else value
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)
class LoginInput(Input):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)
class ResourceInput(Input):
    title: str = Field(min_length=3, max_length=180)
    summary: str = Field(min_length=12, max_length=600)
    body_markdown: str = Field(default="", max_length=30000)
    kind: Literal["article","character","video","audio","gallery","merchandise"] = "article"
    category_id: str = Field(min_length=1, max_length=36)
    fandom_id: str | None = Field(default=None, max_length=36)
    cover_media_id: str | None = Field(default=None, max_length=36)
    release_year: int | None = Field(default=None, ge=1900, le=2100, strict=True)
    has_spoilers: bool = False
    status: Literal["draft","published"] = "draft"
class SubmissionInput(Input):
    title: str = Field(min_length=3, max_length=180)
    category_id: str = Field(min_length=1, max_length=36)
    fandom_id: str | None = Field(default=None, max_length=36)
    body_markdown: str = Field(min_length=100, max_length=30000)
    ownership_confirmed: Literal[True]
class DecisionInput(Input):
    decision: Literal["approve","reject"]
    expected_version: int = Field(ge=1, strict=True)
    reason: str = Field(default="", max_length=1000)
    @model_validator(mode="after")
    def rejection_requires_reason(self):
        if self.decision == "reject" and len(self.reason.strip()) < 10:
            raise ValueError("A rejection needs at least 10 characters of feedback")
        return self
class BookmarkInput(Input):
    note: str = Field(default="", max_length=5000)
class RatingInput(Input):
    value: int = Field(ge=1, le=5, strict=True)
class FeedbackInput(Input):
    kind: Literal["bug","suggestion","query"]
    message: str = Field(min_length=10, max_length=5000)
class ProfileInput(Input):
    display_name: str = Field(min_length=2, max_length=80)
    bio: str = Field(default="", max_length=1000)
class EventInput(Input):
    title: str = Field(min_length=3, max_length=180)
    summary: str = Field(min_length=12, max_length=600)
    category_id: str = Field(min_length=1, max_length=36)
    city: str = Field(min_length=2, max_length=100)
    venue: str = Field(min_length=2, max_length=255)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    starts_at: datetime
    ends_at: datetime
    timezone_name: str = "Asia/Ho_Chi_Minh"
    ticket_url: str | None = Field(default=None, max_length=1000)
    @field_validator("starts_at","ends_at")
    @classmethod
    def explicit_zone(cls, value):
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Include a timezone offset")
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    @field_validator("timezone_name")
    @classmethod
    def valid_timezone(cls, value):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try: ZoneInfo(value)
        except (ValueError, ZoneInfoNotFoundError): raise ValueError("Unknown IANA timezone")
        return value
    @field_validator("ticket_url")
    @classmethod
    def safe_ticket_url(cls, value):
        if value is None: return value
        p = urlsplit(value)
        if p.scheme != "https" or not p.hostname or p.username or p.password:
            raise ValueError("Use an HTTPS URL without embedded credentials")
        return value
    @model_validator(mode="after")
    def valid_time_range(self):
        if self.ends_at <= self.starts_at:
            raise ValueError("Event end must be after start")
        return self
class PageQuery(Input):
    page: int = Field(default=1, ge=1, le=10000)
    page_size: int = Field(default=12, ge=1, le=50)
class SearchQuery(PageQuery):
    q: str = Field(default="", max_length=160)
    category_id: str | None = None
    fandom_id: str | None = None
    kind: Literal["article","character","video","audio","gallery","merchandise","event"] | None = None
    release_year: int | None = Field(default=None, ge=1900, le=2100)
    genre_id: str | None = None
    sort: Literal["latest","popular","az"] = "latest"
class EventQuery(PageQuery):
    city: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90, allow_inf_nan=False)
    longitude: float | None = Field(default=None, ge=-180, le=180, allow_inf_nan=False)
    radius_km: float = Field(default=50, gt=0, le=500, allow_inf_nan=False)
    @model_validator(mode="after")
    def coordinate_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("Supply both latitude and longitude")
        return self

class EmailInput(Input):
    email: str = Field(min_length=3, max_length=254)
class TokenInput(Input):
    token: str = Field(min_length=20, max_length=200)
class PasswordResetInput(TokenInput):
    password: str = Field(min_length=12, max_length=128)
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)
class VersionInput(Input):
    expected_version: int = Field(ge=1, strict=True)
class ResourceUpdateInput(ResourceInput):
    expected_version: int = Field(ge=1, strict=True)
class FeedbackStatusInput(Input):
    status: Literal["open","in_progress","resolved"]
class SuspendInput(Input):
    suspended: bool
