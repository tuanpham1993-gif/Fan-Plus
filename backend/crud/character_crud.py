from extensions import db
from models.category import Category
from models.character_profile import CharacterProfile
from models.merchandise_item import MerchandiseItem


def get_characters(category_id=None, search=None, page=1, limit=10):
    query = CharacterProfile.query

    if category_id is not None:
        query = query.filter(CharacterProfile.category_id == category_id)

    if search is not None and str(search).strip():
        search_term = f"%{str(search).strip()}%"
        query = query.filter(CharacterProfile.name.ilike(search_term))

    query = query.order_by(CharacterProfile.created_at.desc())
    pagination = query.paginate(
        page=max(1, page),
        per_page=max(1, limit),
        error_out=False
    )

    return pagination.items, pagination.total, pagination.pages


def get_character_by_id(character_id):
    return db.session.get(CharacterProfile, character_id)


def create_character(data):
    category_id = data.get("category_id")
    category = db.session.get(Category, category_id)
    if not category:
        return None, "Category not found.", 404

    name = str(data.get("name") or "").strip()
    if not name:
        return None, "Character name is required and cannot be empty.", 400

    character = CharacterProfile(
        name=name,
        category_id=category_id,
        bio=data.get("bio"),
        image_url=data.get("image_url")
    )
    db.session.add(character)
    db.session.commit()
    return character, None, 201


def update_character(character_id, data):
    character = db.session.get(CharacterProfile, character_id)
    if not character:
        return None, "Character not found.", 404

    if "category_id" in data and data["category_id"] is not None:
        category = db.session.get(Category, data["category_id"])
        if not category:
            return None, "Category not found.", 404
        character.category_id = data["category_id"]

    if "name" in data:
        name = str(data["name"] or "").strip()
        if not name:
            return None, "Character name cannot be empty.", 400
        character.name = name

    if "bio" in data:
        character.bio = data["bio"]

    if "image_url" in data:
        character.image_url = data["image_url"]

    db.session.commit()
    return character, None, 200


def delete_character(character_id):
    character = db.session.get(CharacterProfile, character_id)
    if not character:
        return False, "Character not found.", 404

    # Keep merchandise items and clear their optional character reference.
    MerchandiseItem.query.filter_by(character_id=character_id).update({MerchandiseItem.character_id: None})

    db.session.delete(character)
    db.session.commit()
    return True, None, 200
