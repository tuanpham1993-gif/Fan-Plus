import jwt
import uuid
from datetime import datetime, timedelta
from flask import current_app
from extensions import db
from models.refresh_token import RefreshToken

def generate_access_token(user_id: int, role: str) -> str:
    secret = current_app.config.get('JWT_SECRET_KEY', 'change_this_secret')
    expires_in_seconds = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 900)
    
    payload = {
        'user_id': user_id,
        'role': role,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(seconds=expires_in_seconds)
    }
    
    return jwt.encode(payload, secret, algorithm='HS256')

def decode_access_token(token: str) -> tuple[dict | None, str | None]:
    secret = current_app.config.get('JWT_SECRET_KEY', 'change_this_secret')
    try:
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token đã hết hạn (Token expired)"
    except jwt.InvalidTokenError:
        return None, "Token không hợp lệ (Invalid token)"

def generate_and_save_refresh_token(user_id: int) -> str:
    raw_token = str(uuid.uuid4())
    expires_in_seconds = current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 604800)
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds)

    refresh_token = RefreshToken(
        user_id=user_id,
        token=raw_token,
        expires_at=expires_at
    )
    db.session.add(refresh_token)
    db.session.commit()
    

    return raw_token
