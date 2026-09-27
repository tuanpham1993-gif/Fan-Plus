from extensions import db
from models import CharacterContent, Content, Character


def seed_character_contents():
    relations = [
        {
            "content_title": "Why Naruto Is Still One of the Most Popular Anime",
            "character_name": "Naruto Uzumaki",
        },
        {
            "content_title": "Upcoming Games Fans Are Looking Forward To",
            "character_name": "Mario",
        },
        {
            "content_title": "The Evolution of Superhero Movies",
            "character_name": "Iron Man",
        },
        {
            "content_title": "Batman: A Look at Gotham's Dark Knight",
            "character_name": "Batman",
        },
    ]

    for item in relations:

        content = Content.query.filter_by(
            title=item["content_title"]
        ).first()

        if not content:
            print(
                f"Content '{item['content_title']}' not found. "
                f"Skipping."
            )
            continue

        character = Character.query.filter_by(
            name=item["character_name"]
        ).first()

        if not character:
            print(
                f"Character '{item['character_name']}' not found. "
                f"Skipping."
            )
            continue

        existing_relation = CharacterContent.query.filter_by(
            content_id=content.id,
            character_id=character.character_id
        ).first()

        if existing_relation:
            continue

        relation = CharacterContent(
            content_id=content.id,
            character_id=character.character_id
        )

        db.session.add(relation)

    db.session.commit()