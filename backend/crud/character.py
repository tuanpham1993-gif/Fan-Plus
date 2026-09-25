from models.character import Character
from extensions import db


def get_character(character_id):
    return db.session.get(Character, character_id)


def get_characters(
    category_id=None,
    name=None,
    skip=0,
    limit=20
):
    query = Character.query

    if category_id is not None:
        query = query.filter(
            Character.category_id == category_id
        )

    if name is not None:
        name = name.strip().lower()

        query = query.filter(db.func.lower(Character.name).like(f"%{name}%"))

    return (
        query.order_by(Character.created_at.desc()).offset(skip).limit(limit).all()
    )


def create_character(
    name,
    description,
    image_url,
    category_id
):
    character = Character(
        name=name,
        description=description,
        image_url=image_url,
        category_id=category_id
    )

    db.session.add(character)
    db.session.commit()
    db.session.refresh(character)

    return character


def update_character(
    character_id,
    name=None,
    description=None,
    image_url=None,
    category_id=None
):
    character = get_character(character_id)

    if character is None:
        return None

    if name is not None:
        character.name = name

    if description is not None:
        character.description = description

    if image_url is not None:
        character.image_url = image_url

    if category_id is not None:
        character.category_id = category_id

    db.session.commit()
    db.session.refresh(character)

    return character


def delete_character(character_id):
    character = get_character(character_id)

    if character is None:
        return None

    db.session.delete(character)
    db.session.commit()

    return character