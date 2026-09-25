from flask import Blueprint, request, jsonify, g
from extensions import db
from middleware.auth_middleware import token_required

user_bp = Blueprint('user', __name__, url_prefix='/api/users')

@user_bp.route('/me', methods=['GET'])
@token_required
def get_user_profile():
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200

@user_bp.route('/me', methods=['PUT'])
@token_required
def update_user_profile():
    user = g.current_user
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        user.name = data['name'].strip()
    if 'avatar' in data:
        user.avatar = data['avatar'].strip() if data['avatar'] else None

    db.session.commit()
    return jsonify({
        'message': 'Cập nhật hồ sơ cá nhân thành công',
        'user': user.to_dict()
    }), 200
