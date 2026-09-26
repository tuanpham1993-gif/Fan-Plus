from flask import Blueprint, request, jsonify, g
from crud import auth_crud
from schema.auth_schema import (
    validate_register_data,
    validate_login_data,
    validate_forgot_password_data,
    validate_reset_password_data
)
from utils.password_utils import hash_password, verify_password
from utils.jwt_utils import generate_access_token, generate_and_save_refresh_token
from middleware.auth_middleware import token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    
    is_valid, err_msg = validate_register_data(data)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    existing_user = auth_crud.get_user_by_email(email)
    if existing_user:
        return jsonify({'message': 'Email đã tồn tại'}), 409

    user = auth_crud.create_user(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role='user',
        status='active'
    )

    return jsonify({
        'message': 'Đăng ký tài khoản thành công',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    
    is_valid, err_msg = validate_login_data(data)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = auth_crud.get_user_by_email(email)
    if not user or not verify_password(user.password_hash, password):
        return jsonify({'message': 'Email hoặc mật khẩu không chính xác'}), 401

    if user.status != 'active':
        return jsonify({'message': 'Tài khoản đã bị tạm khóa hoặc ngưng hoạt động'}), 401

    access_token = generate_access_token(user.id, user.role)
    refresh_token = generate_and_save_refresh_token(user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_forgot_password_data(data)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    email = data.get('email', '').strip().lower()
    user = auth_crud.get_user_by_email(email)
    #print(user)
    if not user:
        return jsonify({'message': 'Nếu Email tồn tại trong hệ thống, liên kết khôi phục đã được tạo'}), 200

    reset_token = auth_crud.create_password_reset_token(user)
    reset_link = f"/reset-password?token={reset_token}"

    return jsonify({
        'message': 'Đã tạo yêu cầu khôi phục mật khẩu thành công',
        'reset_token': reset_token,
        'reset_link': reset_link
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json(silent=True) or {}
    is_valid, err_msg = validate_reset_password_data(data)
    if not is_valid:
        return jsonify({'message': err_msg}), 400

    reset_token = data.get('reset_token', '').strip()
    new_password = data.get('new_password', '')

    user = auth_crud.get_user_by_reset_token(reset_token)
    if not user:
        return jsonify({'message': 'Mã reset token không hợp lệ hoặc đã hết hạn'}), 400

    auth_crud.update_user_password(user, hash_password(new_password))

    return jsonify({'message': 'Đặt lại mật khẩu mới thành công. Vui lòng đăng nhập lại'}), 200


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json(silent=True) or {}
    token_str = data.get('refresh_token', '').strip()

    if not token_str:
        return jsonify({'message': 'Thiếu refresh_token trong request'}), 400

    token_record = auth_crud.get_refresh_token_record(token_str)
    if not token_record or not token_record.is_active():
        return jsonify({'message': 'Refresh Token không hợp lệ hoặc đã bị đứt hạn / thu hồi'}), 401

    user = auth_crud.get_user_by_id(token_record.user_id)
    if not user or user.status != 'active':
        return jsonify({'message': 'Tài khoản không hợp lệ hoặc bị tạm khóa'}), 401

    new_access_token = generate_access_token(user.id, user.role)
    return jsonify({
        'access_token': new_access_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    data = request.get_json(silent=True) or {}
    token_str = data.get('refresh_token', '').strip()

    if token_str:
        token_record = auth_crud.get_refresh_token_record(token_str)
        if token_record:
            auth_crud.revoke_refresh_token_record(token_record)

    return jsonify({'message': 'Đăng xuất thành công'}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200
