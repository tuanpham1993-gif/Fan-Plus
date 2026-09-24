from flask import Blueprint, request, jsonify
from extensions import db
from models import Bookmark, Content
from flask_jwt_extended import jwt_required, get_jwt_identity

bookmark_bp = Blueprint('bookmark', __name__, url_prefix='/api/bookmarks')

@bookmark_bp.route('', methods=['GET'])
@jwt_required()
def get_user_bookmarks():
    user_id = int(get_jwt_identity())
    bookmarks = Bookmark.query.filter_by(user_id=user_id).order_by(Bookmark.created_at.desc()).all()
    return jsonify({
        'count': len(bookmarks),
        'bookmarks': [bm.to_dict() for bm in bookmarks if bm.content is not None]
    }), 200

@bookmark_bp.route('', methods=['POST'])
@jwt_required()
def add_bookmark():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    content_id = data.get('content_id')

    if not content_id:
        return jsonify({'error': 'content_id is required'}), 400

    content = Content.query.get(content_id)
    if not content:
        return jsonify({'error': 'Content not found'}), 404

    existing = Bookmark.query.filter_by(user_id=user_id, content_id=content_id).first()
    if existing:
        return jsonify({'message': 'Content already bookmarked', 'bookmark': existing.to_dict()}), 200

    bookmark = Bookmark(user_id=user_id, content_id=content_id)
    db.session.add(bookmark)
    db.session.commit()

    return jsonify({'message': 'Bookmark added', 'bookmark': bookmark.to_dict()}), 201

@bookmark_bp.route('/<int:content_id>', methods=['DELETE'])
@jwt_required()
def remove_bookmark(content_id):
    user_id = int(get_jwt_identity())
    bookmark = Bookmark.query.filter_by(user_id=user_id, content_id=content_id).first()
    
    if not bookmark:
        return jsonify({'error': 'Bookmark not found'}), 404

    db.session.delete(bookmark)
    db.session.commit()
    return jsonify({'message': 'Bookmark removed successfully'}), 200
