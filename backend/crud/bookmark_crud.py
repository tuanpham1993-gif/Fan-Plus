from extensions import db
from models.bookmark import Bookmark

def get_user_bookmarks(user_id):
    return Bookmark.query.filter_by(user_id=user_id).order_by(Bookmark.created_at.desc()).all()

def get_bookmark(user_id, content_id):
    return Bookmark.query.filter_by(user_id=user_id, content_id=content_id).first()

def create_bookmark(user_id, content_id):
    bookmark = Bookmark(user_id=user_id, content_id=content_id)
    db.session.add(bookmark)
    db.session.commit()
    return bookmark

def delete_bookmark(bookmark):
    db.session.delete(bookmark)
    db.session.commit()
    return True
