from flask import Blueprint, request, jsonify, g
from crud import user_crud
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
    data = request.get_json(silent=True) or {}

    updated_user = user_crud.update_user_profile(
        user=user,
        name=data.get('name'),
        avatar=data.get('avatar'),
        favorite_fandoms=data.get('favorite_fandoms'),
        display_preferences=data.get('display_preferences')
    )

    return jsonify({
        'message': 'Cập nhật hồ sơ cá nhân thành công',
        'user': updated_user.to_dict()
    }), 200

@user_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    dashboard_data = user_crud.get_user_dashboard(g.current_user.id)
    if not dashboard_data:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dashboard_data), 200
