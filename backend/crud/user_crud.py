import json
from extensions import db
from models.user import User
from models.bookmark import Bookmark
from models.content import Content


def get_user_by_id(user_id):
    return db.session.query(User).get(user_id)


def _normalize_favorite_fandoms(favorite_fandoms):
    if not isinstance(favorite_fandoms, list):
        raise ValueError('Danh sách fandom không hợp lệ')

    normalized = []
    seen = set()
    for fandom in favorite_fandoms:
        if not isinstance(fandom, str):
            raise ValueError('Tên fandom không hợp lệ')
        fandom = fandom.strip()
        if not fandom:
            continue
        if ',' in fandom:
            raise ValueError('Tên fandom không được chứa dấu phẩy')
        if len(fandom) > 80:
            raise ValueError('Mỗi fandom không được dài quá 80 ký tự')
        normalized_key = fandom.casefold()
        if normalized_key in seen:
            continue
        seen.add(normalized_key)
        normalized.append(fandom)

    if len(normalized) > 20:
        raise ValueError('Chỉ được chọn tối đa 20 fandom')
    return normalized


def update_user_profile(user, name=None, favorite_fandoms=None, display_preferences=None):
    normalized_fandoms = None
    if favorite_fandoms is not None:
        normalized_fandoms = _normalize_favorite_fandoms(favorite_fandoms)

    serialized_preferences = None
    if display_preferences is not None:
        if not isinstance(display_preferences, dict):
            raise ValueError('Tùy chọn hiển thị phải là một đối tượng JSON')
        merged_preferences = user.get_display_preferences().copy()
        merged_preferences.update(display_preferences)
        merged_preferences.pop('favorite_fandoms', None)
        try:
            serialized_preferences = json.dumps(
                merged_preferences,
                ensure_ascii=False,
                separators=(',', ':')
            )
        except (TypeError, ValueError):
            raise ValueError('Tùy chọn hiển thị không hợp lệ')
        if len(serialized_preferences) > 255:
            raise ValueError('Tùy chọn hiển thị không được vượt quá 255 ký tự')

    if name is not None and name.strip():
        user.name = name.strip()
    if normalized_fandoms is not None:
        user.favorite_fandoms = ','.join(normalized_fandoms)
    if serialized_preferences is not None:
        user.display_preferences = serialized_preferences

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
