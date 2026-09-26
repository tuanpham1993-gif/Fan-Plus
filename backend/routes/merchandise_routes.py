from flask import Blueprint, request, jsonify
from crud import merchandise_crud
from schema.merchandise_schema import validate_merchandise_data
from middleware.auth_middleware import admin_required

merchandise_bp = Blueprint('merchandise', __name__, url_prefix='/api/merchandise')

@merchandise_bp.route('', methods=['GET'])
def get_merchandise():
    items = merchandise_crud.get_all_merchandise()
    return jsonify({'merchandise': [i.to_dict() for i in items]}), 200

@merchandise_bp.route('', methods=['POST'])
@admin_required
def create_merchandise():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_merchandise_data(data)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    item = merchandise_crud.create_merchandise(
        name=data.get('name', '').strip(),
        price=float(data.get('price')),
        description=data.get('description', '').strip(),
        image=data.get('image', '').strip(),
        category=data.get('category', 'Figures').strip(),
        stock=int(data.get('stock', 50)),
        rating=float(data.get('rating', 4.8))
    )

    return jsonify({'message': 'Item created', 'item': item.to_dict()}), 201
