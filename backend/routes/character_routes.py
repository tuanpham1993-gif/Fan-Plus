from flask import Blueprint, request, jsonify
from crud import character_crud
from schema.character_schema import validate_character_data
from middleware.auth_middleware import admin_required

character_bp = Blueprint('character', __name__, url_prefix='/api/characters')

@character_bp.route('', methods=['GET'])
def get_characters():
    chars = character_crud.get_all_characters()
    return jsonify({'characters': [c.to_dict() for c in chars]}), 200

@character_bp.route('/<int:char_id>', methods=['GET'])
def get_character_detail(char_id):
    char = character_crud.get_character_by_id(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    
    linked_contents = [c.to_dict(include_full=False) for c in char.contents]
    data = char.to_dict()
    data['contents'] = linked_contents
    return jsonify({'character': data}), 200

@character_bp.route('', methods=['POST'])
@admin_required
def create_character():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_character_data(data, is_update=False)
    if not is_valid:
        return jsonify({'error': err_msg}), 400

    char = character_crud.create_character(
        name=data.get('name', '').strip(),
        anime_fandom=data.get('anime_fandom', '').strip(),
        role_type=data.get('role_type', 'Protagonist').strip(),
        bio=data.get('bio', '').strip(),
        avatar=data.get('avatar', '').strip(),
        banner=data.get('banner', '').strip()
    )

    return jsonify({'message': 'Character created', 'character': char.to_dict()}), 201

@character_bp.route('/<int:char_id>', methods=['PUT'])
@admin_required
def update_character(char_id):
    char = character_crud.get_character_by_id(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    data = request.get_json(silent=True) or {}
    updated_char = character_crud.update_character(
        char,
        name=data['name'].strip() if 'name' in data else None,
        anime_fandom=data['anime_fandom'].strip() if 'anime_fandom' in data else None,
        role_type=data['role_type'].strip() if 'role_type' in data else None,
        bio=data['bio'].strip() if 'bio' in data else None,
        avatar=data['avatar'].strip() if 'avatar' in data else None,
        banner=data['banner'].strip() if 'banner' in data else None
    )

    return jsonify({'message': 'Character updated', 'character': updated_char.to_dict()}), 200

@character_bp.route('/<int:char_id>', methods=['DELETE'])
@admin_required
def delete_character(char_id):
    char = character_crud.get_character_by_id(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    character_crud.delete_character(char)
    return jsonify({'message': 'Character deleted'}), 200
