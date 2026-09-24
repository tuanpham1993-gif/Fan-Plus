from datetime import datetime, date
from sqlalchemy import String, Text, DateTime, Date, Integer, Boolean, Numeric, ForeignKey, ForeignKeyConstraint, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped
class Resource(Identified, Timestamped, Base):
    __tablename__ = "resources"
    __table_args__ = (
        CheckConstraint("kind IN ('article','character','video','audio','gallery','merchandise','event')", name="kind"),
        CheckConstraint("status IN ('draft','published','archived')", name="status"),
        CheckConstraint("release_year IS NULL OR (release_year >= 1900 AND release_year <= 2100)", name="release_year"),
        CheckConstraint("version > 0", name="version"),
        ForeignKeyConstraint(["fandom_id","category_id"], ["fandom_categories.fandom_id","fandom_categories.category_id"], ondelete="RESTRICT"),
        Index("ix_resources_public_feed", "status", "published_at", "id"),
        Index("ix_resources_category_kind", "category_id", "kind", "status"),
    )
    slug: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    summary: Mapped[str] = mapped_column(String(600), nullable=False)
    body_markdown: Mapped[str] = mapped_column(Text, default="", nullable=False)
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    fandom_id: Mapped[str | None] = mapped_column(String(36))
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    cover_media_id: Mapped[str | None] = mapped_column(ForeignKey("media_assets.id", ondelete="RESTRICT"))
    status: Mapped[str] = mapped_column(String(16), default="draft", nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime)
    release_year: Mapped[int | None] = mapped_column(Integer)
    has_spoilers: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    spoiler_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000))
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    submission_id: Mapped[str | None] = mapped_column(ForeignKey("fan_submissions.id", ondelete="RESTRICT"), unique=True)
class ResourceGenre(Base):
    __tablename__ = "resource_genres"
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    genre_id: Mapped[str] = mapped_column(ForeignKey("genres.id", ondelete="RESTRICT"), primary_key=True)
class ResourceTag(Base):
    __tablename__ = "resource_tags"
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[str] = mapped_column(ForeignKey("tags.id", ondelete="RESTRICT"), primary_key=True)
class CharacterProfile(Base):
    __tablename__ = "character_profiles"
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120))
    continuity: Mapped[str] = mapped_column(String(120), default="Original")
    biography_markdown: Mapped[str] = mapped_column(Text, default="")
class MerchandiseItem(Base):
    __tablename__ = "merchandise_items"
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    maker: Mapped[str] = mapped_column(String(120), default="")
    edition: Mapped[str] = mapped_column(String(100), default="")
    official_url: Mapped[str | None] = mapped_column(String(1000))
    # No price, basket, payment or order tables: showcase only.
class EventDetail(Base):
    __tablename__ = "event_details"
    __table_args__ = (CheckConstraint("ends_at > starts_at", name="time_range"), CheckConstraint("latitude >= -90 AND latitude <= 90", name="latitude"), CheckConstraint("longitude >= -180 AND longitude <= 180", name="longitude"), Index("ix_event_city_start", "city", "starts_at"))
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    city: Mapped[str] = mapped_column(String(100))
    venue: Mapped[str] = mapped_column(String(255))
    latitude: Mapped[float] = mapped_column(Numeric(9,6))
    longitude: Mapped[float] = mapped_column(Numeric(9,6))
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    timezone_name: Mapped[str] = mapped_column(String(64), default="Asia/Ho_Chi_Minh")
    ticket_url: Mapped[str | None] = mapped_column(String(1000))
    cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
class UpcomingRelease(Identified, Timestamped, Base):
    __tablename__ = "upcoming_releases"
    __table_args__ = (Index("ix_release_date", "release_date", "resource_id"),)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"))
    release_date: Mapped[date] = mapped_column(Date)
    region: Mapped[str] = mapped_column(String(80), default="Global")
    date_precision: Mapped[str] = mapped_column(String(12), default="day")
    source_url: Mapped[str | None] = mapped_column(String(1000))
