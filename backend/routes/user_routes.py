from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

def is_admin(user_id):
    u = User.query.get(int(user_id))
    return u and u.role and u.role.name == 'Admin'

@user_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    users = User.query.order_by(User.id.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]}), 200


@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user_detail(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Allow update only if self or admin
    if int(current_user_id) != user_id and not is_admin(current_user_id):
        return jsonify({'error': 'Permission denied'}), 403

    data = request.get_json() or {}
    
    if 'full_name' in data:
        user.full_name = data['full_name'].strip()
    if 'avatar' in data:
        user.avatar = data['avatar'].strip()
    if 'bio' in data:
        user.bio = data['bio'].strip()
    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    # Admin role update privilege
    if 'role_id' in data and is_admin(current_user_id):
        user.role_id = int(data['role_id'])

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict()}), 200


@user_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    if not is_admin(current_user_id):
        return jsonify({'error': 'Admin privilege required'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.id == int(current_user_id):
        return jsonify({'error': 'Cannot delete your own admin account'}), 400

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200
