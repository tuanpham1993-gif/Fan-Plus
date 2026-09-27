from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from crud import category_crud

from schema.category_schema import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse
)

from middleware.auth_middleware import admin_required


category_bp = Blueprint(
    "category",
    __name__,
    url_prefix="/categories"
)


@category_bp.get("")
def get_categories_api():

    search = request.args.get("search")

    categories = category_crud.get_all_categories(
        search=search
    )

    return jsonify({
        "success": True,
        "data": [
            CategoryResponse
                .model_validate(category)
                .model_dump(mode="json")
            for category in categories
        ]
    }), 200


@category_bp.get("/<int:category_id>")
def get_category_api(category_id):

    category = category_crud.get_category(
        category_id
    )

    if category is None:

        return jsonify({
            "success": False,
            "error": "Category not found."
        }), 404

    response = CategoryResponse.model_validate(
        category
    )

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 200


@category_bp.post("")
@admin_required
def create_category_api():

    data = (
        request.get_json(silent=True)
        or request.form.to_dict()
    )

    try:

        category_data = CategoryCreate(
            **data
        )

    except ValidationError as e:

        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    category, err_msg, status_code = (
        category_crud.create_category(
            category_data.name,
            category_data.description
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    response = CategoryResponse.model_validate(
        category
    )

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 201


@category_bp.put("/<int:category_id>")
@admin_required
def update_category_api(category_id):

    data = (
        request.get_json(silent=True)
        or request.form.to_dict()
    )

    try:

        category_data = CategoryUpdate(
            **data
        )

    except ValidationError as e:

        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    update_data = category_data.model_dump(
        exclude_unset=True
    )

    category, err_msg, status_code = (
        category_crud.update_category(
            category_id,
            update_data
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    response = CategoryResponse.model_validate(
        category
    )

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 200


@category_bp.delete("/<int:category_id>")
@admin_required
def delete_category_api(category_id):

    category, err_msg, status_code = (
        category_crud.delete_category(
            category_id
        )
    )

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    return jsonify({
        "success": True,
        "message": "Category deleted successfully."
    }), 200