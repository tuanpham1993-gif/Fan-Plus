from datetime import datetime, timezone

from extensions import db


class Character(db.Model):
    __tablename__ = "characters"

    character_id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.category_id"),
        nullable=False
    )

    name = db.Column(
        db.String(150),
        nullable=False
    )

    bio = db.Column(
        db.Text,
        nullable=True
    )

    image_url = db.Column(
        db.String(500),
        nullable=True
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

    # Character thuộc Category
    category = db.relationship(
        "Category",
        back_populates="characters"
    )

    # Character <-> CharacterContent
    character_contents = db.relationship(
        "CharacterContent",
        back_populates="character"
    )

    # Character <-> Merchandise
    merchandise_items = db.relationship(
        "MerchandiseItem",
        backref="character"
    )

    def to_dict(self):
        return {
            "character_id": self.character_id,
            "category_id": self.category_id,
            "name": self.name,
            "bio": self.bio,
            "image_url": self.image_url
        }