from extensions import db
from datetime import timezone, datetime

class ContentMedia(db.Model):
    __tablename__ = "content_media"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    content_id = db.Column(
        db.Integer,
        db.ForeignKey("contents.id"),
        nullable=False
    )

    media_type = db.Column(
        db.Enum("IMAGE", "VIDEO", "AUDIO"),
        nullable=False
    )

    media_url = db.Column(
        db.String(500),
        nullable=False
    )

    display_order = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    content = db.relationship(
        "Content",
        back_populates="medias"
    )