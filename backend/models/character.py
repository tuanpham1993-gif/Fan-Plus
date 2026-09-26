from extensions import db
from datetime import datetime, timezone


class Character(db.Model):
    __tablename__ = "characters"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(255),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    image_url = db.Column(
        db.String(500),
        nullable=False
    )

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.category_id"),
        nullable=False
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

    character_contents = db.relationship(
        "CharacterContent",
        back_populates="character",
        cascade="all, delete-orphan"
    )
    category = db.relationship(
    "Category",
    back_populates="characters"
)
