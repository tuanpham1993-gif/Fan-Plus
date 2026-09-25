from flask import Blueprint, request, jsonify

from schema.event import EventCreate, EventUpdate, EventResponse
from crud.event import (
    get_event,
    get_events,
    create_event,
    update_event,
    delete_event
)

event_bp = Blueprint("event", __name__, url_prefix="/events")

@event_bp.get("/<int:event_id>")
def get_event_api(event_id):
    event = get_event(event_id)

    if event is None:
        return jsonify({
            "message": "Event not found"
        }), 404

    return jsonify(
        EventResponse.model_validate(event).model_dump(mode="json")
    ), 200


@event_bp.get("")
def get_events_api():
    city = request.args.get("city")
    start_time = request.args.get("start_time")
    end_time = request.args.get("end_time")

    skip = request.args.get("skip", default=0, type=int)
    limit = request.args.get("limit", default=20, type=int)

    sort_by = request.args.get("sort_by",default="start_time")

    sort_order = request.args.get("sort_order",default="asc")
    events, total = get_events(
        city=city,
        start_time=start_time,
        end_time=end_time,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return jsonify({
        "total": total,
        "items": [
            EventResponse.model_validate(event).model_dump(mode="json")
            for event in events
        ]
    }), 200

# POST /events
@event_bp.post("")
def create_event_api():
    data = EventCreate.model_validate(request.get_json())

    event = create_event(
        content_id=data.content_id,
        location_name=data.location_name,
        city=data.city,
        latitude=data.latitude,
        longitude=data.longitude,
        start_time=data.start_time,
        end_time=data.end_time,
        register_url=data.register_url
    )

    return jsonify(
        EventResponse.model_validate(event).model_dump(mode="json")
    ), 201

# PUT /events/<event_id>
@event_bp.put("/<int:event_id>")
def update_event_api(event_id):
    event = get_event(event_id)
    if event is None:
        return jsonify({
            "message": "Event not found"
        }), 404

    data = EventUpdate.model_validate(request.get_json())

    event = update_event(
        event_id=event_id,
        location_name=data.location_name,
        city=data.city,
        latitude=data.latitude,
        longitude=data.longitude,
        start_time=data.start_time,
        end_time=data.end_time,
        register_url=data.register_url
    )

    return jsonify(
        EventResponse.model_validate(event).model_dump(mode="json")
    ), 200

# DELETE /events/<event_id>
@event_bp.delete("/<int:event_id>")
def delete_event_api(event_id):
    event = delete_event(event_id)
    if event is None:
        return jsonify({
            "message": "Event not found"
        }), 404

    return jsonify({
        "message": "Event deleted successfully"
    }), 200
