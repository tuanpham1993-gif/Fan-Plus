from datetime import timedelta

from models.bookmark import Bookmark
from models.category import Category
from models.content import Content
from models.event import Event
from models.mediaContent import ContentMedia
from models.user import User
from extensions import db
from utils.event_time import day_start, now_vn

SORT_COLUMNS = {
    "start_time": Event.start_time,
    "created_at": Event.created_at,
    "updated_at": Event.updated_at,
}


def build_event_query(
    q=None,
    city=None,
    date_from=None,
    date_to=None,
    include_past=True,
    statuses=None,
    author_id=None,
    start_time=None,
    end_time=None,
):
    """Filter events. date_from / date_to are Vietnam calendar days (inclusive)
    and match any event whose time span overlaps them."""
    query = Event.query.join(Content, Content.id == Event.content_id)
    finish = db.func.coalesce(Event.end_time, Event.start_time)

    if q:
        pattern = f"%{q.strip().lower()}%"
        query = query.filter(db.or_(
            db.func.lower(Content.title).like(pattern),
            db.func.lower(Event.location_name).like(pattern),
            db.func.lower(Event.city).like(pattern),
        ))

    if city:
        query = query.filter(db.func.lower(Event.city) == city.strip().lower())

    if date_from is not None:
        query = query.filter(finish >= day_start(date_from))

    if date_to is not None:
        query = query.filter(Event.start_time < day_start(date_to) + timedelta(days=1))

    if not include_past:
        query = query.filter(finish >= now_vn())

    if statuses:
        query = query.filter(Content.status.in_(statuses))

    if author_id is not None:
        query = query.filter(Content.author_id == author_id)

    if start_time is not None:
        query = query.filter(Event.start_time >= start_time)

    if end_time is not None:
        query = query.filter(Event.start_time <= end_time)

    return query


def get_event(event_id):
    return db.session.get(Event, event_id)


def get_events(skip=0, limit=20, sort_by="start_time", sort_order="asc", **filters):
    query = build_event_query(**filters)
    total = query.count()

    column = SORT_COLUMNS.get(sort_by, Event.start_time)
    if sort_order == "desc":
        query = query.order_by(column.desc(), Event.id.desc())
    else:
        query = query.order_by(column.asc(), Event.id.asc())

    events = query.offset(skip).limit(limit).all()
    return events, total


def load_event_relations(events):
    """Batch-load authors and categories for serialize_event."""
    author_ids = {e.content.author_id for e in events}
    category_ids = {e.content.category_id for e in events}
    authors = {
        u.id: u for u in User.query.filter(User.id.in_(author_ids)).all()
    } if author_ids else {}
    categories = {
        c.category_id: c
        for c in Category.query.filter(Category.category_id.in_(category_ids)).all()
    } if category_ids else {}
    return authors, categories


def create_event_with_content(
    author_id, category_id, title, body, status,
    location_name, city, latitude, longitude,
    start_time, end_time=None, register_url=None, image_url=None,
):
    """Create the EVENT content, its event row and optional image in one commit."""
    content = Content(
        author_id=author_id,
        category_id=category_id,
        title=title,
        body=body,
        content_type="EVENT",
        status=status,
    )
    db.session.add(content)
    db.session.flush()

    event = Event(
        content_id=content.id,
        location_name=location_name,
        city=city,
        latitude=latitude,
        longitude=longitude,
        start_time=start_time,
        end_time=end_time,
        register_url=register_url,
    )
    db.session.add(event)

    if image_url:
        db.session.add(ContentMedia(
            content_id=content.id,
            media_type="IMAGE",
            media_url=image_url,
            display_order=0,
        ))

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    db.session.refresh(event)
    return event


CONTENT_FIELDS = ("title", "body", "category_id")
EVENT_FIELDS = (
    "location_name", "city", "latitude", "longitude",
    "start_time", "end_time", "register_url",
)


def update_event_with_content(event, changes):
    for field in CONTENT_FIELDS:
        if field in changes:
            setattr(event.content, field, changes[field])
    for field in EVENT_FIELDS:
        if field in changes:
            setattr(event, field, changes[field])
    db.session.commit()
    db.session.refresh(event)
    return event


def set_event_status(event, status):
    event.content.status = status
    db.session.commit()
    db.session.refresh(event)
    return event


def delete_event_with_content(event):
    """Delete the event, its content (media, reviews, reactions cascade) and
    bookmarks pointing at it. Returns the media URLs so files can be removed."""
    content = event.content
    media_urls = [m.media_url for m in content.medias]
    Bookmark.query.filter_by(content_id=content.id).delete()
    db.session.delete(event)
    db.session.delete(content)
    db.session.commit()
    return media_urls
