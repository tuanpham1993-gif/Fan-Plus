from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from crud import category_crud
from schema.category_schema import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse
)


category_bp = Blueprint(
    "category",
    __name__,
    url_prefix="/categories"
)


# ============================================================
# GET ALL CATEGORIES
# GET /categories
# ============================================================

@category_bp.get("")
def get_categories_api():

    categories = category_crud.get_all_categories()

    return jsonify({
        "success": True,
        "data": [
            CategoryResponse.model_validate(category).model_dump(mode="json")
            for category in categories
        ]
    }), 200


# ============================================================
# CREATE CATEGORY
# POST /categories
# ============================================================

@category_bp.post("")
def create_category_api():

    # Lấy dữ liệu từ JSON hoặc form
    data = (
        request.get_json(silent=True)
        or request.form.to_dict()
    )

    # Validate bằng Pydantic
    try:
        category_data = CategoryCreate(**data)

    except ValidationError as e:
        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    # Tạo category
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

    # Response bằng Pydantic
    response = CategoryResponse.model_validate(category)

    return jsonify({
        "success": True,
        "data": response.model_dump(mode="json")
    }), 201


# ============================================================
# UPDATE CATEGORY
# PUT /categories/<category_id>
# ============================================================

@category_bp.put("/<int:category_id>")
def update_category_api(category_id):

    # Lấy dữ liệu từ JSON hoặc form
    data = (
        request.get_json(silent=True)
        or request.form.to_dict()
    )

    # Validate bằng Pydantic
    try:
        category_data = CategoryUpdate(**data)

    except ValidationError as e:
        return jsonify({
            "success": False,
            "error": e.errors()
        }), 400

    # Chuyển Pydantic object thành dictionary
    update_data = category_data.model_dump(
        exclude_unset=True
    )

    # Update category
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

    # Response bằng Pydantic
    response = CategoryResponse.model_validate(category)

    return jsonify({
        "success": True,
        "data": response.model_dump(mode="json")
    }), 200


# ============================================================
# DELETE CATEGORY
# DELETE /categories/<category_id>
# ============================================================

@category_bp.delete("/<int:category_id>")
def delete_category_api(category_id):

    success, err_msg, status_code = (
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