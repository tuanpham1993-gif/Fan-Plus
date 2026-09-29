from functools import wraps
from flask import request, jsonify, g
from utils.jwt_utils import decode_access_token
from models.user import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Please log in to access this route (Missing authentication token)'}), 401

        token = auth_header.split(' ')[1]
        payload, error = decode_access_token(token)
        
        if error:
            return jsonify({'message': f'Invalid or expired session ({error})'}), 401

        user_id = payload.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'message': 'Account does not exist in the system'}), 401

        if user.status != 'active':
            return jsonify({'message': 'Account has been suspended or deactivated'}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated

def get_optional_user():
    """Return the active user behind a valid Bearer token, or None for visitors.

    Public endpoints use this to widen what a signed-in user may see without
    rejecting anonymous requests.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    payload, error = decode_access_token(auth_header.split(' ')[1])
    if error or not payload:
        return None
    user = User.query.get(payload.get('user_id'))
    if not user or user.status != 'active':
        return None
    return user

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        current_user = g.current_user
        if current_user.role != 'admin':
            return jsonify({'message': 'Access denied. You do not have Admin permission'}), 403
        return f(*args, **kwargs)
    return decorated