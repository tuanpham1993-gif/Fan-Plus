from datetime import datetime, timezone

from extensions import db


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    messages = db.relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan"
    )