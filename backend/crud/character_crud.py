from models.character_profile import Character
from models.category import Category
from models.merchandise_item import MerchandiseItem
from extensions import db


def get_character(character_id):
    return db.session.get(Character, character_id)
    

def get_characters(
    category_id=None,
    search=None,
    page=1,
    limit=10
):
    query = Character.query

    if category_id is not None:
        query = query.filter(
            Character.category_id == category_id
        )

    if search is not None:
        search = search.strip().lower()

        if search:
            query = query.filter(
                db.func.lower(
                    Character.name
                ).like(f"%{search}%")
            )

    pagination = (
        query
        .order_by(Character.created_at.desc())
        .paginate(
            page=max(1, page),
            per_page=max(1, limit),
            error_out=False
        )
    )

    return (
        pagination.items,
        pagination.total,
        pagination.pages
    )


def create_character(
    name,
    bio=None,
    image_url=None,
    category_id=None
):
    category = db.session.get(
        Category,
        category_id
    )

    if category is None:
        return None, "Category not found.", 404

    name = str(name or "").strip()

    if not name:
        return None, "Character name is required and cannot be empty.", 400

    character = Character(
        name=name,
        bio=bio,
        image_url=image_url,
        category_id=category_id
    )

    db.session.add(character)
    db.session.commit()
    db.session.refresh(character)

    return character, None, 201


def update_character(
    character_id,
    name=None,
    bio=None,
    image_url=None,
    category_id=None
):
    character = get_character(character_id)

    if character is None:
        return None, "Character not found.", 404

    if category_id is not None:

        category = db.session.get(
            Category,
            category_id
        )

        if category is None:
            return None, "Category not found.", 404

        character.category_id = category_id

    if name is not None:

        name = str(name).strip()

        if not name:
            return None, "Character name cannot be empty.", 400

        character.name = name

    if bio is not None:
        character.bio = bio

    if image_url is not None:
        character.image_url = image_url

    db.session.commit()
    db.session.refresh(character)

    return character, None, 200


def delete_character(character_id):
    character = get_character(character_id)

    if character is None:
        return None, "Character not found.", 404

    # Keep merchandise items.
    # Only remove their character reference.
    MerchandiseItem.query.filter_by(
        character_id=character_id
    ).update({
        MerchandiseItem.character_id: None
    })

    db.session.delete(character)
    db.session.commit()

    return character, None, 200