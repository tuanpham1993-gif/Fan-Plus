from datetime import datetime, timezone

from extensions import db

class Review(db.Model):
    __tablename__ = "reviews"

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

    rating = db.Column(
        db.Integer,
        nullable=False
    )

    comment = db.Column(db.Text)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    content = db.relationship(
        "Content",
        back_populates="reviews"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "content_id",
            name="uq_user_content_review"
        ),
    )