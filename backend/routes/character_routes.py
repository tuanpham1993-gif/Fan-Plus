from flask import Blueprint, jsonify, request
from crud import character_crud

character_bp = Blueprint('character_bp', __name__)

@character_bp.get('/api/characters')
def get_characters():
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', type=str)
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)

    items, total, pages = character_crud.get_characters(
        category_id=category_id,
        search=search,
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

@character_bp.get('/api/characters/<int:id>')
def get_character_detail(id):
    character = character_crud.get_character_by_id(id)
    if not character:
        return jsonify({
            "success": False,
            "error": "Character not found."
        }), 404

    return jsonify({
        "success": True,
        "data": character.to_dict()
    }), 200
