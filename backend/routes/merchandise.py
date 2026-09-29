from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from crud import merchandise_crud

from schema.merchandise_schema import (
    MerchandiseCreate,
    MerchandiseUpdate,
    MerchandiseResponse
)

from schema.character import validate_image_file

from services.media import save_file

from middleware.auth_middleware import token_required, admin_required


merchandise_bp = Blueprint(
    "merchandise",
    __name__,
    url_prefix="/merchandise"
)


@merchandise_bp.get("")
def get_merchandise_api():

    category_id = request.args.get(
        "category_id",
        type=int
    )

    character_id = request.args.get(
        "character_id",
        type=int
    )

    tag = request.args.get(
        "tag",
        type=str
    )

    is_upcoming = request.args.get(
        "is_upcoming"
    )

    search = request.args.get(
        "search",
        type=str
    )

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

    items, total, pages = (
        merchandise_crud.get_merchandise_list(
            category_id=category_id,
            character_id=character_id,
            tag=tag,
            is_upcoming=is_upcoming,
            search=search,              
            page=page,
            limit=limit
        )
    )

    return jsonify({
        "success": True,
        "data": [
            MerchandiseResponse.model_validate(item).model_dump(
                mode="json"
            )
            for item in items
        ],
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages
        }
    }), 200


@merchandise_bp.get("/<int:merchandise_id>")
def get_merchandise_detail_api(merchandise_id):

    item = merchandise_crud.get_merchandise(
        merchandise_id,
        increment_view=True
    )

    if item is None:

        return jsonify({
            "success": False,
            "error": "Merchandise not found."
        }), 404

    response = MerchandiseResponse.model_validate(item)

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 200


@merchandise_bp.post("")
@admin_required
def create_merchandise_api():

    data = request.form.to_dict()

    image = request.files.get("image")

    if image is None:
        image = request.files.get("image_url")

    if image and image.filename:

        valid, err = validate_image_file(image)

        if not valid:

            return jsonify({
                "success": False,
                "error": err
            }), 400

    try:

        merchandise_data = MerchandiseCreate(
            **data
        )

    except ValidationError as e:

        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    data = merchandise_data.model_dump()

    if image and image.filename:

        try:

            image_url = save_file(
                image,
                folder="merchandise",
                category_id=merchandise_data.category_id
            )

            data["image_url"] = image_url

        except (OSError, ValueError):

            return jsonify({
                "success": False,
                "error": "Could not save uploaded image."
            }), 500

    item, err_msg, status_code = (
        merchandise_crud.create_merchandise(
            **data
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    response = MerchandiseResponse.model_validate(
        item
    )

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 201


@merchandise_bp.put("/<int:merchandise_id>")
@admin_required
def update_merchandise_api(merchandise_id):

    existing_item = merchandise_crud.get_merchandise(merchandise_id)
    if existing_item is None:
        return jsonify({
            "success": False,
            "error": "Merchandise not found."
        }), 404

    data = request.form.to_dict()
    image = request.files.get("image")

    if image is None:
        image = request.files.get("image_url")

    if image and image.filename:
        valid, err = validate_image_file(image)
        if not valid:
            return jsonify({"success": False, "error": err}), 400

    for field in ("character_id", "tag"):
        if field in data and data[field] == "":
            data[field] = None

    try:
        merchandise_data = MerchandiseUpdate(**data)
    except ValidationError as exc:
        return jsonify({
            "success": False,
            "error": exc.errors()
        }), 400

    update_data = merchandise_data.model_dump(exclude_unset=True)

    if image and image.filename:
        category_id = update_data.get("category_id") or existing_item.category_id
        try:
            update_data["image_url"] = save_file(
                image,
                folder="merchandise",
                category_id=category_id
            )
        except (OSError, ValueError):
            return jsonify({
                "success": False,
                "error": "Could not save uploaded image."
            }), 500

    item, err_msg, status_code = merchandise_crud.update_merchandise(
        merchandise_id,
        **update_data
    )

    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    response = MerchandiseResponse.model_validate(item)
    return jsonify({
        "success": True,
        "data": response.model_dump(mode="json")
    }), 200


@merchandise_bp.delete("/<int:merchandise_id>")
@admin_required
def delete_merchandise_api(merchandise_id):

    item, err_msg, status_code = merchandise_crud.delete_merchandise(
        merchandise_id
    )

    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "message": "Merchandise deleted successfully."
    }), 200