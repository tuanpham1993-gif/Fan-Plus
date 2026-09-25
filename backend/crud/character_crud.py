from extensions import db
from models.category import Category
from models.character_profile import CharacterProfile
from models.merchandise_item import MerchandiseItem

def get_characters(category_id=None, search=None, page=1, limit=10):
    query = CharacterProfile.query
    
    if category_id is not None:
        query = query.filter(CharacterProfile.category_id == category_id)
        
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(CharacterProfile.name.ilike(search_term))
        
    query = query.order_by(CharacterProfile.created_at.desc())
    pagination = query.paginate(page=page, per_page=limit, error_out=False)
    
    return pagination.items, pagination.total, pagination.pages

def get_character_by_id(character_id):
    return CharacterProfile.query.get(character_id)

def create_character(data):
    category_id = data.get("category_id")
    category = Category.query.get(category_id)
    if not category:
        return None, "Category not found.", 404
        
    character = CharacterProfile(
        name=data.get("name").strip(),
        category_id=category_id,
        bio=data.get("bio"),
        image_url=data.get("image_url")
    )
    db.session.add(character)
    db.session.commit()
    return character, None, 201

def update_character(character_id, data):
    character = CharacterProfile.query.get(character_id)
    if not character:
        return None, "Character not found.", 404
        
    if "category_id" in data and data["category_id"] is not None:
        category = Category.query.get(data["category_id"])
        if not category:
            return None, "Category not found.", 404
        character.category_id = data["category_id"]
        
    if "name" in data and data["name"]:
        character.name = str(data["name"]).strip()
        
    if "bio" in data:
        character.bio = data["bio"]
        
    if "image_url" in data:
        character.image_url = data["image_url"]
        
    db.session.commit()
    return character, None, 200

def delete_character(character_id):
    character = CharacterProfile.query.get(character_id)
    if not character:
        return False, "Character not found.", 404
        
    # ON DELETE SET NULL for merchandise items
    MerchandiseItem.query.filter_by(character_id=character_id).update({MerchandiseItem.character_id: None})
    
    db.session.delete(character)
    db.session.commit()
    return True, None, 200
