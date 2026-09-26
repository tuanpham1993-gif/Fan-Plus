import re
from extensions import db
from models.category import Category

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

def get_all_categories():
    return Category.query.order_by(Category.name.asc()).all()

def get_category_by_id(cat_id):
    return db.session.query(Category).get(cat_id)

def get_category_by_slug(slug):
    return db.session.query(Category).filter_by(slug=slug).first()

def check_category_exists(name, slug, exclude_id=None):
    query = Category.query.filter((Category.name == name) | (Category.slug == slug))
    if exclude_id:
        query = query.filter(Category.id != exclude_id)
    return query.first() is not None

def create_category(name, slug, description='', icon='folder'):
    category = Category(
        name=name,
        slug=slug,
        description=description,
        icon=icon
    )
    db.session.add(category)
    db.session.commit()
    return category

def update_category(category, name=None, slug=None, description=None, icon=None):
    if name:
        category.name = name
    if slug:
        category.slug = slug
    if description is not None:
        category.description = description
    if icon is not None:
        category.icon = icon

    db.session.commit()
    return category

def delete_category(category):
    db.session.delete(category)
    db.session.commit()
    return True
