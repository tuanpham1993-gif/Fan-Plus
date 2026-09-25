from models.event import Event
from extensions import db


def build_event_query(city=None,start_time=None,end_time=None):
    query = Event.query

    if city is not None: 
        city = city.strip().lower()
        query = query.filter(db.func.lower(Event.city).like(f"%{city}%"))

    if start_time is not None:
        query = query.filter(Event.start_time >= start_time)

    if end_time is not None:
        query = query.filter(Event.start_time <= end_time)

    return query

def get_event(event_id):
    return db.session.get(Event, event_id)

def get_events(
        city=None,start_time=None,end_time=None,
        skip=0,limit=20,sort_by="start_time",
        sort_order="asc"):
    query = build_event_query(
        city=city,
        start_time=start_time,
        end_time=end_time
    )

    total = query.count()

    if sort_by == "created_at":
        column = Event.created_at
    else:
        column = Event.updated_at

    if sort_order == "desc":
        query = query.order_by(column.desc())
    else:
        query = query.order_by(column.asc())

    events = query.offset(skip).limit(limit).all()

    return events, total

def create_event(
    content_id, location_name, city,
    latitude, longitude,start_time,
    end_time=None,register_url=None
    ):
    event = Event(
        content_id=content_id,
        location_name=location_name,
        city=city,
        latitude=latitude,
        longitude=longitude,
        start_time=start_time,
        end_time=end_time,
        register_url=register_url
    )

    db.session.add(event)
    db.session.commit()
    db.session.refresh(event)
    return event

def delete_event(event_id):
    event = get_event(event_id)

    if event is None:
        return None

    db.session.delete(event)
    db.session.commit()

    return event