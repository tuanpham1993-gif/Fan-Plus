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

    title = db.Column(db.String(255), nullable=False)
    body = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500))

    status = db.Column(
        Enum("PENDING", "DONE", "REJECTED"),
        db.String(20),
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
    
    events = db.relationship(
        "Event",
        back_populates="content",
        uselist=False
    )

    bookmarks = db.relationship(
        "Bookmark",
        back_populates="content"
    )

    reviews = db.relationship(
        "Review",
        back_populates="content"
    )