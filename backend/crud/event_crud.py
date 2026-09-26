from extensions import db
from models.event import Event

def get_all_events():
    return Event.query.order_by(Event.id.desc()).all()

def create_event(title, location, event_date, description='', banner='', organizer='Fan Hub Plus Team'):
    ev = Event(
        title=title,
        description=description,
        location=location,
        event_date=event_date,
        banner=banner,
        organizer=organizer
    )
    db.session.add(ev)
    db.session.commit()
    return ev
