from flask import Blueprint, jsonify, request
from crud import category_crud
from schema.category_schema import validate_category_data

admin_category_bp = Blueprint('admin_category_bp', __name__)

#tạo route để lấy danh sách các category
#def create tạo danh sách các category
@admin_category_bp.post('/api/admin/categories')
def create_category():
    data = request.get_json(silent=True) or request.form.to_dict()
    errors = validate_category_data(data, is_update=False)
    if errors:
        return jsonify({"success": False, "error": errors[0]}), 400

    name = data.get("name")
    description = data.get("description")

    category, err_msg, status_code = category_crud.create_category(name, description)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "data": category.to_dict()
    }), 201

@admin_category_bp.put('/api/admin/categories/<int:id>')
def update_category(id):
    data = request.get_json(silent=True) or request.form.to_dict()
    errors = validate_category_data(data, is_update=True)
    if errors:
        return jsonify({"success": False, "error": errors[0]}), 400

    category, err_msg, status_code = category_crud.update_category(id, data)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "data": category.to_dict()
    }), 200

@admin_category_bp.delete('/api/admin/categories/<int:id>')
def delete_category(id):
    success, err_msg, status_code = category_crud.delete_category(id)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "message": "Category deleted successfully."
    }), 200
