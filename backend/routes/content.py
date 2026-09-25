from flask import Blueprint, request, jsonify
from crud.mediaContent import get_medias, create_media
from schema.mediaContent import ContentMediaResponse
from services.media import save_file
from crud.charactercontent import get_characters_by_content

from crud.content import (
    create_content,
    get_content,
    get_contents,
    update_content,
    delete_content
)

from crud.contentreaction import (
    create_reaction
)

from schema.content import (
    ContentCreate,
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

    if content is None:
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
def create():
    category_id = request.form.get("category_id", type=int)
    title = request.form.get("title")
    body = request.form.get("body")
    content_type = request.form.get("content_type")

    content = create_content(
        author_id=1,  # Temporary
        category_id=category_id,
        title=title,
        body=body,
        content_type=content_type
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
def react_to_content(content_id):
    # Temporary
    user_id = 3

    content = get_content(content_id)

    if content is None:
        return jsonify({
            "message": "Content not found"
        }), 404

    reaction_type = request.json.get("reaction_type")

    reaction = create_reaction(
        user_id=user_id,
        content_id=content_id,
        reaction_type=reaction_type
    )

    return jsonify({
        "message": "Reaction created successfully",
        "reaction": {
            "id": reaction.id,
            "user_id": reaction.user_id,
            "content_id": reaction.content_id,
            "reaction_type": reaction.reaction_type
        }
    }), 201

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

    total, contents = get_contents(
        category_id=category_id,
        title=title,
        content_type=content_type,
        skip=skip,
        limit=limit
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
def update(content_id):
    data = ContentUpdate.model_validate(request.json)
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
def delete(content_id):
    content = delete_content(content_id)
    if content is None:
        return jsonify({"message": "Content not found"}), 404

    return jsonify({"message": "Content deleted successfully"}), 200