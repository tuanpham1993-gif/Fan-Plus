import json
import re
from datetime import date
from extensions import db
from models.user import User
from models.bookmark import Bookmark
from models.content import Content


def get_user_by_id(user_id):
    return db.session.query(User).get(user_id)


def _normalize_favorite_fandoms(favorite_fandoms):
    if not isinstance(favorite_fandoms, list):
        raise ValueError('Invalid fandom list')

    normalized = []
    seen = set()
    for fandom in favorite_fandoms:
        if not isinstance(fandom, str):
            raise ValueError('Invalid fandom name')
        fandom = fandom.strip()
        if not fandom:
            continue
        if ',' in fandom:
            raise ValueError('Fandom name must not contain commas')
        if len(fandom) > 80:
            raise ValueError('Each fandom must not exceed 80 characters')
        normalized_key = fandom.casefold()
        if normalized_key in seen:
            continue
        seen.add(normalized_key)
        normalized.append(fandom)

    if len(normalized) > 20:
        raise ValueError('You can select at most 20 fandoms')
    return normalized


PERSONAL_FIELDS = ('phone', 'birthday', 'gender', 'city', 'bio')
PHONE_PATTERN = re.compile(r'^[0-9+\s()\-]+$')
GENDERS = {'male', 'female', 'other', 'undisclosed'}


class ProfileCommitError(Exception):
    pass


def _normalize_personal(personal):
    if personal is None:
        return {}
    if not isinstance(personal, dict):
        raise ValueError('Invalid personal information')

    normalized = {}
    for field in PERSONAL_FIELDS:
        if field not in personal:
            continue
        value = personal[field]
        if value is None or (isinstance(value, str) and not value.strip()):
            normalized[field] = None
            continue
        if not isinstance(value, str):
            raise ValueError('Personal information must be text')

        value = value.strip()
        if field == 'phone':
            if not PHONE_PATTERN.fullmatch(value):
                raise ValueError('Phone number may only contain digits, +, spaces, hyphens, and parentheses')
            compact_phone = re.sub(r'\s', '', value)
            digit_count = sum(character.isdigit() for character in value)
            if not 8 <= len(compact_phone) <= 20 or digit_count < 8:
                raise ValueError('Phone number must be 8 to 20 characters (excluding spaces) and contain at least 8 digits')
            normalized[field] = value
        elif field == 'birthday':
            try:
                if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
                    raise ValueError
                birthday = date.fromisoformat(value)
            except ValueError:
                raise ValueError('Birthday must be a valid date in YYYY-MM-DD format')
            today = date.today()
            if birthday > today:
                raise ValueError('Birthday must not be in the future')
            age = today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))
            if age > 120:
                raise ValueError('Age must not exceed 120')
            normalized[field] = birthday
        elif field == 'gender':
            if value not in GENDERS:
                raise ValueError('Invalid gender')
            normalized[field] = value
        elif field == 'city':
            if len(value) > 100:
                raise ValueError('City must not exceed 100 characters')
            normalized[field] = value
        elif field == 'bio':
            if len(value) > 300:
                raise ValueError('Bio must not exceed 300 characters')
            normalized[field] = value
    return normalized


def update_user_profile(user, name=None, favorite_fandoms=None, display_preferences=None, personal=None):
    if name is not None and not isinstance(name, str):
        raise ValueError('Invalid display name')
    if name is not None and name.strip() and len(name.strip()) > 60:
        raise ValueError('Display name must not exceed 60 characters')

    normalized_fandoms = None
    if favorite_fandoms is not None:
        normalized_fandoms = _normalize_favorite_fandoms(favorite_fandoms)

    serialized_preferences = None
    if display_preferences is not None:
        if not isinstance(display_preferences, dict):
            raise ValueError('Display preferences must be a JSON object')
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
            raise ValueError('Invalid display preferences')
        if len(serialized_preferences) > 255:
            raise ValueError('Display preferences must not exceed 255 characters')

    normalized_personal = _normalize_personal(personal)

    if name is not None and name.strip():
        user.name = name.strip()
    if normalized_fandoms is not None:
        user.favorite_fandoms = ','.join(normalized_fandoms)
    if serialized_preferences is not None:
        user.display_preferences = serialized_preferences
    for field, value in normalized_personal.items():
        setattr(user, field, value)

    try:
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        raise ProfileCommitError('Could not save profile') from exc
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