from flask import Blueprint, request, jsonify
from extensions import db
from models import Category, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import re

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

@category_bp.route('', methods=['GET'])
def get_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200

@category_bp.route('/<int:cat_id>', methods=['GET'])
def get_category_detail(cat_id):
    category = Category.query.get(cat_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify({'category': category.to_dict()}), 200

@category_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    icon = data.get('icon', 'folder').strip()

    if not name:
        return jsonify({'error': 'Category name is required'}), 400

    slug = slugify(name)
    if Category.query.filter((Category.name == name) | (Category.slug == slug)).first():
        return jsonify({'error': 'Category with this name or slug already exists'}), 400

    category = Category(
        name=name,
        slug=slug,
        description=description,
        icon=icon
    )
    db.session.add(category)
    db.session.commit()

    return jsonify({'message': 'Category created successfully', 'category': category.to_dict()}), 201

@category_bp.route('/<int:cat_id>', methods=['PUT'])
@jwt_required()
def update_category(cat_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    category = Category.query.get(cat_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json() or {}
    if 'name' in data and data['name'].strip():
        new_name = data['name'].strip()
        new_slug = slugify(new_name)
        existing = Category.query.filter(Category.id != cat_id, (Category.name == new_name) | (Category.slug == new_slug)).first()
        if existing:
            return jsonify({'error': 'Category with this name already exists'}), 400
        category.name = new_name
        category.slug = new_slug

    if 'description' in data:
        category.description = data['description'].strip()
    if 'icon' in data:
        category.icon = data['icon'].strip()

    db.session.commit()
    return jsonify({'message': 'Category updated successfully', 'category': category.to_dict()}), 200

@category_bp.route('/<int:cat_id>', methods=['DELETE'])
@jwt_required()
def delete_category(cat_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    category = Category.query.get(cat_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted successfully'}), 200
