from flask import Blueprint, jsonify, request
from crud import character_crud
from schema.character import validate_character_data, validate_image_file, validate_image_url

admin_character_bp = Blueprint('admin_character_bp', __name__)

@admin_character_bp.get('/api/admin/characters')
def get_admin_characters():
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)

    items, total, pages = character_crud.get_characters(page=page, limit=limit)

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

@admin_character_bp.post('/api/admin/characters')
def create_character():
    data = request.get_json(silent=True) or request.form.to_dict()
    if not isinstance(data, dict):
        data = {}

    # Check uploaded file if any
    file_obj = request.files.get('image') or request.files.get('image_url')
    if file_obj:
        valid, err = validate_image_file(file_obj)
        if not valid:
            return jsonify({"success": False, "error": err}), 400
        data['image_url'] = f"/static/uploads/{file_obj.filename}"

    errors = validate_character_data(data, is_update=False)
    if errors:
        return jsonify({"success": False, "error": errors[0]}), 400

    character, err_msg, status_code = character_crud.create_character(data)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "data": character.to_dict()
    }), 201

@admin_character_bp.put('/api/admin/characters/<int:id>')
def update_character(id):
    data = request.get_json(silent=True) or request.form.to_dict()
    if not isinstance(data, dict):
        data = {}

    file_obj = request.files.get('image') or request.files.get('image_url')
    if file_obj:
        valid, err = validate_image_file(file_obj)
        if not valid:
            return jsonify({"success": False, "error": err}), 400
        data['image_url'] = f"/static/uploads/{file_obj.filename}"

    errors = validate_character_data(data, is_update=True)
    if errors:
        return jsonify({"success": False, "error": errors[0]}), 400

    character, err_msg, status_code = character_crud.update_character(id, data)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "data": character.to_dict()
    }), 200

@admin_character_bp.delete('/api/admin/characters/<int:id>')
def delete_character(id):
    success, err_msg, status_code = character_crud.delete_character(id)
    if err_msg:
        return jsonify({"success": False, "error": err_msg}), status_code

    return jsonify({
        "success": True,
        "message": "Character deleted successfully."
    }), 200
