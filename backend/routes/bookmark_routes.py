from flask import Blueprint, request, jsonify, g
from crud import bookmark_crud, content_crud
from middleware.auth_middleware import token_required

bookmark_bp = Blueprint('bookmark', __name__, url_prefix='/api/bookmarks')

@bookmark_bp.route('', methods=['GET'])
@token_required
def get_user_bookmarks():
    user_id = g.current_user.id
    bookmarks = bookmark_crud.get_user_bookmarks(user_id)
    return jsonify({
        'count': len(bookmarks),
        'bookmarks': [bm.to_dict() for bm in bookmarks if bm.content is not None]
    }), 200

@bookmark_bp.route('', methods=['POST'])
@token_required
def add_bookmark():
    user_id = g.current_user.id
    data = request.get_json(silent=True) or {}
    content_id = data.get('content_id')

    if not content_id:
        return jsonify({'error': 'content_id is required'}), 400

    content = content_crud.get_content_by_id(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    existing = bookmark_crud.get_bookmark(user_id=user_id, content_id=content_id)
    if existing:
        return jsonify({'message': 'Content already bookmarked', 'bookmark': existing.to_dict()}), 200

    bookmark = bookmark_crud.create_bookmark(user_id=user_id, content_id=content_id)
    return jsonify({'message': 'Bookmark added', 'bookmark': bookmark.to_dict()}), 201

@bookmark_bp.route('/<int:content_id>', methods=['DELETE'])
@token_required
def remove_bookmark(content_id):
    user_id = g.current_user.id
    bookmark = bookmark_crud.get_bookmark(user_id=user_id, content_id=content_id)
    
    if not bookmark:
        return jsonify({'error': 'Bookmark not found'}), 404

    bookmark_crud.delete_bookmark(bookmark)
    return jsonify({'message': 'Bookmark removed successfully'}), 200
