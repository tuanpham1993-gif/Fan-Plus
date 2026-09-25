from flask import Blueprint, jsonify, request
from crud import merchandise_crud

merchandise_bp = Blueprint('merchandise_bp', __name__)

@merchandise_bp.get('/api/merchandise')
def get_merchandise():
    category_id = request.args.get('category_id', type=int)
    character_id = request.args.get('character_id', type=int)
    tag = request.args.get('tag', type=str)
    is_upcoming = request.args.get('is_upcoming')
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)

    items, total, pages = merchandise_crud.get_merchandise(
        category_id=category_id,
        character_id=character_id,
        tag=tag,
        is_upcoming=is_upcoming,
        page=page,
        limit=limit
    )

    return jsonify({
        "success": True,
        "data": [item.to_dict() for item in items],
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages
        }
    }), 200

@merchandise_bp.get('/api/merchandise/<int:id>')
def get_merchandise_detail(id):
    # Pass increment_view=True to auto-increment view_count by 1
    item = merchandise_crud.get_merchandise_by_id(id, increment_view=True)
    if not item:
        return jsonify({
            "success": False,
            "error": "Merchandise not found."
        }), 404

    return jsonify({
        "success": True,
        "data": item.to_dict()
    }), 200
