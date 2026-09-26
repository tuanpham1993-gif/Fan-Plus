from functools import wraps
from flask import request, jsonify, g
from utils.jwt_utils import decode_access_token
from models.user import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Vui lòng đăng nhập để truy cập đường dẫn này (Thiếu Token xác thực)'}), 401

        token = auth_header.split(' ')[1]
        payload, error = decode_access_token(token)
        
        if error:
            return jsonify({'message': f'Phiên đăng nhập không hợp lệ hoặc đã hết hạn ({error})'}), 401

        user_id = payload.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'Tài khoản không tồn tại trong hệ thống'}), 401

        if user.status != 'active':
            return jsonify({'message': 'Tài khoản đã bị tạm khóa hoặc ngưng hoạt động'}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        current_user = g.current_user
        if current_user.role != 'admin':
            return jsonify({'message': 'Truy cập bị từ chối. Bạn không có quyền Admin'}), 403
        return f(*args, **kwargs)
    return decorated
