"""Administrator workspace API used by the React admin panel (/admin).

The frontend works with one "workspace" snapshot (categories, contents, events,
users, feedback, fan submissions, FAQs) and small create/update/delete calls.
This blueprint maps those shapes onto the existing fanhub tables; every route
requires an administrator token.
"""
import json
import os
import threading
import uuid

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func

from crud.event import create_event_with_content, delete_event_with_content, update_event_with_content
from extensions import db
from middleware.auth_middleware import admin_required
from models.bookmark import Bookmark
from models.category import Category
from models.character import Character
from models.charactercontent import CharacterContent
from models.content import Content
from models.contentreaction import ContentReaction
from models.event import Event
from models.feedback import Feedback
from models.mediaContent import ContentMedia
from models.merchandise_item import MerchandiseItem
from models.review import Review
from models.user import User
from utils.event_time import parse_event_datetime, utc_iso, vn_iso

admin_ws_bp = Blueprint("admin_workspace", __name__, url_prefix="/api/admin")

# The frontend addresses the four seeded categories by slug; any other category by its numeric id.
SLUGS = {1: "anime", 2: "gaming", 3: "movies", 4: "tv"}
SLUG_IDS = {v: k for k, v in SLUGS.items()}
STYLE = {"anime": ("sparkles", "#ff9bb3"), "gaming": ("gamepad", "#8bded1"),
         "movies": ("film", "#ffd27a"), "tv": ("tv", "#b7a6ff")}
DEFAULT_IMAGE = "/art/community.svg"

FAQ_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "knowledge_base.json")
_faq_lock = threading.Lock()


def _error(message, status=400):
    return jsonify({"message": message}), status


def cat_key(category_id):
    return SLUGS.get(category_id, str(category_id))


def cat_id(key):
    if key in (None, ""):
        return None
    if str(key) in SLUG_IDS:
        return SLUG_IDS[str(key)]
    try:
        return int(key)
    except (TypeError, ValueError):
        return None


def media_path(url):
    if not url:
        return None
    return url if url.startswith(("http://", "https://", "/")) else "/" + url


def _body(key):
    data = request.get_json(silent=True) or {}
    return data.get(key) if isinstance(data.get(key), dict) else data


# ------------------------------------------------------------------ serializers
def category_json(c, counts):
    key = cat_key(c.category_id)
    icon, color = STYLE.get(key, ("globe", "#8bded1"))
    return {"id": key, "name": c.name, "description": c.description or "", "icon": icon,
            "color": color, "accentColor": color, "contentCount": counts.get(c.category_id, 0)}


def content_json(c, authors, likes):
    medias = sorted(c.medias, key=lambda m: m.display_order)
    images = [m for m in medias if m.media_type == "IMAGE"]
    video = next((m for m in medias if m.media_type == "VIDEO"), None)
    audio = next((m for m in medias if m.media_type == "AUDIO"), None)
    kind = "video" if video else "audio" if audio else "gallery" if len(images) > 1 else "article"
    tagged = [cc.character.name for cc in c.character_contents if cc.character is not None]
    created = c.created_at
    return {
        "id": str(c.id), "title": c.title, "categoryId": cat_key(c.category_id),
        "fandom": tagged[0] if tagged else "General Community", "type": kind,
        "description": (c.body or "")[:160], "body": c.body or "",
        "image": media_path(images[0].media_url) if images else DEFAULT_IMAGE,
        "mediaUrl": media_path((video or audio).media_url) if (video or audio) else None,
        "genre": "General", "year": created.year if created else 2026,
        "publishedAt": utc_iso(created), "popularity": likes.get(c.id, 0), "rating": 0,
        "duration": "5 min read", "tags": [c.content_type.lower()],
        "status": "published" if c.status == "DONE" else "draft",
        "author": authors.get(c.author_id, "Fan Hub"), "spoiler": False,
        "sourceLabel": "Fan Hub Plus database",
    }


def event_json(e):
    c = e.content
    image = next((m.media_url for m in sorted(c.medias, key=lambda m: m.display_order) if m.media_type == "IMAGE"), None)
    return {
        "id": str(e.id), "title": c.title, "city": e.city, "venue": e.location_name,
        "lat": float(e.latitude), "lng": float(e.longitude),
        "startsAt": vn_iso(e.start_time), "endsAt": vn_iso(e.end_time or e.start_time),
        "categoryId": cat_key(c.category_id), "description": c.body or "",
        "image": media_path(image) or DEFAULT_IMAGE, "ticketUrl": e.register_url or None,
        "status": c.status,
    }


def user_json(u):
    data = u.to_dict()
    data["id"] = str(u.id)
    return data


def feedback_json(f):
    return {"id": str(f.id), "userId": str(f.user_id), "type": f.type, "message": f.content,
            "status": "open" if f.status == "pending" else "resolved", "createdAt": utc_iso(f.created_at)}


def submission_json(c):
    tagged = [cc.character.name for cc in c.character_contents if cc.character is not None]
    return {"id": str(c.id), "userId": str(c.author_id), "title": c.title, "categoryId": cat_key(c.category_id),
            "fandom": tagged[0] if tagged else "General Community", "body": c.body or "",
            "status": {"PENDING": "pending", "DONE": "approved", "REJECTED": "rejected"}[c.status],
            "reason": "", "createdAt": utc_iso(c.created_at)}


def load_faqs():
    try:
        with open(FAQ_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return []


def save_faqs(items):
    tmp = FAQ_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(items, fh, ensure_ascii=False, indent=2)
    os.replace(tmp, FAQ_FILE)


def workspace():
    counts = dict(db.session.query(Content.category_id, func.count(Content.id))
                  .filter(Content.status == "DONE").group_by(Content.category_id).all())
    authors = dict(db.session.query(User.id, User.name).all())
    likes = dict(db.session.query(ContentReaction.content_id, func.count(ContentReaction.id))
                 .filter(ContentReaction.reaction_type == "LIKE").group_by(ContentReaction.content_id).all())
    contents = Content.query.order_by(Content.created_at.desc()).all()
    return {
        "categories": [category_json(c, counts) for c in Category.query.order_by(Category.category_id).all()],
        # fan stories (POST) are handled in the review queue, events in the events tab
        "contents": [content_json(c, authors, likes) for c in contents if c.content_type in ("NEWS", "ARTICLE")],
        "events": [event_json(e) for e in Event.query.order_by(Event.start_time).all()],
        "users": [user_json(u) for u in User.query.order_by(User.id).all()],
        "feedback": [feedback_json(f) for f in Feedback.query.order_by(Feedback.created_at.desc()).all()],
        "submissions": [submission_json(c) for c in contents if c.content_type == "POST"],
        "faqs": load_faqs(),
    }


@admin_ws_bp.get("/workspace")
@admin_required
def get_workspace():
    return jsonify({"workspace": workspace()}), 200


# ------------------------------------------------------------------ contents
def _apply_media(content, data):
    ContentMedia.query.filter_by(content_id=content.id).delete()
    order = 0
    image = (data.get("image") or "").strip()
    if image and image != DEFAULT_IMAGE:
        db.session.add(ContentMedia(content_id=content.id, media_type="IMAGE", media_url=image.lstrip("/") if image.startswith("/uploads/") else image, display_order=order))
        order += 1
    media = (data.get("mediaUrl") or "").strip()
    if media:
        kind = "AUDIO" if data.get("type") == "audio" else "VIDEO"
        db.session.add(ContentMedia(content_id=content.id, media_type=kind, media_url=media, display_order=order))


def _validate_content(data):
    title = (data.get("title") or "").strip()
    if len(title) < 3 or len(title) > 255:
        return "Title must contain 3-255 characters."
    if cat_id(data.get("categoryId")) is None or db.session.get(Category, cat_id(data.get("categoryId"))) is None:
        return "Choose a valid category."
    if not ((data.get("body") or data.get("description") or "").strip()):
        return "Write the article body."
    for key in ("image", "mediaUrl"):
        url = (data.get(key) or "").strip()
        if url and not url.startswith(("https://", "/")):
            return "Media links must use HTTPS or a local path."
    return None


@admin_ws_bp.post("/contents")
@admin_required
def create_content_ws():
    data = _body("content")
    problem = _validate_content(data)
    if problem:
        return _error(problem)
    content = Content(author_id=g.current_user.id, category_id=cat_id(data["categoryId"]),
                      title=data["title"].strip(), body=(data.get("body") or data.get("description")).strip(),
                      content_type="ARTICLE", status="DONE" if data.get("status") == "published" else "PENDING")
    db.session.add(content)
    db.session.flush()
    _apply_media(content, data)
    db.session.commit()
    return jsonify({"content": content_json(content, {g.current_user.id: g.current_user.name}, {})}), 201


@admin_ws_bp.put("/contents/<int:content_id>")
@admin_required
def update_content_ws(content_id):
    content = db.session.get(Content, content_id)
    if content is None or content.content_type not in ("NEWS", "ARTICLE"):
        return _error("Content not found", 404)
    data = _body("content")
    problem = _validate_content(data)
    if problem:
        return _error(problem)
    content.title = data["title"].strip()
    content.body = (data.get("body") or data.get("description")).strip()
    content.category_id = cat_id(data["categoryId"])
    content.status = "DONE" if data.get("status") == "published" else "PENDING"
    _apply_media(content, data)
    db.session.commit()
    authors = dict(db.session.query(User.id, User.name).all())
    return jsonify({"content": content_json(content, authors, {})}), 200


def _delete_content_row(content):
    Bookmark.query.filter_by(content_id=content.id).delete()
    CharacterContent.query.filter_by(content_id=content.id).delete()
    Event.query.filter_by(content_id=content.id).delete()
    db.session.delete(content)   # media, reviews and reactions cascade


@admin_ws_bp.delete("/contents/<int:content_id>")
@admin_required
def delete_content_ws(content_id):
    content = db.session.get(Content, content_id)
    if content is None:
        return _error("Content not found", 404)
    _delete_content_row(content)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ------------------------------------------------------------------ categories
@admin_ws_bp.post("/categories")
@admin_required
def create_category_ws():
    data = _body("category")
    name = (data.get("name") or "").strip()
    if not 2 <= len(name) <= 100:
        return _error("Category name must contain 2-100 characters.")
    if Category.query.filter(func.lower(Category.name) == name.lower()).first():
        return _error("A category with this name already exists.", 409)
    cat = Category(name=name, description=(data.get("description") or "").strip() or None)
    db.session.add(cat)
    db.session.commit()
    return jsonify({"category": category_json(cat, {})}), 201


@admin_ws_bp.put("/categories/<key>")
@admin_required
def update_category_ws(key):
    cat = db.session.get(Category, cat_id(key)) if cat_id(key) else None
    if cat is None:
        return _error("Category not found", 404)
    data = _body("category")
    name = (data.get("name") or "").strip()
    if not 2 <= len(name) <= 100:
        return _error("Category name must contain 2-100 characters.")
    clash = Category.query.filter(func.lower(Category.name) == name.lower(), Category.category_id != cat.category_id).first()
    if clash:
        return _error("A category with this name already exists.", 409)
    cat.name, cat.description = name, (data.get("description") or "").strip() or None
    db.session.commit()
    return jsonify({"category": category_json(cat, {})}), 200


@admin_ws_bp.delete("/categories/<key>")
@admin_required
def delete_category_ws(key):
    cat = db.session.get(Category, cat_id(key)) if cat_id(key) else None
    if cat is None:
        return _error("Category not found", 404)
    used = (Content.query.filter_by(category_id=cat.category_id).count()
            + Character.query.filter_by(category_id=cat.category_id).count()
            + MerchandiseItem.query.filter_by(category_id=cat.category_id).count())
    if used:
        return _error(f"This category is still used by {used} item(s). Move or delete them first.", 409)
    db.session.delete(cat)
    db.session.commit()
    return jsonify({"ok": True}), 200


# ------------------------------------------------------------------ events
def _event_fields(data):
    try:
        start = parse_event_datetime(data.get("startsAt"))
        end = parse_event_datetime(data.get("endsAt"))
        lat, lng = float(data.get("lat")), float(data.get("lng"))
    except (TypeError, ValueError):
        return None, "Check the event date, time and coordinates."
    title = (data.get("title") or "").strip()
    if len(title) < 3:
        return None, "Event title must contain at least 3 characters."
    if not (data.get("venue") or "").strip() or not (data.get("city") or "").strip():
        return None, "Venue and city are required."
    if start is None or (end is not None and end <= start):
        return None, "The event must end after it starts."
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None, "Latitude or longitude is out of range."
    category = cat_id(data.get("categoryId"))
    if category is None or db.session.get(Category, category) is None:
        return None, "Choose a valid category."
    ticket = (data.get("ticketUrl") or "").strip() or None
    if ticket and not ticket.startswith(("http://", "https://")):
        return None, "Ticket link must start with http:// or https://."
    return dict(title=title, body=(data.get("description") or title).strip(), category_id=category,
                location_name=data["venue"].strip(), city=data["city"].strip(), latitude=lat, longitude=lng,
                start_time=start, end_time=end, register_url=ticket), None


@admin_ws_bp.post("/events")
@admin_required
def create_event_ws():
    fields, problem = _event_fields(_body("event"))
    if problem:
        return _error(problem)
    event = create_event_with_content(author_id=g.current_user.id, status="DONE", **fields)
    return jsonify({"event": event_json(event)}), 201


@admin_ws_bp.put("/events/<int:event_id>")
@admin_required
def update_event_ws(event_id):
    event = db.session.get(Event, event_id)
    if event is None:
        return _error("Event not found", 404)
    fields, problem = _event_fields(_body("event"))
    if problem:
        return _error(problem)
    event = update_event_with_content(event, fields)
    return jsonify({"event": event_json(event)}), 200


@admin_ws_bp.delete("/events/<int:event_id>")
@admin_required
def delete_event_ws(event_id):
    event = db.session.get(Event, event_id)
    if event is None:
        return _error("Event not found", 404)
    delete_event_with_content(event)
    return jsonify({"ok": True}), 200


# ------------------------------------------------------------------ fan submissions
@admin_ws_bp.post("/submissions/<int:content_id>/moderate")
@admin_required
def moderate_submission_ws(content_id):
    content = db.session.get(Content, content_id)
    if content is None or content.content_type != "POST":
        return _error("Submission not found", 404)
    data = request.get_json(silent=True) or {}
    decision = data.get("decision")
    if decision not in ("approved", "rejected"):
        return _error("decision must be approved or rejected")
    if decision == "rejected" and len((data.get("reason") or "").strip()) < 5:
        return _error("Give the author a short reason (at least 5 characters).")
    content.status = "DONE" if decision == "approved" else "REJECTED"
    db.session.commit()
    submission = submission_json(content)
    submission["reason"] = (data.get("reason") or "").strip()
    published = None
    if decision == "approved":
        authors = dict(db.session.query(User.id, User.name).all())
        published = content_json(content, authors, {})
    return jsonify({"submission": submission, "publishedContent": published}), 200


# ------------------------------------------------------------------ users & feedback
@admin_ws_bp.put("/users/<int:user_id>/status")
@admin_required
def set_user_status_ws(user_id):
    user = db.session.get(User, user_id)
    if user is None:
        return _error("User not found", 404)
    if user.id == g.current_user.id:
        return _error("You cannot suspend your own administrator account.")
    suspended = bool((request.get_json(silent=True) or {}).get("suspended"))
    user.status = "suspended" if suspended else "active"
    db.session.commit()
    return jsonify({"user": user_json(user)}), 200


@admin_ws_bp.put("/feedback/<int:feedback_id>/status")
@admin_required
def set_feedback_status_ws(feedback_id):
    fb = db.session.get(Feedback, feedback_id)
    if fb is None:
        return _error("Feedback not found", 404)
    status = str((request.get_json(silent=True) or {}).get("status", "")).lower()
    if status not in ("pending", "resolved", "dismissed"):
        return _error("status must be pending, resolved or dismissed")
    fb.status = status
    db.session.commit()
    return jsonify({"feedback": feedback_json(fb)}), 200


# ------------------------------------------------------------------ knowledge base (FAQ, JSON file)
def _faq_payload():
    data = _body("faq")
    question, answer = (data.get("question") or "").strip(), (data.get("answer") or "").strip()
    if len(question) < 5 or len(answer) < 5:
        return None, "Question and answer must each contain at least 5 characters."
    return {"question": question[:300], "answer": answer[:2000]}, None


@admin_ws_bp.post("/knowledge")
@admin_required
def create_faq_ws():
    item, problem = _faq_payload()
    if problem:
        return _error(problem)
    with _faq_lock:
        items = load_faqs()
        item = {"id": "faq-" + uuid.uuid4().hex[:8], **item}
        items.append(item)
        save_faqs(items)
    return jsonify({"faq": item}), 201


@admin_ws_bp.put("/knowledge/<faq_id>")
@admin_required
def update_faq_ws(faq_id):
    item, problem = _faq_payload()
    if problem:
        return _error(problem)
    with _faq_lock:
        items = load_faqs()
        for existing in items:
            if existing.get("id") == faq_id:
                existing.update(item)
                save_faqs(items)
                return jsonify({"faq": existing}), 200
    return _error("FAQ entry not found", 404)


@admin_ws_bp.delete("/knowledge/<faq_id>")
@admin_required
def delete_faq_ws(faq_id):
    with _faq_lock:
        items = load_faqs()
        remaining = [f for f in items if f.get("id") != faq_id]
        if len(remaining) == len(items):
            return _error("FAQ entry not found", 404)
        save_faqs(remaining)
    return jsonify({"ok": True}), 200
