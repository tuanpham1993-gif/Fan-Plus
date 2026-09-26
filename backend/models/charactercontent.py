from extensions import db


class CharacterContent(db.Model):
    __tablename__ = "character_content"

    id = db.Column(db.Integer, primary_key=True)

    content_id = db.Column(
        db.Integer,
        db.ForeignKey("contents.id"),
        nullable=False
    )

    character_id = db.Column(
        db.Integer,
        db.ForeignKey("characters.id"),
        nullable=False
    )

    character_id = db.Column(
        db.Integer,
        db.ForeignKey("characters.id"),
        nullable=False
    )

    content = db.relationship(
        "Content",
        back_populates="character_contents"
    )

    character = db.relationship(
        "Character",
        back_populates="character_contents"
    )

    __table_args__ = (
        db.UniqueConstraint(
            "content_id",
            "character_id",
            name="uq_content_character"
        ),
    )