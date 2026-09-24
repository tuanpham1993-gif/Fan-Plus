from flask import Blueprint, request, jsonify
from extensions import db
from models import Character, User
from flask_jwt_extended import jwt_required, get_jwt_identity

character_bp = Blueprint('character', __name__, url_prefix='/api/characters')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

@character_bp.route('', methods=['GET'])
def get_characters():
    chars = Character.query.order_by(Character.name.asc()).all()
    return jsonify({'characters': [c.to_dict() for c in chars]}), 200

@character_bp.route('/<int:char_id>', methods=['GET'])
def get_character_detail(char_id):
    char = Character.query.get(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404
    
    # Linked content
    linked_contents = [c.to_dict(include_full=False) for c in char.contents]
    data = char.to_dict()
    data['contents'] = linked_contents
    return jsonify({'character': data}), 200

@character_bp.route('', methods=['POST'])
@jwt_required()
def create_character():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    anime_fandom = data.get('anime_fandom', '').strip()
    role_type = data.get('role_type', 'Protagonist').strip()
    bio = data.get('bio', '').strip()
    avatar = data.get('avatar', '').strip()
    banner = data.get('banner', '').strip()

    if not name or not anime_fandom:
        return jsonify({'error': 'Name and anime/fandom are required'}), 400

    char = Character(
        name=name,
        anime_fandom=anime_fandom,
        role_type=role_type,
        bio=bio,
        avatar=avatar,
        banner=banner
    )
    db.session.add(char)
    db.session.commit()

    return jsonify({'message': 'Character created', 'character': char.to_dict()}), 201

@character_bp.route('/<int:char_id>', methods=['PUT'])
@jwt_required()
def update_character(char_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    char = Character.query.get(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        char.name = data['name'].strip()
    if 'anime_fandom' in data:
        char.anime_fandom = data['anime_fandom'].strip()
    if 'role_type' in data:
        char.role_type = data['role_type'].strip()
    if 'bio' in data:
        char.bio = data['bio'].strip()
    if 'avatar' in data:
        char.avatar = data['avatar'].strip()
    if 'banner' in data:
        char.banner = data['banner'].strip()

    db.session.commit()
    return jsonify({'message': 'Character updated', 'character': char.to_dict()}), 200

@character_bp.route('/<int:char_id>', methods=['DELETE'])
@jwt_required()
def delete_character(char_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    char = Character.query.get(char_id)
    if not char:
        return jsonify({'error': 'Character not found'}), 404

    db.session.delete(char)
    db.session.commit()
    return jsonify({'message': 'Character deleted'}), 200
