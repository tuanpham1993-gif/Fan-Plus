from flask import Blueprint, request, jsonify
from datetime import datetime
from schema.event import EventUpdate, EventResponse
from crud.event import (
    get_event,
    get_events,
    create_event,
    update_event,
    delete_event
)
from middleware.auth_middleware import admin_required, token_required
from flask import Blueprint, request, jsonify, g
from crud.content import delete_content
from extensions import db
from schema.mediaContent import ContentMediaResponse
from schema.content import ContentResponse
from crud.content import create_content
from crud.mediaContent import create_media, get_medias
from services.media import save_file

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
@token_required
def create_event_api():
    category_id = request.form.get("category_id",type=int)
    title = request.form.get("title")
    body = request.form.get("body")
    try:
        start_time = datetime.fromisoformat(
            request.form.get("start_time")
        )

        end_time = datetime.fromisoformat(
            request.form.get("end_time")
        )

    except (TypeError, ValueError):
        return jsonify({
            "message": (
                "Invalid datetime format. "
                "Use ISO format like "
                "2026-10-01T08:00:00"
            )
        }), 400
    
    user_id = g.current_user.id
    content = create_content(
        author_id=user_id, category_id=category_id,
        title=title,body=body,
        content_type="EVENT"
    )

    event = create_event(
        content_id=content.id,
        location_name=request.form.get("location_name"),
        city=request.form.get("city"),
        latitude=request.form.get("latitude",type=float),
        longitude=request.form.get("longitude",type=float),
        start_time=start_time,
        end_time=end_time,
        register_url=request.form.get("register_url")
    )

    files = request.files.getlist("media")

    for index, file in enumerate(files):
        media_url = save_file(file, "contents", category_id)

        if media_url is None:
            continue

        if file.mimetype.startswith("video/"):
            media_type = "VIDEO"
        else:
            media_type = "IMAGE"

        create_media(content_id=content.id,media_type=media_type,
                        media_url=media_url,display_order=index)
    medias = get_medias(content_id=content.id)
    response = ContentResponse.model_validate(content)
    
    return jsonify({
        **response.model_dump(mode="json"),

        "event": EventResponse
            .model_validate(event)
            .model_dump(mode="json"),

        "medias": [
            ContentMediaResponse
                .model_validate(media)
                .model_dump(mode="json")
            for media in medias
        ]
    }), 201

# PUT /events/<event_id>
@event_bp.put("/<int:event_id>")
@token_required
def update_event_api(event_id):

    event = get_event(event_id)

    if event is None:
        return jsonify({"message": "Event not found"}), 404

    data = EventUpdate.model_validate(request.get_json())

    if (data.start_time is not None and data.end_time is not None
        and data.end_time <= data.start_time):
        return jsonify({"message": "end_time must be after start_time"}), 400

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
        EventResponse
        .model_validate(event)
        .model_dump(mode="json")
    ), 200

# DELETE /events/<event_id>
@event_bp.delete("/<int:event_id>")
@admin_required
def delete_event_api(event_id):
    event = get_event(event_id=event_id)

    if event is None:
        return jsonify({
            "message": "Event not found"
        }), 404

    content = event.content

    delete_event(event_id)
    delete_content(content_id=content.id)

    return jsonify({
        "message": "Event deleted successfully"
    }), 200