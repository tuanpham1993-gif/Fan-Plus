import json
from extensions import db
from models.user import User
from models.bookmark import Bookmark
from models.content import Content

def get_user_by_id(user_id):
    return db.session.query(User).get(user_id)

def update_user_profile(user, name=None, avatar=None, favorite_fandoms=None, display_preferences=None):
    if name is not None and name.strip():
        user.name = name.strip()
    if avatar is not None:
        user.avatar = avatar.strip() if avatar else None
    if favorite_fandoms is not None:
        if isinstance(favorite_fandoms, list):
            user.favorite_fandoms = ','.join(favorite_fandoms)
        else:
            user.favorite_fandoms = str(favorite_fandoms).strip()
    if display_preferences is not None:
        if isinstance(display_preferences, dict):
            user.display_preferences = json.dumps(display_preferences)
        elif isinstance(display_preferences, str):
            user.display_preferences = display_preferences.strip()

    db.session.commit()
    return user

def get_user_dashboard(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return None

    bookmarks = Bookmark.query.filter_by(user_id=user_id).order_by(Bookmark.created_at.desc()).limit(5).all()
    bookmarked_items = [bm.to_dict() for bm in bookmarks if bm.content is not None]

    user_contents = Content.query.filter_by(author_id=user_id).order_by(Content.created_at.desc()).limit(5).all()
    recent_activity = [c.to_dict(include_full=False) for c in user_contents]

    return {
        'greeting': f"Hello, {user.name}! Welcome back to Fan Hub.",
        'user': user.to_dict(),
        'favorite_fandoms': user.to_dict()['favorite_fandoms'],
        'bookmarked_items': bookmarked_items,
        'recent_activity': recent_activity
    }
