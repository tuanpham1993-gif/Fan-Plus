from flask import Blueprint, request, jsonify
from crud.mediaContent import get_medias, create_media
from schema.mediaContent import ContentMediaResponse
from services.media import save_file
from crud.charactercontent import get_characters_by_content
from crud.contentreaction import create_or_update_reaction
from middleware.auth_middleware import admin_required, token_required, get_optional_user
from flask import Blueprint, request, jsonify, g
from pydantic import ValidationError
from extensions import db
from models.category import Category

CONTENT_TYPES = {"NEWS", "ARTICLE", "EVENT", "POST"}
CONTENT_STATUSES = {"PENDING", "DONE", "REJECTED"}


def _is_admin(user):
    return user is not None and user.role == "admin"
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

from schema.charactercontent import (
    CharacterContentResponse, CharacterContentCreate
)

from schema.character import (
    CharacterCreate, CharacterResponse, CharacterUpdate
)

content_bp = Blueprint(
    "content",
    __name__,
    url_prefix="/contents"
)

@content_bp.get("/<int:content_id>")
def get_one(content_id):
    content = get_content(content_id)
    viewer = get_optional_user()

    # Pending / rejected items are visible only to their author and to administrators.
    if content is None or (content.status != "DONE" and not _is_admin(viewer)
                           and (viewer is None or viewer.id != content.author_id)):
        return jsonify({
            "message": "Content not found"
        }), 404

    medias = get_medias(
        content_id=content_id
    )

    character_contents = get_characters_by_content(
        content_id
    )

    response = ContentResponse.model_validate(
        content
    )

    return jsonify({
        **response.model_dump(mode="json"),

        "medias": [
            ContentMediaResponse
                .model_validate(media)
                .model_dump(mode="json")
            for media in medias
        ],

        "characters": [
            CharacterResponse
                .model_validate(character_content.character)
                .model_dump(mode="json")
            for character_content in character_contents
        ]
    }), 200

@content_bp.post("")
@token_required
def create():
    category_id = request.form.get("category_id", type=int)
    title = request.form.get("title")
    body = request.form.get("body")
    content_type = (request.form.get("content_type") or "POST").upper()
    user_id = g.current_user.id

    errors = {}
    if not title or len(title.strip()) < 3:
        errors["title"] = "Title must have at least 3 characters"
    if not body or not body.strip():
        errors["body"] = "Body is required"
    if content_type not in CONTENT_TYPES - {"EVENT"}:
        errors["content_type"] = "Use NEWS, ARTICLE or POST (events are created through /events)"
    if category_id is None or db.session.get(Category, category_id) is None:
        errors["category_id"] = "Unknown category"
    if errors:
        return jsonify({"message": "Please check the content details", "errors": errors}), 400

    content = create_content(
        author_id=user_id,
        category_id=category_id,
        title=title.strip(),
        body=body.strip(),
        content_type=content_type,
        status="DONE" if _is_admin(g.current_user) else "PENDING"
    )

    files = request.files.getlist("media")

    for index, file in enumerate(files):
        media_url = save_file(file, "contents", category_id)

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

    medias = get_medias(content_id=content.id)

    response = ContentResponse.model_validate(content)

    return jsonify({
        **response.model_dump(mode="json"),
        "medias": [
            ContentMediaResponse
                .model_validate(media)
                .model_dump(mode="json")
            for media in medias
        ]
    }), 201

@content_bp.post("/<int:content_id>/reactions")
@token_required
def react_to_content(content_id):
    user_id = g.current_user.id

    content = get_content(content_id)

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    reaction_type = str((request.get_json(silent=True) or {}).get("reaction_type", "")).upper()
    if reaction_type not in ("LIKE", "DISLIKE"):
        return jsonify({"message": "reaction_type must be LIKE or DISLIKE"}), 400

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

@content_bp.get("")
def get_list():
    category_id = request.args.get(
        "category_id",
        type=int
    )

    title = request.args.get("title")

    content_type = request.args.get(
        "content_type"
    )

    skip = request.args.get(
        "skip",
        default=0,
        type=int
    )

    limit = request.args.get(
        "limit",
        default=20,
        type=int
    )

    viewer = get_optional_user()
    status_arg = (request.args.get("status") or "").upper()
    author_id = None
    if request.args.get("mine") in ("1", "true") and viewer is not None:
        author_id = viewer.id          # the caller's own items, any status
        statuses = None
    elif _is_admin(viewer) and status_arg in CONTENT_STATUSES | {"ALL"}:
        statuses = None if status_arg == "ALL" else [status_arg]
    else:
        statuses = ["DONE"]            # public catalogue: approved items only

    total, contents = get_contents(
        category_id=category_id,
        title=title,
        content_type=content_type,
        skip=skip,
        limit=limit,
        sort_by=request.args.get("sort_by", "created_at"),
        sort_order=request.args.get("sort_order", "desc"),
        statuses=statuses,
        author_id=author_id
    )

    items = []

    for content, like_count, dislike_count in contents:

        character_contents = get_characters_by_content(
            content.id
        )

        items.append({
            **ContentResponse
                .model_validate(content)
                .model_dump(mode="json"),

            "like_count": like_count,
            "dislike_count": dislike_count,

            "characters": [
                CharacterResponse
                    .model_validate(
                        character_content.character
                    )
                    .model_dump(mode="json")
                for character_content in character_contents
            ]
        })

    return jsonify({
        "total": total,
        "items": items
    }), 200

@content_bp.patch("/<int:content_id>")
@token_required
def update(content_id):
    try:
        data = ContentUpdate.model_validate(request.get_json(silent=True) or {})
    except ValidationError:
        return jsonify({"message": "Invalid content data"}), 400

    current = get_content(content_id)
    if current is None:
        return jsonify({"message": "Content not found"}), 404
    user = g.current_user
    if not _is_admin(user):
        if current.author_id != user.id:
            return jsonify({"message": "You can only edit your own content"}), 403
        if data.status is not None:
            return jsonify({"message": "Only an administrator can approve or reject content"}), 403
    if data.status is not None and data.status.upper() not in CONTENT_STATUSES:
        return jsonify({"message": "status must be PENDING, DONE or REJECTED"}), 400
    if data.status is not None:
        data.status = data.status.upper()

    content = update_content(
        content_id=content_id,
        category_id=data.category_id,
        title=data.title,
        body=data.body,
        content_type=data.content_type,
        status = data.status
    )

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    response = ContentResponse.model_validate(content)
    return jsonify(response.model_dump()), 200

@content_bp.delete("/<int:content_id>")
@admin_required
def delete(content_id):
    content = get_content(content_id)
    if content is None:
        return jsonify({"message": "Content not found"}), 404
    content = delete_content(content_id)
    return jsonify({"message": "Content deleted successfully"}), 200