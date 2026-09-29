from models.bookmark import Bookmark
from extensions import db


def get_bookmark(user_id, content_id):
    return Bookmark.query.filter_by(
        user_id=user_id,
        content_id=content_id
    ).first()


def get_bookmarks_by_user(user_id,skip=0,limit=20):
    return (
        Bookmark.query.filter(
            Bookmark.user_id == user_id)
            .order_by(Bookmark.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
    )


def create_bookmark(user_id, content_id):
    bookmark = Bookmark(user_id=user_id,content_id=content_id)

    db.session.add(bookmark)
    db.session.commit()
    db.session.refresh(bookmark)

    return bookmark


def delete_bookmark(user_id, content_id):
    bookmark = get_bookmark(user_id=user_id,content_id=content_id)

    if bookmark is None:
        return None

    db.session.delete(bookmark)
    db.session.commit()

    return bookmark