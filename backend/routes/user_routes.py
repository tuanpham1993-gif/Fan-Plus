import os
import re
from urllib.parse import urlparse

from flask import Blueprint, request, jsonify, g, send_from_directory
from extensions import db
from crud import auth_crud, user_crud
from middleware.auth_middleware import token_required
from utils.password_utils import hash_password, verify_password, validate_password_complexity

AVATAR_UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'avatars'))
MAX_AVATAR_SIZE = 2 * 1024 * 1024
MAX_AVATAR_SIZE_WITH_PADDING = MAX_AVATAR_SIZE + 64 * 1024
ALLOWED_AVATAR_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

user_bp = Blueprint('user', __name__, url_prefix='/api/users')


def _safe_avatar_filename(user_id, file_name):
    if not file_name:
        return None
    name = os.path.basename(file_name)
    if not name or '.' not in name:
        return None
    ext = name.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        return None
    return f"u{user_id}-{os.urandom(16).hex()}.{ext}"


def _image_magic_matches(file_bytes, extension):
    if extension in {'jpg', 'jpeg'}:
        return file_bytes.startswith(b'\xff\xd8\xff')
    if extension == 'png':
        return file_bytes.startswith(b'\x89PNG\r\n\x1a\n')
    if extension == 'webp':
        return file_bytes.startswith(b'RIFF') and file_bytes[8:12] == b'WEBP'
    return False


def _delete_old_avatar_if_needed(user, previous_avatar_url):
    if not previous_avatar_url:
        return
    if not previous_avatar_url.startswith('/api/uploads/avatars/'):
        return
    old_filename = os.path.basename(previous_avatar_url)
    if not old_filename or not old_filename.startswith(f'u{user.id}-'):
        return

    old_path = os.path.abspath(os.path.join(AVATAR_UPLOAD_DIR, old_filename))
    if os.path.commonpath([AVATAR_UPLOAD_DIR, old_path]) != AVATAR_UPLOAD_DIR:
        return
    try:
        if os.path.exists(old_path):
            os.remove(old_path)
    except OSError:
        pass


@user_bp.route('/me', methods=['GET'])
@token_required
def get_user_profile():
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200


@user_bp.route('/me', methods=['PUT'])
@token_required
def update_user_profile():
    data = request.get_json(silent=True) or {}

    try:
        updated_user = user_crud.update_user_profile(
            user=g.current_user,
            name=data.get('name'),
            favorite_fandoms=data.get('favorite_fandoms'),
            display_preferences=data.get('display_preferences')
        )
    except ValueError as exc:
        return jsonify({'message': str(exc)}), 400

    return jsonify({
        'message': 'Cập nhật hồ sơ cá nhân thành công',
        'user': updated_user.to_dict()
    }), 200


@user_bp.route('/me/password', methods=['PUT'])
@token_required
def update_user_password():
    user = g.current_user
    data = request.get_json(silent=True) or {}

    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if current_password == '' or new_password == '':
        return jsonify({'message': 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới'}), 400

    if new_password == current_password:
        return jsonify({'message': 'Mật khẩu mới không được trùng mật khẩu cũ'}), 400

    if not verify_password(user.password_hash, current_password):
        return jsonify({'message': 'Mật khẩu hiện tại không đúng'}), 400

    is_valid, err_msg = validate_password_complexity(new_password)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    try:
        user.password_hash = hash_password(new_password)
        user.reset_token = None
        auth_crud.revoke_all_refresh_tokens_for_user(user)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        return jsonify({'message': 'Không thể đổi mật khẩu. Vui lòng thử lại'}), 500

    return jsonify({
        'message': 'Đổi mật khẩu thành công',
        'user': user.to_dict()
    }), 200


@user_bp.route('/me/avatar', methods=['POST'])
@token_required
def upload_user_avatar():
    if request.content_length is not None and request.content_length > MAX_AVATAR_SIZE_WITH_PADDING:
        return jsonify({'message': 'Kích thước ảnh quá lớn. Tối đa 2MB'}), 413

    if 'avatar' not in request.files:
        return jsonify({'message': 'Thiếu file avatar'}), 400

    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'message': 'Vui lòng chọn file ảnh hợp lệ'}), 400

    file_bytes = file.read(MAX_AVATAR_SIZE + 1)
    if not file_bytes:
        return jsonify({'message': 'File ảnh không hợp lệ'}), 400

    if len(file_bytes) > MAX_AVATAR_SIZE:
        return jsonify({'message': 'Kích thước ảnh quá lớn. Tối đa 2MB'}), 413

    original_name = os.path.basename(file.filename)
    extension = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''
    if extension not in ALLOWED_AVATAR_EXTENSIONS:
        return jsonify({'message': 'Định dạng ảnh không hợp lệ. Chỉ hỗ trợ png, jpg, jpeg, webp'}), 415

    if not _image_magic_matches(file_bytes, extension):
        return jsonify({'message': 'Dữ liệu ảnh không hợp lệ'}), 415

    os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)
    new_filename = _safe_avatar_filename(g.current_user.id, original_name)
    if not new_filename:
        return jsonify({'message': 'Tên file ảnh không hợp lệ'}), 415

    save_path = os.path.join(AVATAR_UPLOAD_DIR, new_filename)
    try:
        with open(save_path, 'wb') as avatar_file:
            avatar_file.write(file_bytes)
    except OSError:
        return jsonify({'message': 'Không thể lưu ảnh avatar'}), 500

    previous_avatar_url = g.current_user.avatar or ''
    new_avatar_url = f'/api/uploads/avatars/{new_filename}'
    g.current_user.avatar = new_avatar_url
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        if os.path.exists(save_path):
            os.remove(save_path)
        return jsonify({'message': 'Lưu avatar thất bại'}), 500

    if previous_avatar_url and previous_avatar_url.startswith('/api/uploads/avatars/'):
        _delete_old_avatar_if_needed(g.current_user, previous_avatar_url)

    return jsonify({
        'message': 'Tải ảnh đại diện thành công',
        'user': g.current_user.to_dict()
    }), 200


@user_bp.route('/me/avatar', methods=['DELETE'])
@token_required
def remove_user_avatar():
    user = g.current_user
    previous_avatar_url = user.avatar or ''
    user.avatar = None

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({'message': 'Xóa avatar thất bại'}), 500

    _delete_old_avatar_if_needed(user, previous_avatar_url)

    return jsonify({
        'message': 'Xóa ảnh đại diện thành công',
        'user': user.to_dict()
    }), 200


@user_bp.route('/dashboard', methods=['GET'])
@token_required
def get_dashboard():
    dashboard_data = user_crud.get_user_dashboard(g.current_user.id)
    if not dashboard_data:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dashboard_data), 200
