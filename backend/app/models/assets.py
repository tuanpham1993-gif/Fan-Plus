from sqlalchemy import String, Integer, Boolean, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped
class MediaAsset(Identified, Timestamped, Base):
    __tablename__ = "media_assets"
    __table_args__ = (CheckConstraint("kind IN ('image','video','audio','caption')", name="kind"), CheckConstraint("byte_size >= 0", name="byte_size"))
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", use_alter=True, ondelete="SET NULL"))
    kind: Mapped[str] = mapped_column(String(12))
    storage_key: Mapped[str] = mapped_column(String(255), unique=True)
    mime_type: Mapped[str] = mapped_column(String(100))
    byte_size: Mapped[int] = mapped_column(Integer, default=0)
    alt_text: Mapped[str] = mapped_column(String(300), default="")
    source_url: Mapped[str | None] = mapped_column(String(1000))
    attribution: Mapped[str] = mapped_column(String(300), default="")
    license_label: Mapped[str] = mapped_column(String(120), default="Unverified")
    approved: Mapped[bool] = mapped_column(Boolean, default=False)
class ResourceMedia(Base):
    __tablename__ = "resource_media"
    resource_id: Mapped[str] = mapped_column(ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True)
    media_id: Mapped[str] = mapped_column(ForeignKey("media_assets.id", ondelete="RESTRICT"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
