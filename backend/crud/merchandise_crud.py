from extensions import db
from models.category import Category
from models.character_profile import CharacterProfile
from models.merchandise_item import MerchandiseItem

ALLOWED_TAGS = {"Limited Edition", "Pre-Order", "Collectible"}

def get_merchandise(category_id=None, character_id=None, tag=None, is_upcoming=None, page=1, limit=10):
    query = MerchandiseItem.query
    
    if category_id is not None:
        query = query.filter(MerchandiseItem.category_id == category_id)
        
    if character_id is not None:
        query = query.filter(MerchandiseItem.character_id == character_id)
        
    if tag:
        query = query.filter(MerchandiseItem.tag == tag)
        
    if is_upcoming is not None:
        if isinstance(is_upcoming, str):
            is_upcoming_bool = is_upcoming.lower() == 'true'
        else:
            is_upcoming_bool = bool(is_upcoming)
        query = query.filter(MerchandiseItem.is_upcoming == is_upcoming_bool)
        
    query = query.order_by(MerchandiseItem.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return pagination.items, pagination.total, pagination.pages

def get_merchandise_by_id(item_id, increment_view=False):
    item = MerchandiseItem.query.get(item_id)
    if item and increment_view:
        item.view_count += 1
        db.session.commit()
    return item

def create_merchandise(data):
    category_id = data.get("category_id")
    category = Category.query.get(category_id)
    if not category:
        return None, "Category not found.", 404
        
    character_id = data.get("character_id")
    if character_id is not None:
        character = CharacterProfile.query.get(character_id)
        if not character:
            return None, "Character not found.", 404
        if character.category_id != category_id:
            return None, "Character category does not match merchandise category.", 400

    tag = data.get("tag")
    if tag and str(tag).strip():
        if tag not in ALLOWED_TAGS:
            return None, "Invalid tag. Allowed tags: Limited Edition, Pre-Order, Collectible.", 400
    else:
        tag = None

    is_upcoming = data.get("is_upcoming", False)
    if isinstance(is_upcoming, str):
        is_upcoming = is_upcoming.lower() == 'true'
    else:
        is_upcoming = bool(is_upcoming)

    item = MerchandiseItem(
        name=data.get("name").strip(),
        category_id=category_id,
        character_id=character_id,
        image_url=data.get("image_url"),
        tag=tag,
        is_upcoming=is_upcoming,
        view_count=0
    )
    db.session.add(item)
    db.session.commit()
    return item, None, 201

def update_merchandise(item_id, data):
    item = MerchandiseItem.query.get(item_id)
    if not item:
        return None, "Merchandise not found.", 404
        
    target_category_id = data.get("category_id", item.category_id)
    category = Category.query.get(target_category_id)
    if not category:
        return None, "Category not found.", 404
        
    if "character_id" in data:
        target_character_id = data["character_id"]
    else:
        target_character_id = item.character_id

    if target_character_id is not None:
        character = CharacterProfile.query.get(target_character_id)
        if not character:
            return None, "Character not found.", 404
        if character.category_id != target_category_id:
            return None, "Character category does not match merchandise category.", 400

    if "tag" in data:
        tag = data["tag"]
        if tag and str(tag).strip():
            if tag not in ALLOWED_TAGS:
                return None, "Invalid tag. Allowed tags: Limited Edition, Pre-Order, Collectible.", 400
            item.tag = tag
        else:
            item.tag = None

    if "is_upcoming" in data:
        is_upcoming = data["is_upcoming"]
        if isinstance(is_upcoming, str):
            item.is_upcoming = is_upcoming.lower() == 'true'
        else:
            item.is_upcoming = bool(is_upcoming)

    if "name" in data and data["name"]:
        item.name = str(data["name"]).strip()

    if "image_url" in data:
        item.image_url = data["image_url"]

    item.category_id = target_category_id
    item.character_id = target_character_id

    db.session.commit()
    return item, None, 200

def delete_merchandise(item_id):
    item = MerchandiseItem.query.get(item_id)
    if not item:
        return False, "Merchandise not found.", 404
        
    db.session.delete(item)
    db.session.commit()
    return True, None, 200
