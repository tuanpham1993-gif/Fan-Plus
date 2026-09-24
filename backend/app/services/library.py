from sqlalchemy import select, delete
from app.models import Bookmark, Rating, Resource, iso, utcnow
from .policy import require_member
from .catalog import published_record

def save_bookmark(db, actor, resource_id, note=""):
    require_member(actor); published_record(db,resource_id)
    record=db.scalar(select(Bookmark).where(Bookmark.user_id==actor.id,Bookmark.resource_id==resource_id))
    if record: record.note=note
    else: record=Bookmark(user_id=actor.id,resource_id=resource_id,note=note);db.add(record)
    db.flush()
    return {"id":record.id,"resource_id":resource_id,"note":record.note,"created_at":iso(record.created_at)}

def list_bookmarks(db,actor,query):
    require_member(actor)
    from sqlalchemy import func
    from math import ceil
    total=db.scalar(select(func.count()).select_from(Bookmark).where(Bookmark.user_id==actor.id)) or 0
    rows=db.execute(select(Bookmark,Resource).join(Resource).where(Bookmark.user_id==actor.id).order_by(Bookmark.created_at.desc(),Bookmark.id).offset((query.page-1)*query.page_size).limit(query.page_size)).all()
    now=utcnow()
    available=lambda r:r.status=="published" and r.published_at is not None and r.published_at<=now
    items=[{"id":b.id,"resource_id":r.id,"title":r.title if available(r) else "Unavailable item","available":available(r),"note":b.note,"created_at":iso(b.created_at)} for b,r in rows]
    return items,{"page":query.page,"page_size":query.page_size,"total":total,"total_pages":ceil(total/query.page_size)}

def remove_bookmark(db,actor,resource_id):
    require_member(actor)
    db.execute(delete(Bookmark).where(Bookmark.user_id==actor.id,Bookmark.resource_id==resource_id))

def rate_resource(db,actor,resource_id,value):
    require_member(actor);published_record(db,resource_id)
    record=db.get(Rating,(actor.id,resource_id))
    if record: record.value=value
    else: db.add(Rating(user_id=actor.id,resource_id=resource_id,value=value))
    db.flush()
    return {"resource_id":resource_id,"value":value}
