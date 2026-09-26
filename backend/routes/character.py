from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from services.media import save_file

from schema.character import (
    CharacterCreate,
    CharacterUpdate,
    validate_image_file
)

from crud import character_crud

from middleware.auth_middleware import token_required


character_bp = Blueprint(
    "character",
    __name__,
    url_prefix="/characters"
)


# ============================================================
# GET ALL CHARACTERS
# GET /characters
# Visitor + User + Admin
# ============================================================

@character_bp.get("")
def get_characters_api():

    category_id = request.args.get(
        "category_id",
        type=int
    )

    search = request.args.get("search")

    page = request.args.get(
        "page",
        default=1,
        type=int
    )

    limit = request.args.get(
        "limit",
        default=10,
        type=int
    )

    items, total, pages = character_crud.get_characters(
        category_id=category_id,
        search=search,
        page=page,
        limit=limit
    )

    return jsonify({
        "success": True,
        "data": [
            item.to_dict()
            for item in items
        ],
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages
        }
    }), 200

@character_bp.get("/<int:character_id>")
def get_character_api(character_id):

    character = character_crud.get_character(
        character_id
    )

    if character is None:

        return jsonify({
            "success": False,
            "error": "Character not found."
        }), 404

    return jsonify({
        "success": True,
        "data": character.to_dict()
    }), 200


@character_bp.post("")
@token_required
def create_character_api():

    data = request.form.to_dict()

    category_id = request.form.get(
        "category_id",
        type=int
    )

    data["category_id"] = category_id

    image = request.files.get("image")

    if image is None:
        image = request.files.get("image_url")

    # --------------------------------
    # Kiểm tra ảnh
    # --------------------------------

    if image and image.filename:

        valid, err = validate_image_file(image)

        if not valid:

            return jsonify({
                "success": False,
                "error": err
            }), 400

    # --------------------------------
    # Validate dữ liệu Character
    # --------------------------------

    try:

        character_data = CharacterCreate.model_validate(data)

    except ValidationError as exc:

        return jsonify({
            "success": False,
            "error": exc.errors()[0]["msg"]
        }), 400

    # --------------------------------
    # Lưu ảnh
    # --------------------------------

    if image and image.filename:

        try:

            image_url = save_file(
                image,
                folder="characters",
                category_id=character_data.category_id
            )

        except (OSError, ValueError):

            return jsonify({
                "success": False,
                "error": "Could not save uploaded image."
            }), 500

    else:

        image_url = character_data.image_url

    # --------------------------------
    # Tạo Character
    # --------------------------------

    character, err_msg, status_code = (
        character_crud.create_character(
            name=character_data.name,
            bio=character_data.bio,
            image_url=image_url,
            category_id=character_data.category_id
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    return jsonify({
        "success": True,
        "data": character.to_dict()
    }), 201


# ============================================================
# UPDATE CHARACTER
# PUT /characters/<character_id>
# multipart/form-data
# User + Admin
# ============================================================

@character_bp.put("/<int:character_id>")
@token_required
def update_character_api(character_id):

    # --------------------------------
    # Kiểm tra Character tồn tại
    # --------------------------------

    existing_character = (
        character_crud.get_character(
            character_id
        )
    )

    if existing_character is None:

        return jsonify({
            "success": False,
            "error": "Character not found."
        }), 404

    # --------------------------------
    # Lấy dữ liệu từ form
    # --------------------------------

    data = request.form.to_dict()

    if request.form.get("category_id") is not None:

        data["category_id"] = request.form.get(
            "category_id",
            type=int
        )

    # --------------------------------
    # Lấy ảnh
    # --------------------------------

    image = request.files.get("image")

    if image is None:
        image = request.files.get("image_url")

    # --------------------------------
    # Validate ảnh
    # --------------------------------

    if image and image.filename:

        valid, err = validate_image_file(image)

        if not valid:

            return jsonify({
                "success": False,
                "error": err
            }), 400

    # --------------------------------
    # Validate dữ liệu
    # --------------------------------

    try:

        character_data = CharacterUpdate.model_validate(data)

    except ValidationError as exc:

        return jsonify({
            "success": False,
            "error": exc.errors()[0]["msg"]
        }), 400

    update_data = character_data.model_dump(
        exclude_unset=True
    )

    # --------------------------------
    # Upload ảnh mới nếu có
    # --------------------------------

    if image and image.filename:

        category_id = (
            data.get("category_id")
            or existing_character.category_id
        )

        try:

            image_url = save_file(
                image,
                folder="characters",
                category_id=category_id
            )

            update_data["image_url"] = image_url

        except (OSError, ValueError):

            return jsonify({
                "success": False,
                "error": "Could not save uploaded image."
            }), 500

    # --------------------------------
    # Update Character
    # --------------------------------

    character, err_msg, status_code = (
        character_crud.update_character(
            character_id,
            **update_data
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    return jsonify({
        "success": True,
        "data": character.to_dict()
    }), 200


# ============================================================
# DELETE CHARACTER
# DELETE /characters/<character_id>
# User + Admin
# ============================================================

@character_bp.delete("/<int:character_id>")
@token_required
def delete_character_api(character_id):

    character, err_msg, status_code = (
        character_crud.delete_character(
            character_id
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    return jsonify({
        "success": True,
        "message": "Character deleted successfully."
    }), 200