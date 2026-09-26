from flask import Blueprint, jsonify, request
from crud import merchandise_crud
from schema.merchandise_schema import validate_merchandise_data
from schema.character import validate_image_file

admin_merchandise_bp = Blueprint('admin_merchandise_bp', __name__)

@admin_merchandise_bp.get('/api/admin/merchandise')
def get_admin_merchandise():
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)

    items, total, pages = merchandise_crud.get_merchandise(page=page, limit=limit)

    return jsonify({
        "success": True,
        "data": [item.to_dict() for item in items],
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages
        }
    }), 200

@admin_merchandise_bp.post('/api/admin/merchandise')
def create_merchandise():
    data = request.get_json(silent=True) or request.form.to_dict()
    if not isinstance(data, dict):
        data = {}

    file_obj = request.files.get('image') or request.files.get('image_url')
    if file_obj:
        valid, err = validate_image_file(file_obj)
        if not valid:
            return jsonify({"success": False, "error": err}), 400
        data['image_url'] = f"/static/uploads/{file_obj.filename}"

    errors = validate_merchandise_data(data, is_update=False)
    if errors:
        return jsonify({"success": False, "error": errors[0]}), 400

    item, err_msg, status_code = merchandise_crud.create_merchandise(data)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "data": item.to_dict()
    }), 201

@admin_merchandise_bp.put('/api/admin/merchandise/<int:id>')
def update_merchandise(id):
    data = request.get_json(silent=True) or request.form.to_dict()
    if not isinstance(data, dict):
        data = {}

    file_obj = request.files.get('image') or request.files.get('image_url')
    if file_obj:
        valid, err = validate_image_file(file_obj)
        if not valid:
            return jsonify({"success": False, "error": err}), 400
        data['image_url'] = f"/static/uploads/{file_obj.filename}"

    errors = validate_merchandise_data(data, is_update=True)
    if errors:
        return jsonify({"success": False, "error": errors[0]}), 400

    item, err_msg, status_code = merchandise_crud.update_merchandise(id, data)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "data": item.to_dict()
    }), 200

@admin_merchandise_bp.delete('/api/admin/merchandise/<int:id>')
def delete_merchandise(id):
    success, err_msg, status_code = merchandise_crud.delete_merchandise(id)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "message": "Merchandise item deleted successfully."
    }), 200
