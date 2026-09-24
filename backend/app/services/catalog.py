from math import ceil
from unicodedata import normalize
import re
from sqlalchemy import select, func, or_, update
from app.models import Resource, Category, Fandom, FandomCategory, MediaAsset, Rating, Bookmark, ResourceGenre, AuditLog, uid, utcnow, iso
from app.common.errors import DomainError
from .policy import require_admin

def slugify(title):
    value = normalize("NFKD", title).encode("ascii", "ignore").decode().lower()
    return (re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:140] or "story") + "-" + uid()[:8]

def public_filter():
    return (Resource.status == "published", Resource.published_at <= utcnow())

def validate_references(db, category_id, fandom_id=None, cover_media_id=None):
    if not db.get(Category, category_id):
        raise DomainError("UNKNOWN_CATEGORY", "Choose an existing category.", 422)
    if fandom_id and not db.get(FandomCategory, (fandom_id, category_id)):
        raise DomainError("FANDOM_CATEGORY_MISMATCH", "This fandom is not linked to the selected category.", 422)
    if cover_media_id:
        asset = db.get(MediaAsset, cover_media_id)
        if not asset or not asset.approved or asset.kind != "image":
            raise DomainError("INVALID_COVER", "Choose an approved image asset.", 422)

def resource_statement():
    ratings = select(Rating.resource_id, func.avg(Rating.value).label("average"), func.count().label("count")).group_by(Rating.resource_id).subquery()
    saves = select(Bookmark.resource_id, func.count().label("count")).group_by(Bookmark.resource_id).subquery()
    return select(Resource, Category.name.label("category_name"), Category.slug.label("category_slug"), Fandom.name.label("fandom_name"), MediaAsset.storage_key.label("cover_key"), func.coalesce(ratings.c.average,0).label("rating_average"), func.coalesce(ratings.c.count,0).label("rating_count"), func.coalesce(saves.c.count,0).label("bookmark_count")).join(Category, Resource.category_id == Category.id).outerjoin(Fandom, Resource.fandom_id == Fandom.id).outerjoin(MediaAsset, Resource.cover_media_id == MediaAsset.id).outerjoin(ratings, Resource.id == ratings.c.resource_id).outerjoin(saves, Resource.id == saves.c.resource_id)

def row_dto(row, *, detail=False):
    c = row[0]
    out = {"id":c.id,"slug":c.slug,"title":c.title,"summary":c.summary,"kind":c.kind,"category_id":c.category_id,"category_name":row.category_name,"category_slug":row.category_slug,"fandom_id":c.fandom_id,"fandom_name":row.fandom_name,"cover_url":row.cover_key,"release_year":c.release_year,"has_spoilers":c.has_spoilers,"published_at":iso(c.published_at),"rating_average":round(float(row.rating_average),2),"rating_count":row.rating_count,"bookmark_count":row.bookmark_count,"version":c.version}
    if detail: out.update(body_markdown=c.body_markdown, source_url=c.source_url)
    return out

def list_resources(db, query):
    conditions = list(public_filter())
    if query.category_id: conditions.append(Resource.category_id == query.category_id)
    if query.fandom_id: conditions.append(Resource.fandom_id == query.fandom_id)
    if query.kind: conditions.append(Resource.kind == query.kind)
    if query.release_year: conditions.append(Resource.release_year == query.release_year)
    if query.q: conditions.append(or_(Resource.title.icontains(query.q,autoescape=True),Resource.summary.icontains(query.q,autoescape=True)))
    if query.genre_id: conditions.append(Resource.id.in_(select(ResourceGenre.resource_id).where(ResourceGenre.genre_id == query.genre_id)))
    total = db.scalar(select(func.count()).select_from(Resource).where(*conditions)) or 0
    statement = resource_statement().where(*conditions)
    if query.sort == "az": statement = statement.order_by(Resource.title, Resource.id)
    elif query.sort == "popular":
        # Transparent baseline: most saved, then rated; no invented ML score.
        statement = statement.order_by(statement.selected_columns.bookmark_count.desc(),statement.selected_columns.rating_count.desc(),Resource.id)
    else: statement = statement.order_by(Resource.published_at.desc(),Resource.id)
    rows = db.execute(statement.offset((query.page-1)*query.page_size).limit(query.page_size)).all()
    return [row_dto(row) for row in rows], {"page":query.page,"page_size":query.page_size,"total":total,"total_pages":ceil(total/query.page_size)}

def get_public_resource(db, resource_id):
    row = db.execute(resource_statement().where(Resource.id == resource_id, *public_filter())).first()
    if not row: raise DomainError("NOT_FOUND", "Content was not found.", 404)
    return row_dto(row, detail=True)

def published_record(db, resource_id):
    record = db.scalar(select(Resource).where(Resource.id == resource_id, *public_filter()))
    if not record: raise DomainError("NOT_FOUND", "Content was not found.", 404)
    return record

def create_resource(db, actor, payload, request_id=None):
    require_admin(actor)
    validate_references(db,payload.category_id,payload.fandom_id,payload.cover_media_id)
    record = Resource(**payload.model_dump(), author_id=actor.id, slug=slugify(payload.title), published_at=utcnow() if payload.status == "published" else None)
    db.add(record); db.flush()
    db.add(AuditLog(actor_id=actor.id,action="resource.create",target_type="resource",target_id=record.id,request_id=request_id,details={"status":record.status}))
    return record

def update_resource(db, actor, resource_id, payload, expected_version, request_id=None):
    require_admin(actor)
    validate_references(db,payload.category_id,payload.fandom_id,payload.cover_media_id)
    current = db.get(Resource,resource_id)
    if not current: raise DomainError("NOT_FOUND","Content was not found.",404)
    if current.kind != payload.kind:
        raise DomainError("IMMUTABLE_KIND", "Create a new resource when changing its content type.", 422)
    values=payload.model_dump()
    values.update(version=expected_version+1, published_at=(current.published_at or utcnow()) if payload.status == "published" else None)
    result=db.execute(update(Resource).where(Resource.id==resource_id,Resource.version==expected_version).values(**values),execution_options={"synchronize_session":False})
    if result.rowcount!=1: raise DomainError("VERSION_CONFLICT","The item changed. Reload before saving.",409)
    db.add(AuditLog(actor_id=actor.id,action="resource.update",target_type="resource",target_id=resource_id,request_id=request_id,details={"version":expected_version+1}))
    db.expire(current)
    return current

def archive_resource(db, actor, resource_id, expected_version, request_id=None):
    require_admin(actor)
    result=db.execute(update(Resource).where(Resource.id==resource_id,Resource.version==expected_version).values(status="archived",version=expected_version+1),execution_options={"synchronize_session":"fetch"})
    if result.rowcount!=1: raise DomainError("VERSION_CONFLICT","The item changed or does not exist.",409)
    db.add(AuditLog(actor_id=actor.id,action="resource.archive",target_type="resource",target_id=resource_id,request_id=request_id,details={}))
