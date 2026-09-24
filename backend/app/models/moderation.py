from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer, JSON, ForeignKey, CheckConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, Identified, Timestamped, utcnow
class FanSubmission(Identified, Timestamped, Base):
    __tablename__ = "fan_submissions"
    __table_args__ = (CheckConstraint("status IN ('pending','approved','rejected')", name="status"), Index("ix_submissions_queue", "status", "created_at"))
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"))
    fandom_id: Mapped[str | None] = mapped_column(ForeignKey("fandoms.id", ondelete="RESTRICT"))
    title: Mapped[str] = mapped_column(String(180))
    body_markdown: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="pending")
    rejection_reason: Mapped[str] = mapped_column(String(1000), default="")
    version: Mapped[int] = mapped_column(Integer, default=1)
class ModerationAction(Identified, Base):
    __tablename__ = "moderation_actions"
    submission_id: Mapped[str] = mapped_column(ForeignKey("fan_submissions.id", ondelete="RESTRICT"), index=True)
    reviewer_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    decision: Mapped[str] = mapped_column(String(16))
    reason: Mapped[str] = mapped_column(String(1000), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
class AuditLog(Identified, Base):
    __tablename__ = "audit_logs"
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action: Mapped[str] = mapped_column(String(80))
    target_type: Mapped[str] = mapped_column(String(80))
    target_id: Mapped[str | None] = mapped_column(String(36))
    request_id: Mapped[str | None] = mapped_column(String(36))
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
