from extensions import db
from models.category import Category
from models.character_profile import CharacterProfile
from models.merchandise_item import MerchandiseItem

def get_all_categories():
    return Category.query.all()

def get_category_by_id(category_id):
    return Category.query.get(category_id)

def create_category(name, description=None):
    existing = Category.query.filter(Category.name.ilike(name.strip())).first()
    if existing:
        return None, "Category name already exists.", 409
    
    category = Category(name=name.strip(), description=description)
    db.session.add(category)
    db.session.commit()
    return category, None, 201 

def update_category(category_id, data):
    category = Category.query.get(category_id)
    if not category:
        return None, "Category not found.", 404
    
    if "name" in data and data["name"]:
        name_str = str(data["name"]).strip()
        existing = Category.query.filter(Category.name.ilike(name_str), Category.category_id != category_id).first()
        if existing:
            return None, "Category name already exists.", 409
        category.name = name_str
        
    if "description" in data:
        category.description = data["description"]
        
    db.session.commit()
    return category, None, 200

def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return False, "Category not found.", 404
    
    has_character = CharacterProfile.query.filter_by(category_id=category_id).first()
    has_merchandise = MerchandiseItem.query.filter_by(category_id=category_id).first()
    
    if has_character or has_merchandise:
        return False, "Cannot delete category that is currently assigned to characters or merchandise.", 409
        
    db.session.delete(category)
    db.session.commit()
    return True, None, 200
