from datetime import datetime, date
from sqlalchemy import String, Text, DateTime, Date, Integer, ForeignKey, CheckConstraint, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped, utcnow
class Bookmark(Identified, Timestamped, Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "resource_id"), Index("ix_bookmarks_user_created", "user_id", "created_at"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"))
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (CheckConstraint("value >= 1 AND value <= 5", name="value"),)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    value: Mapped[int] = mapped_column(Integer)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
class Activity(Identified, Base):
    __tablename__ = "activities"
    __table_args__ = (UniqueConstraint("user_id", "resource_id", "day"),)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"))
    day: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
class Feedback(Identified, Timestamped, Base):
    __tablename__ = "feedback"
    __table_args__ = (CheckConstraint("kind IN ('bug','suggestion','query')", name="kind"), CheckConstraint("status IN ('open','in_progress','resolved')", name="status"))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    kind: Mapped[str] = mapped_column(String(16))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="open")
    resolution_note: Mapped[str] = mapped_column(Text, default="")
