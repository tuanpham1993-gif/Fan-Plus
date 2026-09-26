from flask import Blueprint, request, jsonify
from crud import category_crud
from schema.category_schema import validate_category_data
from middleware.auth_middleware import admin_required

category_bp = Blueprint('category', __name__, url_prefix='/api/categories')

@category_bp.route('', methods=['GET'])
def get_categories():
    categories = category_crud.get_all_categories()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200

@category_bp.route('/<int:cat_id>', methods=['GET'])
def get_category_detail(cat_id):
    category = category_crud.get_category_by_id(cat_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify({'category': category.to_dict()}), 200

@category_bp.route('', methods=['POST'])
@admin_required
def create_category():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_category_data(data, is_update=False)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    icon = data.get('icon', 'folder').strip()
    slug = category_crud.slugify(name)

    if category_crud.check_category_exists(name, slug):
        return jsonify({'error': 'Category with this name or slug already exists'}), 400

    category = category_crud.create_category(
        name=name,
        slug=slug,
        description=description,
        icon=icon
    )

    return jsonify({'message': 'Category created successfully', 'category': category.to_dict()}), 201

@category_bp.route('/<int:cat_id>', methods=['PUT'])
@admin_required
def update_category(cat_id):
    category = category_crud.get_category_by_id(cat_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_category_data(data, is_update=True)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    new_name = data.get('name', '').strip() if 'name' in data else None
    new_slug = category_crud.slugify(new_name) if new_name else None

    if new_name and category_crud.check_category_exists(new_name, new_slug, exclude_id=cat_id):
        return jsonify({'error': 'Category with this name already exists'}), 400

    updated = category_crud.update_category(
        category=category,
        name=new_name,
        slug=new_slug,
        description=data.get('description', '').strip() if 'description' in data else None,
        icon=data.get('icon', '').strip() if 'icon' in data else None
    )

    return jsonify({'message': 'Category updated successfully', 'category': updated.to_dict()}), 200

@category_bp.route('/<int:cat_id>', methods=['DELETE'])
@admin_required
def delete_category(cat_id):
    category = category_crud.get_category_by_id(cat_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    category_crud.delete_category(category)
    return jsonify({'message': 'Category deleted successfully'}), 200
