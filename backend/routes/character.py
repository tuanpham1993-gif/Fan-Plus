
from flask import Blueprint, request, jsonify
from services.media import save_file

from schema.character import (
    CharacterCreate,
    CharacterResponse
)

from crud.character import (
    get_character,
    get_characters,
    create_character
)

character_bp = Blueprint(
    "character",
    __name__,
    url_prefix="/characters"
)


@character_bp.post("")
def create_character_api():
    name = request.form.get("name")
    description = request.form.get("description")
    category_id = request.form.get("category_id",type=int)

    image = request.files.get("image")

    image_url = save_file(
        image,
        folder="characters",
        category_id=category_id
    )

    if image_url is None:
        return jsonify({
            "message": "Character image is required"
        }), 400

    character = create_character(
        name=name,
        description=description,
        image_url=image_url,
        category_id=category_id
    )

    return jsonify(
        CharacterResponse
        .model_validate(character)
        .model_dump(mode="json")
    ), 201

@character_bp.get("/<int:character_id>")
def get_character_api(character_id):
    character = get_character(character_id)

    if character is None:
        return jsonify({
            "message": "Character not found"
        }), 404

    return jsonify(
        CharacterResponse
        .model_validate(character)
        .model_dump(mode="json")
    ), 200


@character_bp.get("")
def get_characters_api():
    category_id = request.args.get(
        "category_id",
        type=int
    )

    name = request.args.get(
        "name"
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

    characters = get_characters(
        category_id=category_id,
        name=name,
        skip=skip,
        limit=limit
    )

    return jsonify([
        CharacterResponse
        .model_validate(character)
        .model_dump(mode="json")
        for character in characters
    ]), 200
