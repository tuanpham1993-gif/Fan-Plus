from flask import Blueprint, jsonify
from extensions import db
from models import User, Content, Category, Bookmark, Feedback, Character
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    total_users = User.query.count()
    total_contents = Content.query.count()
    total_categories = Category.query.count()
    total_bookmarks = Bookmark.query.count()
    total_characters = Character.query.count()
    pending_feedback = Feedback.query.filter_by(status='pending').count()
    
    # Calculate aggregate views
    contents = Content.query.all()
    total_views = sum(c.view_count for c in contents)

    recent_contents = [c.to_dict(include_full=False) for c in Content.query.order_by(Content.created_at.desc()).limit(5).all()]
    recent_users = [u.to_dict() for u in User.query.order_by(User.created_at.desc()).limit(5).all()]

    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_contents': total_contents,
            'total_categories': total_categories,
            'total_bookmarks': total_bookmarks,
            'total_characters': total_characters,
            'pending_feedback': pending_feedback,
            'total_views': total_views
        },
        'recent_contents': recent_contents,
        'recent_users': recent_users
    }), 200
