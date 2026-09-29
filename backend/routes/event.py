from pathlib import Path

from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError

from crud.event import (
    get_event,
    get_events,
    load_event_relations,
    create_event_with_content,
    update_event_with_content,
    set_event_status,
    delete_event_with_content,
)
from extensions import db
from middleware.auth_middleware import admin_required, token_required, get_optional_user
from models.category import Category
from schema.event import (
    EVENT_STATUSES,
    EventCreate,
    EventUpdate,
    EventStatusUpdate,
    serialize_event,
)
from services.media import save_file
from utils.event_time import now_vn, parse_event_datetime, parse_vn_date

event_bp = Blueprint("event", __name__, url_prefix="/events")

MAX_LIMIT = 100
MAX_IMAGE_BYTES = 5 * 1024 * 1024
IMAGE_SIGNATURES = {
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".gif": (b"GIF87a", b"GIF89a"),
    ".webp": (b"RIFF",),
}


def _bad_request(message, errors=None):
    body = {"message": message}
    if errors:
        body["errors"] = errors
    return jsonify(body), 400


def _validation_errors(error):
    errors = {}
    for item in error.errors():
        field = ".".join(str(part) for part in item["loc"]) or "event"
        errors[field] = item["msg"].removeprefix("Value error, ")
    return errors


def _is_admin(user):
    return user is not None and user.role == "admin"


def _can_view(event, user):
    if event.content.status == "DONE":
        return True
    return user is not None and (_is_admin(user) or event.content.author_id == user.id)


def _payload(events):
    authors, categories = load_event_relations(events)
    return [
        serialize_event(
            e,
            author=authors.get(e.content.author_id),
            category=categories.get(e.content.category_id),
        )
        for e in events
    ]


def _bool_arg(name, default):
    value = request.args.get(name)
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes")


def _validate_image(file):
    """Return an error message, or None when the upload is an acceptable image."""
    extension = Path(file.filename or "").suffix.lower()
    signatures = IMAGE_SIGNATURES.get(extension)
    if signatures is None or not (file.mimetype or "").startswith("image/"):
        return "Image must be a JPG, PNG, GIF or WEBP file"
    file.stream.seek(0, 2)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > MAX_IMAGE_BYTES:
        return "Image must be 5 MB or smaller"
    head = file.stream.read(12)
    file.stream.seek(0)
    if not any(head.startswith(sig) for sig in signatures):
        return "Image content does not match its file type"
    if extension == ".webp" and head[8:12] != b"WEBP":
        return "Image content does not match its file type"
    return None


def _remove_upload(media_url):
    try:
        path = Path(media_url.replace("\\", "/").lstrip("/")).resolve()
        uploads = Path("uploads").resolve()
        if uploads in path.parents and path.is_file():
            path.unlink()
    except OSError:
        pass


@event_bp.get("")
def get_events_api():
    """Search events.

    scope=public (default): published events, visible to everyone.
    scope=mine: every event the signed-in user created, any status.
    scope=moderation: admin only, filter with status=PENDING|DONE|REJECTED|ALL.
    """
    user = get_optional_user()
    scope = request.args.get("scope", "public")

    if scope == "public":
        statuses = ["DONE"]
        author_id = None
    elif scope == "mine":
        if user is None:
            return jsonify({"message": "Sign in to see your events"}), 401
        statuses = None
        author_id = user.id
    elif scope == "moderation":
        if not _is_admin(user):
            return jsonify({"message": "Administrator access required"}), 403
        status = request.args.get("status", "PENDING").strip().upper()
        if status != "ALL" and status not in EVENT_STATUSES:
            return _bad_request("status must be PENDING, DONE, REJECTED or ALL")
        statuses = None if status == "ALL" else [status]
        author_id = None
    else:
        return _bad_request("scope must be public, mine or moderation")

    try:
        date_from = parse_vn_date(request.args.get("date_from"))
        date_to = parse_vn_date(request.args.get("date_to"))
        start_time = parse_event_datetime(request.args.get("start_time"))
        end_time = parse_event_datetime(request.args.get("end_time"))
    except ValueError:
        return _bad_request(
            "Invalid date. Use YYYY-MM-DD for date_from/date_to "
            "and ISO datetimes for start_time/end_time"
        )
    if date_from and date_to and date_to < date_from:
        return _bad_request("date_to must be on or after date_from")

    sort_by = request.args.get("sort_by", "start_time")
    sort_order = request.args.get("sort_order", "asc")
    if sort_by not in ("start_time", "created_at", "updated_at"):
        return _bad_request("sort_by must be start_time, created_at or updated_at")
    if sort_order not in ("asc", "desc"):
        return _bad_request("sort_order must be asc or desc")

    skip = max(request.args.get("skip", default=0, type=int), 0)
    limit = min(max(request.args.get("limit", default=20, type=int), 1), MAX_LIMIT)

    events, total = get_events(
        q=request.args.get("q"),
        city=request.args.get("city"),
        date_from=date_from,
        date_to=date_to,
        include_past=_bool_arg("include_past", scope != "public"),
        statuses=statuses,
        author_id=author_id,
        start_time=start_time,
        end_time=end_time,
        skip=skip,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return jsonify({"total": total, "items": _payload(events)}), 200


@event_bp.get("/<int:event_id>")
def get_event_api(event_id):
    event = get_event(event_id)
    if event is None or not _can_view(event, get_optional_user()):
        return jsonify({"message": "Event not found"}), 404
    return jsonify(_payload([event])[0]), 200


@event_bp.post("")
@token_required
def create_event_api():
    """Create an event from multipart form data (optional single `image` file).

    Administrators publish immediately; other members' events wait for review.
    """
    user = g.current_user
    try:
        data = EventCreate.model_validate(request.form.to_dict())
    except ValidationError as error:
        return _bad_request("Please check the event details", _validation_errors(error))

    if db.session.get(Category, data.category_id) is None:
        return _bad_request("Please check the event details", {"category_id": "Unknown category"})
    if data.start_time < now_vn():
        return _bad_request("Please check the event details", {"start_time": "Start time must be in the future"})

    image = request.files.get("image")
    if image is not None and image.filename:
        image_error = _validate_image(image)
        if image_error:
            return _bad_request("Please check the event details", {"image": image_error})
    else:
        image = None

    image_url = None
    if image is not None:
        saved = save_file(image, "events", data.category_id)
        image_url = Path(saved).as_posix() if saved else None

    try:
        event = create_event_with_content(
            author_id=user.id,
            category_id=data.category_id,
            title=data.title,
            body=data.body,
            status="DONE" if _is_admin(user) else "PENDING",
            location_name=data.location_name,
            city=data.city,
            latitude=data.latitude,
            longitude=data.longitude,
            start_time=data.start_time,
            end_time=data.end_time,
            register_url=data.register_url,
            image_url=image_url,
        )
    except Exception:
        if image_url:
            _remove_upload(image_url)
        raise

    return jsonify(_payload([event])[0]), 201


@event_bp.put("/<int:event_id>")
@token_required
def update_event_api(event_id):
    """Admins may edit any event; authors may edit their own while it is PENDING."""
    user = g.current_user
    event = get_event(event_id)
    if event is None or not _can_view(event, user):
        return jsonify({"message": "Event not found"}), 404

    is_author = event.content.author_id == user.id
    if not _is_admin(user) and not (is_author and event.content.status == "PENDING"):
        return jsonify({"message": "Only pending events can be edited by their creator"}), 403

    try:
        data = EventUpdate.model_validate(request.get_json(silent=True) or {})
    except ValidationError as error:
        return _bad_request("Please check the event details", _validation_errors(error))

    changes = data.model_dump(exclude_unset=True)
    for required in ("title", "body", "category_id", "location_name", "city",
                     "latitude", "longitude", "start_time"):
        if required in changes and changes[required] is None:
            return _bad_request("Please check the event details", {required: "This field cannot be empty"})

    if "category_id" in changes and db.session.get(Category, changes["category_id"]) is None:
        return _bad_request("Please check the event details", {"category_id": "Unknown category"})

    start = changes.get("start_time", event.start_time)
    end = changes.get("end_time", event.end_time)
    if end is not None and end <= start:
        return _bad_request("Please check the event details", {"end_time": "end_time must be after start_time"})

    event = update_event_with_content(event, changes)
    return jsonify(_payload([event])[0]), 200


@event_bp.patch("/<int:event_id>/status")
@admin_required
def update_event_status_api(event_id):
    event = get_event(event_id)
    if event is None:
        return jsonify({"message": "Event not found"}), 404
    try:
        data = EventStatusUpdate.model_validate(request.get_json(silent=True) or {})
    except ValidationError as error:
        return _bad_request("Invalid status", _validation_errors(error))

    event = set_event_status(event, data.status)
    return jsonify(_payload([event])[0]), 200


@event_bp.delete("/<int:event_id>")
@admin_required
def delete_event_api(event_id):
    event = get_event(event_id)
    if event is None:
        return jsonify({"message": "Event not found"}), 404

    for media_url in delete_event_with_content(event):
        _remove_upload(media_url)

    return jsonify({"message": "Event deleted successfully"}), 200
