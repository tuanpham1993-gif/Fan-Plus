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


# ============================================================
# GET ALL CATEGORIES
# GET /categories
#
# Có hỗ trợ:
# GET /categories
# GET /categories?search=Anime
#
# User có thể xem
# ============================================================

@category_bp.get("")
def get_categories_api():

    # --------------------------------
    # Get search keyword
    # --------------------------------

    search = request.args.get("search")

    # --------------------------------
    # Get categories
    # --------------------------------

    categories = category_crud.get_all_categories(
        search=search
    )

    # --------------------------------
    # Response
    # --------------------------------

    return jsonify({
        "success": True,
        "data": [
            CategoryResponse
                .model_validate(category)
                .model_dump(mode="json")
            for category in categories
        ]
    }), 200


# ============================================================
# GET ONE CATEGORY
# GET /categories/<category_id>
#
# User có thể xem
# ============================================================

@category_bp.get("/<int:category_id>")
def get_category_api(category_id):

    # --------------------------------
    # Get category
    # --------------------------------

    category = category_crud.get_category(
        category_id
    )

    # --------------------------------
    # Category not found
    # --------------------------------

    if category is None:

        return jsonify({
            "success": False,
            "error": "Category not found."
        }), 404

    # --------------------------------
    # Convert to Pydantic response
    # --------------------------------

    response = CategoryResponse.model_validate(
        category
    )

    # --------------------------------
    # Response
    # --------------------------------

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 200


# ============================================================
# CREATE CATEGORY
# POST /categories
#
# CHỈ ADMIN
# ============================================================

@category_bp.post("")
@admin_required
def create_category_api():

    # --------------------------------
    # Get request data
    # --------------------------------

    data = (
        request.get_json(silent=True)
        or request.form.to_dict()
    )

    # --------------------------------
    # Pydantic validation
    # --------------------------------

    try:

        category_data = CategoryCreate(
            **data
        )

    except ValidationError as e:

        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    # --------------------------------
    # Create category
    # --------------------------------

    category, err_msg, status_code = (
        category_crud.create_category(
            category_data.name,
            category_data.description
        )
    )

    # --------------------------------
    # CRUD error
    # --------------------------------

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    # --------------------------------
    # Response
    # --------------------------------

    response = CategoryResponse.model_validate(
        category
    )

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 201


# ============================================================
# UPDATE CATEGORY
# PUT /categories/<category_id>
#
# CHỈ ADMIN
# ============================================================

@category_bp.put("/<int:category_id>")
@admin_required
def update_category_api(category_id):

    # --------------------------------
    # Get request data
    # --------------------------------

    data = (
        request.get_json(silent=True)
        or request.form.to_dict()
    )

    # --------------------------------
    # Pydantic validation
    # --------------------------------

    try:

        category_data = CategoryUpdate(
            **data
        )

    except ValidationError as e:

        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    # --------------------------------
    # Get only fields sent by client
    # --------------------------------

    update_data = category_data.model_dump(
        exclude_unset=True
    )

    # --------------------------------
    # Update category
    # --------------------------------

    category, err_msg, status_code = (
        category_crud.update_category(
            category_id,
            update_data
        )
    )

    # --------------------------------
    # CRUD error
    # --------------------------------

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    # --------------------------------
    # Response
    # --------------------------------

    response = CategoryResponse.model_validate(
        category
    )

    return jsonify({
        "success": True,
        "data": response.model_dump(
            mode="json"
        )
    }), 200


# ============================================================
# DELETE CATEGORY
# DELETE /categories/<category_id>
#
# CHỈ ADMIN
# ============================================================

@category_bp.delete("/<int:category_id>")
@admin_required
def delete_category_api(category_id):

    # --------------------------------
    # Delete category
    # --------------------------------

    category, err_msg, status_code = (
        category_crud.delete_category(
            category_id
        )
    )

    # --------------------------------
    # CRUD error
    # --------------------------------

    if err_msg:

        return jsonify({
            "success": False,
            "error": err_msg
        }), status_code

    # --------------------------------
    # Success
    # --------------------------------

    return jsonify({
        "success": True,
        "message": "Category deleted successfully."
    }), 200