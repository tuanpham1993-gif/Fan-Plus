from flask import Blueprint,g,Response
from app.schemas.requests import EventQuery
from app.services import events as service
from .helpers import query,ok
bp=Blueprint("events",__name__,url_prefix="/api/v1/events")
@bp.get("")
def events():
    items,meta=service.nearby_events(g.db,query(EventQuery));return ok(items,meta=meta)
@bp.get("/<event_id>")
def detail(event_id):return ok(service.get_event(g.db,event_id))
@bp.get("/<event_id>/calendar.ics")
def calendar(event_id):
    event=service.get_event(g.db,event_id)
    response=Response(service.event_ics(event),content_type="text/calendar; charset=utf-8")
    response.headers["Content-Disposition"]='attachment; filename="fanhub-event.ics"'
    return response
