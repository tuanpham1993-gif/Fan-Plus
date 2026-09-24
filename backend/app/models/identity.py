from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, Numeric, Boolean, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped, utcnow

class User(Identified, Timestamped, Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('member','admin')", name="role"),)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(16), default="member", nullable=False)
    bio: Mapped[str] = mapped_column(Text, default="", nullable=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime)
    avatar_media_id: Mapped[str | None] = mapped_column(ForeignKey("media_assets.id", use_alter=True, ondelete="SET NULL"))

class UserSetting(Base):
    __tablename__ = "user_settings"
    __table_args__ = (CheckConstraint("theme IN ('light','dark','system')", name="theme"), CheckConstraint("font_scale IN (100,112.5,125)", name="font_scale"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme: Mapped[str] = mapped_column(String(8), default="light", nullable=False)
    font_scale: Mapped[float] = mapped_column(Numeric(4,1), default=100, nullable=False)
    spoiler_safe: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class UserCategory(Base):
    __tablename__ = "user_categories"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True)
class UserFandom(Base):
    __tablename__ = "user_fandoms"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    fandom_id: Mapped[str] = mapped_column(ForeignKey("fandoms.id", ondelete="CASCADE"), primary_key=True)

class AuthSession(Base):
    __tablename__ = "auth_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)

class OneTimeToken(Identified, Base):
    __tablename__ = "one_time_tokens"
    __table_args__ = (CheckConstraint("purpose IN ('verify_email','reset_password')", name="purpose"),)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    purpose: Mapped[str] = mapped_column(String(24), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
