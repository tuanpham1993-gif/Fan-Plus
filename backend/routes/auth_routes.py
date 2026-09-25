from datetime import datetime
from flask import Blueprint, request, jsonify, g
from extensions import db
from models import User, RefreshToken
from utils.password_utils import validate_password_complexity, hash_password, verify_password
from utils.jwt_utils import generate_access_token, generate_and_save_refresh_token
from utils.recaptcha_utils import verify_recaptcha
from middleware.auth_middleware import token_required
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    #captcha_token = data.get('captcha_token', '').strip()

    if not name or not email or not password:
        return jsonify({'message': 'Vui lòng nhập đầy đủ Tên, Email và Mật khẩu'}), 400

    # 1. Verify CAPTCHA token first before creating user
    #is_captcha_valid, captcha_err = verify_recaptcha(captcha_token)
    #if not is_captcha_valid:
    #    return jsonify({'message': captcha_err}), 400

    # 2. Email format validation
    email_regex = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(email_regex, email):
        return jsonify({'message': 'Định dạng email không hợp lệ'}), 400

    # 3. Validate password complexity
    is_valid_pw, pw_error = validate_password_complexity(password)
    if not is_valid_pw:
        return jsonify({'message': pw_error}), 400

    # 4. Check if email already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'message': 'Email đã tồn tại'}), 409

    # 5. Create new user
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role='user',
        status='active'
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Đăng ký tài khoản thành công',
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    #captcha_token = data.get('captcha_token', '').strip()

    if not email or not password:
        return jsonify({'message': 'Vui lòng nhập Email và Mật khẩu'}), 400

    # 1. Verify CAPTCHA token first before authenticating user
    #is_captcha_valid, captcha_err = verify_recaptcha(captcha_token)
    #if not is_captcha_valid:
    #    return jsonify({'message': captcha_err}), 400

    # 2. Verify User & Password
    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(user.password_hash, password):
        return jsonify({'message': 'Email hoặc mật khẩu không chính xác'}), 401

    if user.status != 'active':
        return jsonify({'message': 'Tài khoản đã bị tạm khóa hoặc ngưng hoạt động'}), 401

    # 3. Generate tokens
    access_token = generate_access_token(user.id, user.role)
    refresh_token = generate_and_save_refresh_token(user.id)

    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json() or {}
    token_str = data.get('refresh_token', '').strip()

    if not token_str:
        return jsonify({'message': 'Thiếu refresh_token trong request'}), 400

    token_record = RefreshToken.query.filter_by(token=token_str).first()
    if not token_record or not token_record.is_active():
        return jsonify({'message': 'Refresh Token không hợp lệ hoặc đã bị đứt hạn / thu hồi'}), 401

    user = User.query.get(token_record.user_id)
    if not user or user.status != 'active':
        return jsonify({'message': 'Tài khoản không hợp lệ hoặc bị tạm khóa'}), 401

    new_access_token = generate_access_token(user.id, user.role)
    return jsonify({
        'access_token': new_access_token
    }), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    data = request.get_json() or {}
    token_str = data.get('refresh_token', '').strip()

    if token_str:
        token_record = RefreshToken.query.filter_by(token=token_str).first()
        if token_record and token_record.revoked_at is None:
            token_record.revoked_at = datetime.utcnow()
            db.session.commit()

    return jsonify({'message': 'Đăng xuất thành công'}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_me():
    return jsonify({
        'user': g.current_user.to_dict()
    }), 200
