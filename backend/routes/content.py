from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError

from crud.mediaContent import get_medias, create_media
from schema.mediaContent import ContentMediaResponse
from services.media import save_file
from crud.charactercontent import get_characters_by_content
from crud.contentreaction import create_or_update_reaction

from middleware.auth_middleware import (
    admin_required,
    token_required,
    get_optional_user
)

from extensions import db
from models.category import Category

from crud.content import (
    create_content,
    get_content,
    get_contents,
    update_content,
    delete_content
)

from schema.content import (
    ContentUpdate,
    ContentResponse
)

from schema.character import (
    CharacterResponse
)

from models.review import Review


CONTENT_TYPES = {"NEWS", "ARTICLE", "EVENT", "POST"}
CONTENT_STATUSES = {"PENDING", "DONE", "REJECTED"}


def _is_admin(user):
    return user is not None and user.role == "admin"


content_bp = Blueprint(
    "content",
    __name__,
    url_prefix="/contents"
)


def format_content(content):
    category_data = None

    if content.category:
        category_data = {
            "id": content.category.category_id,
            "name": content.category.name,
            "slug": content.category.name.lower().replace(" ", "-")
        }

    author_data = None

    if content.author:
        author_data = {
            "id": content.author.id,
            "name": content.author.name
        }
    media_data = [
        {
            "id": m.id,
            "media_url": m.media_url,
            "media_type": m.media_type
        }
        for m in (content.medias or [])
    ]

    reviews = content.reviews or []

    if reviews:
        total_rating = sum(r.rating for r in reviews)
        avg_rating = round(total_rating / len(reviews), 1)
        rating_count = len(reviews)
    else:
        avg_rating = 0.0
        rating_count = 0

    rating_data = {
        "average": avg_rating,
        "count": rating_count
    }

    return {
        "id": content.id,
        "author_id": content.author_id,
        "category_id": content.category_id,
        "title": content.title,
        "body": content.body,
        "content_type": content.content_type,
        "status": content.status,
        "created_at": (
            content.created_at.isoformat()
            if content.created_at
            else None
        ),
        "updated_at": (
            content.updated_at.isoformat()
            if content.updated_at
            else None
        ),
        "category": category_data,
        "author": author_data,
        "media": media_data,
        "rating": rating_data,
    }

@content_bp.get("/<int:content_id>")
def get_one(content_id):
    content = get_content(content_id)
    viewer = get_optional_user()

    if (
        content is None
        or (
            content.status != "DONE"
            and not _is_admin(viewer)
            and (viewer is None or viewer.id != content.author_id)
        )
    ):
        return jsonify({
            "message": "Content not found"
        }), 404

    formatted = format_content(content)

    event_data = None

    if content.event:
        ev = content.event

        event_data = {
            "id": ev.id,
            "content_id": ev.content_id,
            "location_name": ev.location_name,
            "city": ev.city,
            "latitude": (
                float(ev.latitude)
                if ev.latitude is not None
                else 0.0
            ),
            "longitude": (
                float(ev.longitude)
                if ev.longitude is not None
                else 0.0
            ),
            "start_time": (
                ev.start_time.isoformat()
                if ev.start_time
                else None
            ),
            "end_time": (
                ev.end_time.isoformat()
                if ev.end_time
                else None
            ),
            "register_url": ev.register_url
        }

    return jsonify({
        "content": formatted,
        "event": event_data
    }), 200


@content_bp.post("")
@token_required
def create():
    category_id = request.form.get("category_id", type=int)
    title = request.form.get("title")
    body = request.form.get("body")
    content_type = (
        request.form.get("content_type") or "POST"
    ).upper()

    user_id = g.current_user.id

    errors = {}

    if not title or len(title.strip()) < 3:
        errors["title"] = "Title must have at least 3 characters"

    if not body or not body.strip():
        errors["body"] = "Body is required"

    if content_type not in CONTENT_TYPES - {"EVENT"}:
        errors["content_type"] = (
            "Use NEWS, ARTICLE or POST "
            "(events are created through /events)"
        )

    if (
        category_id is None
        or db.session.get(Category, category_id) is None
    ):
        errors["category_id"] = "Unknown category"

    if errors:
        return jsonify({
            "message": "Please check the content details",
            "errors": errors
        }), 400

    content = create_content(
        author_id=user_id,
        category_id=category_id,
        title=title.strip(),
        body=body.strip(),
        content_type=content_type,
        status=(
            "DONE"
            if _is_admin(g.current_user)
            else "PENDING"
        )
    )

    files = request.files.getlist("media")

    for index, file in enumerate(files):
        media_url = save_file(
            file,
            "contents",
            category_id
        )

        if media_url is None:
            continue

        media_type = "IMAGE"

        if file.mimetype.startswith("video/"):
            media_type = "VIDEO"

        create_media(
            content_id=content.id,
            media_type=media_type,
            media_url=media_url,
            display_order=index
        )

    formatted = format_content(content)

    return jsonify(formatted), 201

@content_bp.post("/<int:content_id>/reactions")
@token_required
def react_to_content(content_id):
    user_id = g.current_user.id

    content = get_content(content_id)

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    reaction_type = str(
        (request.get_json(silent=True) or {}).get(
            "reaction_type",
            ""
        )
    ).upper()

    if reaction_type not in ("LIKE", "DISLIKE"):
        return jsonify({
            "message": "reaction_type must be LIKE or DISLIKE"
        }), 400

    reaction = create_or_update_reaction(
        user_id=user_id,
        content_id=content_id,
        reaction_type=reaction_type
    )

    return jsonify({
        "message": "Reaction saved successfully",
        "reaction": {
            "id": reaction.id,
            "user_id": reaction.user_id,
            "content_id": reaction.content_id,
            "reaction_type": reaction.reaction_type
        }
    }), 200

@content_bp.put("/<int:content_id>/rating")
@token_required
def rate_content(content_id):
    content = get_content(content_id)

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    val = (
        request.json.get("value")
        if request.json
        else None
    )

    if not isinstance(val, int) or val < 1 or val > 5:
        return jsonify({
            "message": "Rating value must be between 1 and 5"
        }), 400

    user_id = g.current_user.id

    from crud.review import create_review, update_review

    existing = Review.query.filter_by(
        user_id=user_id,
        content_id=content_id
    ).first()

    if existing:
        update_review(
            existing.id,
            rating=val
        )
    else:
        create_review(
            user_id=user_id,
            content_id=content_id,
            rating=val
        )

    reviews = Review.query.filter_by(
        content_id=content_id
    ).all()

    avg_rating = (
        round(
            sum(r.rating for r in reviews) / len(reviews),
            1
        )
        if reviews
        else 0.0
    )

    return jsonify({
        "userRating": val,
        "average": avg_rating,
        "count": len(reviews)
    }), 200

@content_bp.get("")
def get_list():
    category_id = request.args.get(
        "category_id",
        type=int
    )

    title = (
        request.args.get("title")
        or request.args.get("q")
    )

    content_type = request.args.get("content_type")

    page = request.args.get(
        "page",
        type=int
    )

    limit = request.args.get(
        "limit",
        default=9,
        type=int
    )

    skip = request.args.get(
        "skip",
        type=int
    )

    if page is not None and page > 0:
        skip = (page - 1) * limit
    elif skip is None:
        skip = 0

    page_num = (
        (skip // limit) + 1
        if limit > 0
        else 1
    )

    viewer = get_optional_user()

    status_arg = (
        request.args.get("status") or ""
    ).upper()

    author_id = None

    if (
        request.args.get("mine")
        in ("1", "true")
        and viewer is not None
    ):
        author_id = viewer.id

        statuses = None

    elif (
        _is_admin(viewer)
        and status_arg in CONTENT_STATUSES | {"ALL"}
    ):
        statuses = (
            None
            if status_arg == "ALL"
            else [status_arg]
        )

    else:
        statuses = ["DONE"]

    total, contents = get_contents(
        category_id=category_id,
        title=title,
        content_type=content_type,
        skip=skip,
        limit=limit,
        sort_by=request.args.get(
            "sort_by",
            "created_at"
        ),
        sort_order=request.args.get(
            "sort_order",
            "desc"
        ),
        statuses=statuses,
        author_id=author_id
    )

    items = [
        format_content(c)
        for c in contents
    ]

    page_count = (
        (total + limit - 1) // limit
        if limit > 0
        else 1
    )

    return jsonify({
        "items": items,
        "total": total,
        "page": page_num,
        "pageSize": limit,
        "pageCount": page_count
    }), 200


@content_bp.patch("/<int:content_id>")
@token_required
def update(content_id):
    try:
        data = ContentUpdate.model_validate(
            request.get_json(silent=True) or {}
        )
    except ValidationError:
        return jsonify({
            "message": "Invalid content data"
        }), 400

    current = get_content(content_id)

    if current is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    user = g.current_user

    if not _is_admin(user):

        if current.author_id != user.id:
            return jsonify({
                "message": "You can only edit your own content"
            }), 403


        if data.status is not None:
            return jsonify({
                "message": (
                    "Only an administrator can "
                    "approve or reject content"
                )
            }), 403

    if (
        data.status is not None
        and data.status.upper()
        not in CONTENT_STATUSES
    ):
        return jsonify({
            "message": (
                "status must be PENDING, "
                "DONE or REJECTED"
            )
        }), 400

    if data.status is not None:
        data.status = data.status.upper()

    content = update_content(
        content_id=content_id,
        category_id=data.category_id,
        title=data.title,
        body=data.body,
        content_type=data.content_type,
        status=data.status
    )

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    formatted = format_content(content)

    return jsonify(formatted), 200

@content_bp.delete("/<int:content_id>")
@admin_required
def delete(content_id):
    content = get_content(content_id)

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    delete_content(content_id)

    return jsonify({
        "message": "Content deleted successfully"
    }), 200