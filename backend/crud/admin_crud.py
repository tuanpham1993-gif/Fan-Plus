from sqlalchemy import func
from extensions import db
from models import User, Content, Category, Bookmark, Feedback, Character
from models.merchandise_item import MerchandiseItem

def get_admin_stats():
    total_users = User.query.count()
    total_contents = Content.query.count()
    total_categories = Category.query.count()
    total_bookmarks = Bookmark.query.count()
    total_characters = Character.query.count()
    pending_feedback = Feedback.query.filter_by(status='pending').count()
    
    # Only merchandise_items has a view_count column in the fanhub schema.
    total_views = int(db.session.query(func.coalesce(func.sum(MerchandiseItem.view_count), 0)).scalar() or 0)

    recent_contents = [
        {'id': c.id, 'title': c.title, 'content_type': c.content_type, 'status': c.status,
         'category_id': c.category_id, 'created_at': c.created_at.isoformat() if c.created_at else None}
        for c in Content.query.order_by(Content.created_at.desc()).limit(5).all()
    ]
    recent_users = [u.to_admin_dict() for u in User.query.order_by(User.created_at.desc()).limit(5).all()]

    return {
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
    }
