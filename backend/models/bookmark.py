from datetime import datetime, timezone
from extensions import db

class Bookmark(db.Model):
    __tablename__ = "bookmarks"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    content_id = db.Column(
        db.Integer,
        db.ForeignKey("contents.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    content = db.relationship(
        "Content",
        back_populates="bookmarks"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "content_id",
            name="uq_user_content_bookmark"
        ),
    )