from flask import Blueprint, jsonify
from crud import category_crud

category_bp = Blueprint('category_bp', __name__)

@category_bp.get('/api/categories')
def get_categories():
    categories = category_crud.get_all_categories()
    return jsonify({
        "success": True,
        "data": [cat.to_dict() for cat in categories]
    }), 200
