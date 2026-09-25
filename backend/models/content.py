from extensions import db
from datetime import datetime, timezone
from sqlalchemy import Enum

class Content(db.Model):
    __tablename__ = "contents"

    id = db.Column(db.Integer, primary_key=True)

    author_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id"),
        nullable=False
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    body = db.Column(
        db.Text,
        nullable=False
    )

    content_type = db.Column(
        db.Enum("NEWS", "ARTICLE", "EVENT", "POST"),
        nullable=False,
        default="ARTICLE"
    )

    status = db.Column(
        db.Enum("PENDING", "DONE", "REJECTED"),
        nullable=False,
        default="PENDING"
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

    reactions = db.relationship(
        "ContentReaction",
        back_populates="content",
        cascade="all, delete-orphan"
    )
    