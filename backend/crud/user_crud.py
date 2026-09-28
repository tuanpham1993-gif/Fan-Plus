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
    prefs = user.get_display_preferences()
    if display_preferences is not None:
        if isinstance(display_preferences, str):
            try:
                display_preferences = json.loads(display_preferences)
            except ValueError:
                raise ValueError("display_preferences must be a JSON object")
        if not isinstance(display_preferences, dict):
            raise ValueError("display_preferences must be a JSON object")
        prefs.update({k: v for k, v in display_preferences.items() if k != 'favorite_fandoms'})
    if favorite_fandoms is not None:
        if isinstance(favorite_fandoms, str):
            favorite_fandoms = favorite_fandoms.split(',')
        prefs['favorite_fandoms'] = [str(f).strip() for f in favorite_fandoms if str(f).strip()][:20]
    if display_preferences is not None or favorite_fandoms is not None:
        encoded = json.dumps(prefs, ensure_ascii=False)
        if len(encoded) > 255:
            raise ValueError("Preferences are too long; keep favourite fandoms short")
        user.display_preferences = encoded

    db.session.commit()
    return user

def get_user_dashboard(user_id):
    user = get_user_by_id(user_id)
    if not user:
        return None

    bookmarks = Bookmark.query.filter_by(user_id=user_id).order_by(Bookmark.created_at.desc()).limit(5).all()
    bookmarked_items = [
        {'id': bm.id, 'content_id': bm.content_id, 'title': bm.content.title,
         'content_type': bm.content.content_type,
         'created_at': bm.created_at.isoformat() if bm.created_at else None}
        for bm in bookmarks if bm.content is not None
    ]

    user_contents = Content.query.filter_by(author_id=user_id).order_by(Content.created_at.desc()).limit(5).all()
    recent_activity = [
        {'id': c.id, 'title': c.title, 'content_type': c.content_type, 'status': c.status,
         'created_at': c.created_at.isoformat() if c.created_at else None}
        for c in user_contents
    ]

    return {
        'greeting': f"Hello, {user.name}! Welcome back to Fan Hub.",
        'user': user.to_dict(),
        'bookmarked_items': bookmarked_items,
        'recent_activity': recent_activity
    }
