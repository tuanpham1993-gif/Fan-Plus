from models.mediaContent import ContentMedia
from extensions import db

def build_media_query(content_id=None,media_type=None):
    query = ContentMedia.query
    if content_id is not None:
        query = query.filter(ContentMedia.content_id == content_id)

    if media_type is not None:
        query = query.filter(ContentMedia.media_type == media_type)

    return query

def get_media(media_id):
    return db.session.get(ContentMedia,media_id)

def get_medias(content_id=None, media_type=None):
    query = build_media_query(
        content_id=content_id,
        media_type=media_type
    )

    medias = query.order_by(ContentMedia.display_order.asc()).all()
    return medias

def create_media(
    content_id, media_type,media_url,display_order=0):
    
    media = ContentMedia(
        content_id=content_id, media_type=media_type,
        media_url=media_url,display_order=display_order
    )

    db.session.add(media)
    db.session.commit()
    db.session.refresh(media)

    return media

def delete_media(media_id):
    media = get_media(media_id)

    if media is None:
        return None

    db.session.delete(media)
    db.session.commit()

    return media