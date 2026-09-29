from datetime import datetime, timezone

from extensions import db


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    session_id = db.Column(
        db.Integer,
        db.ForeignKey("chat_sessions.id"),
        nullable=False
    )

    role = db.Column(
        db.Enum("user", "assistant"),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    session = db.relationship(
        "ChatSession",
        back_populates="messages"
    )